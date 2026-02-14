const API_URL = "https://umar-k20u.onrender.com";

// ================== ADD ALERT ==================
async function submitAlert() {
  const type = document.getElementById("alert_type").value;
  const title = document.getElementById("alert_title").value.trim();
  const country = document.getElementById("alert_country").value;
  const due = document.getElementById("alert_due").value;
  const reminder = document.getElementById("alert_reminder").value;

  if (!title || !due) {
    alert("⚠️ Title aur Due Date zaruri hai!");
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
    alert(data.reply || "✅ Reminder save ho gaya!");
    showDueAlerts();

  } catch (err) {
    alert("❌ Server error. Baad me try karein.");
    console.error(err);
  }
}

// ================== SHOW ALERTS ==================
async function showDueAlerts() {
  const container = document.getElementById("due_alerts");
  container.innerHTML = "<p class='muted'>⏳ Load ho raha hai…</p>";

  try {
    const res = await fetch(`${API_URL}/due_alerts`);
    const alerts = await res.json();

    if (!alerts.length) {
      container.innerHTML = "<p class='muted'>Koi reminder nahi hai.</p>";
      return;
    }

    container.innerHTML = "";

    alerts.forEach(a => {
      const div = document.createElement("div");
      div.className = "alert-card";

      div.innerHTML = `
        <h3>${a.alert.title}</h3>
        <p><b>Type:</b> ${a.alert.type}</p>
        <p><b>Country:</b> ${a.alert.country}</p>
        <p><b>Due Date:</b> ${a.alert.due_date}</p>
        <p><b>Reminder:</b> ${a.alert.reminder_days} day(s) before</p>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    container.innerHTML = "<p style='color:red'>❌ Fetch error</p>";
    console.error(err);
  }
}

// auto load on start
showDueAlerts();
