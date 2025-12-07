// dashboard.js

// Firestore reference (firebase initialized in index.html)
const db = firebase.firestore();

// Local cache
let people = {};

// Load all training records from Firestore
function loadDashboard() {
  db.collection("trainingRecords").get().then(snapshot => {
    people = {};
    snapshot.forEach(doc => {
      people[doc.id] = doc.data().records || [];
    });
    console.log("Loaded dashboard data:", people);
    renderDashboard();
  }).catch(err => {
    console.error("Error loading dashboard:", err);
  });
}

// Render dashboard UI
function renderDashboard() {
  const dash = document.getElementById("dashboard");
  dash.innerHTML = "";

  if (Object.keys(people).length === 0) {
    dash.innerHTML = "<p>No training records found.</p>";
    return;
  }

  Object.keys(people).forEach(name => {
    const personDiv = document.createElement("div");
    personDiv.className = "person-block";

    const header = document.createElement("h3");
    header.textContent = name;
    personDiv.appendChild(header);

    const list = document.createElement("ul");

    // Sort records by refresher due date
    const today = new Date();
    const sortedRecords = people[name].slice().sort((a, b) => {
      let refresherA = new Date(a.date);
      refresherA.setFullYear(refresherA.getFullYear() + 3);
      let refresherB = new Date(b.date);
      refresherB.setFullYear(refresherB.getFullYear() + 3);
      return refresherA - refresherB;
    });

    sortedRecords.forEach(record => {
      let trainDate = new Date(record.date);
      let refresherDate = new Date(trainDate);
      refresherDate.setFullYear(trainDate.getFullYear() + 3);

      let diffDays = Math.floor((refresherDate - today) / (1000 * 60 * 60 * 24));
      let statusClass = "ok";
      if (diffDays < 0) statusClass = "overdue";
      else if (diffDays <= 30) statusClass = "dueSoon";

      const li = document.createElement("li");
      li.className = statusClass;
      li.textContent = `${record.equipment} → refresher due ${refresherDate.toDateString()}`;
      list.appendChild(li);
    });

    personDiv.appendChild(list);

    // Link to edit person
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit Records";
    editBtn.onclick = () => {
      window.location.href = `person.html?name=${encodeURIComponent(name)}`;
    };
    personDiv.appendChild(editBtn);

    dash.appendChild(personDiv);
  });
}

// Initial load
loadDashboard();