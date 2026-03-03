const API_URL = "https://umar-k20u.onrender.com";

// ================== ADD ALERT ==================
async function submitAlert() {
  const type = document.getElementById("alert_type").value;
  const title = document.getElementById("alert_title").value.trim();
  const country = document.getElementById("alert_country").value;
  const due = document.getElementById("alert_due").value;
  const reminder = document.getElementById("alert_reminder").value;

  if (!title || !due) {
    alert("Title and Due Date are required!");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/add_alert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: "user_1",
        alert_type: type,
        title: title,
        country: country,
        due_date: due,
        reminder_days: reminder
      })
    });

    const data = await res.json();
    alert(data.reply || "Reminder saved successfully!");
    showDueAlerts();
  } catch (err) {
    alert("Server error. Please try again later.");
  }
}

// ================== SHOW ALERTS ==================
async function showDueAlerts() {
  const container = document.getElementById("due_alerts");
  container.innerHTML = "<p class='muted'>Loading…</p>";

  try {
    const res = await fetch(`${API_URL}/due_alerts`);
    const alerts = await res.json();

    if (!alerts.length) {
      container.innerHTML = "<p class='muted'>No reminders found.</p>";
      return;
    }

    container.innerHTML = "";

    alerts.forEach(a => {
      const alert = a.alert;
      const div = document.createElement("div");
      div.className = "alert-card";

      div.innerHTML = `
        <h3>${alert.title}</h3>
        <p><b>Type:</b> ${alert.type}</p>
        <p><b>Country:</b> ${alert.country}</p>
        <p><b>Due Date:</b> ${alert.due_date}</p>
        <p><b>Reminder:</b> ${alert.reminder_days} day(s) before</p>

        <div class="card-actions">
          <button class="edit-btn" onclick="openEdit('${alert.id}','${alert.title}','${alert.due_date}','${alert.reminder_days}','${alert.country}','${alert.type}')">✏ Edit</button>
          <button class="done-btn" onclick="markComplete('${alert.id}')">✓ Done</button>
          <button class="delete-btn" onclick="deleteAlert('${alert.id}')">🗑 Delete</button>
        </div>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    container.innerHTML = "<p style='color:red'>Fetch error</p>";
  }
}

// ================== OPEN EDIT ==================
function openEdit(id, title, due, reminder, country, type) {

  const newTitle = prompt("Edit Title:", title);
  if (!newTitle) return;

  const newDate = prompt("Edit Due Date (YYYY-MM-DD):", due);
  if (!newDate) return;

  const newReminder = prompt("Edit Reminder Days:", reminder);
  if (!newReminder) return;

  updateAlert(id, newTitle, newDate, newReminder, country, type);
}

// ================== UPDATE ALERT ==================
async function updateAlert(id, title, due, reminder, country, type) {
  try {
    await fetch(`${API_URL}/edit_alert/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title,
        due_date: due,
        reminder_days: reminder,
        country: country,
        type: type
      })
    });

    alert("Updated successfully!");
    showDueAlerts();
  } catch (err) {
    alert("Update failed");
  }
}

// ================== DELETE ==================
async function deleteAlert(id) {
  if (!confirm("Delete this reminder?")) return;

  await fetch(`${API_URL}/delete_alert/${id}`, { method: "DELETE" });
  showDueAlerts();
}

// ================== COMPLETE ==================
async function markComplete(id) {
  await fetch(`${API_URL}/complete_alert/${id}`, { method: "POST" });
  showDueAlerts();
}

// auto load
showDueAlerts();
