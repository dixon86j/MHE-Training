// person.js

// Firestore reference (firebase initialized in index.html)
const db = firebase.firestore();

// Get person name from query string (?name=Jay)
const params = new URLSearchParams(window.location.search);
const personName = params.get("name");
document.getElementById("personName").textContent = personName;

// Local cache
let people = {};

// Load existing records for this person from Firestore
db.collection("trainingRecords").doc(personName).get().then(doc => {
  if (doc.exists) {
    people[personName] = doc.data().records || [];
  } else {
    people[personName] = [];
  }
  showTraining(personName);
});

// Show training info with refresher logic
function showTraining(name) {
  const infoDiv = document.getElementById("trainingInfo");
  infoDiv.innerHTML = "";

  if (!people[name] || people[name].length === 0) {
    infoDiv.innerHTML = `<p>No training records yet for ${name}.</p>`;
    return;
  }

  const today = new Date();

  const sortedRecords = people[name].slice().sort((a, b) => {
    let refresherA = new Date(a.date);
    refresherA.setFullYear(refresherA.getFullYear() + 3);
    let refresherB = new Date(b.date);
    refresherB.setFullYear(refresherB.getFullYear() + 3);
    return refresherA - refresherB;
  });

  sortedRecords.forEach((record, index) => {
    let trainDate = new Date(record.date);
    let refresherDate = new Date(trainDate);
    refresherDate.setFullYear(trainDate.getFullYear() + 3);

    let diffDays = Math.floor((refresherDate - today) / (1000 * 60 * 60 * 24));
    let statusClass = "ok";
    if (diffDays < 0) statusClass = "overdue";
    else if (diffDays <= 30) statusClass = "dueSoon";

    infoDiv.innerHTML += `
      <div class="record ${statusClass}" data-index="${index}">
        <p>
          <strong>${record.equipment}</strong> trained on 
          ${trainDate.toDateString()} → refresher due 
          ${refresherDate.toDateString()}
        </p>
        <button class="editBtn">Edit</button>
        <button class="deleteBtn">Delete</button>
      </div>`;
  });

  attachHandlers(name);
}

// Attach handlers for edit/delete
function attachHandlers(name) {
  // Delete
  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.parentElement.getAttribute("data-index");
      if (confirm("Are you sure you want to delete this training record?")) {
        people[name].splice(idx, 1);
        showTraining(name);
      }
    });
  });

  // Edit inline
  document.querySelectorAll(".editBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const container = e.target.parentElement;
      const idx = container.getAttribute("data-index");
      const record = people[name][idx];

      container.innerHTML = `
        <p>
          <input type="text" id="editEquipment${idx}" value="${record.equipment}">
          <input type="date" id="editDate${idx}" value="${record.date}">
        </p>
        <button class="updateBtn" data-index="${idx}">Update</button>
        <button class="cancelBtn" data-index="${idx}">Cancel</button>
      `;

      // Update
      container.querySelector(".updateBtn").addEventListener("click", () => {
        const newEquipment = document.getElementById(`editEquipment${idx}`).value;
        const newDate = document.getElementById(`editDate${idx}`).value;
        if (newEquipment && newDate) {
          people[name][idx] = {equipment: newEquipment, date: newDate};
          showTraining(name);
        }
      });

      // Cancel
      container.querySelector(".cancelBtn").addEventListener("click", () => {
        showTraining(name);
      });
    });
  });
}

// Add new training
document.getElementById("addBtn").addEventListener("click", () => {
  const selectedDate = document.getElementById("trainingDate").value;
  if (!selectedDate) {
    alert("Please select a training date.");
    return;
  }

  if (!people[personName]) people[personName] = [];

  document.querySelectorAll(".mheOption:checked").forEach(box => {
    people[personName].push({equipment: box.value, date: selectedDate});
    box.checked = false;
  });

  showTraining(personName);
});

// Save button → now saves to Firestore
document.getElementById("saveBtn").addEventListener("click", async () => {
  try {
    await db.collection("trainingRecords").doc(personName).set({
      records: people[personName]
    });
    const msg = document.getElementById("saveMessage");
    msg.style.display = "block";
    msg.textContent = "Saved to cloud ✅";
    setTimeout(() => { msg.style.display = "none"; }, 2000);
  } catch (err) {
    console.error("Error saving:", err);
    alert("Save failed: " + err.message);
  }
});

// Back/Home button
document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "index.html";
});