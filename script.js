const API_URL = "https://umar-k20u.onrender.com";

// ================== ALERT FUNCTIONS ==================
async function submitAlert() {
  const type = document.getElementById("alert_type").value;
  const title = document.getElementById("alert_title").value.trim();
  const country = document.getElementById("alert_country").value;
  const due = document.getElementById("alert_due").value;
  const reminder = document.getElementById("alert_reminder").value;

  if (!title || !due) {
    alert("⚠️ Title aur Due Date dalna zaruri hai!");
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
    alert(data.reply);
    showDueAlerts();

  } catch (err) {
    alert("❌ Error aaya, thodi der baad try karein.");
    console.error(err);
  }
}

async function showDueAlerts() {
  const container = document.getElementById("due_alerts");
  container.innerHTML = "<p class='muted'>⏳ Alerts load ho rahe hain…</p>";

  try {
    const res = await fetch(`${API_URL}/due_alerts`);
    const alerts = await res.json();

    if (!alerts.length) {
      container.innerHTML = "<p class='muted'>Koi due alerts nahi hain.</p>";
      return;
    }

    container.innerHTML = "";
    alerts.forEach(a => {
      const div = document.createElement("div");
      div.classList.add("alert-card");
      div.innerHTML = `
        <h3>${a.alert.title} (${a.alert.type})</h3>
        <p>Country: ${a.alert.country}</p>
        <p>Due: ${a.alert.due_date}</p>
        <p>Reminder: ${a.alert.reminder_days} day(s)</p>
        <p><strong>AI Guidance:</strong> ${a.guidance}</p>
      `;
      container.appendChild(div);
    });

  } catch (err) {
    container.innerHTML = "<p style='color:red'>❌ Alerts fetch error</p>";
    console.error(err);
  }
}

// ================== MESSAGE ANALYZER FUNCTIONS ==================
async function sendMsg() {
  const message = document.getElementById("msg").value.trim();
  const resultDiv = document.getElementById("result");

  if (!message) {
    alert("⚠️ Message dalna zaroori hai!");
    return;
  }

  resultDiv.innerHTML = "<p class='muted'>⏳ Message analyze ho raha hai…</p>";

  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    resultDiv.innerHTML = "";

    data.reply.split("\n").forEach(line => {
      const p = document.createElement("p");

      if (line.includes("🔴")) p.style.color = "#dc2626";
      else if (line.includes("🟡")) p.style.color = "#d97706";
      else if (line.includes("🟢")) p.style.color = "#16a34a";
      else p.style.color = "#1f2937";

      p.textContent = line;
      resultDiv.appendChild(p);
    });

    resultDiv.scrollIntoView({ behavior: "smooth" });

  } catch (err) {
    resultDiv.innerHTML = "<p style='color:red'>❌ Error aaya, thodi der baad try karein.</p>";
    console.error(err);
  }
}

function clearMsg() {
  document.getElementById("msg").value = "";
  document.getElementById("result").innerHTML =
    "<p class='muted'>Result yahan dikhai dega…</p>";
}
