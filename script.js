const API_URL = "https://umar-k20u.onrender.com/chat";

async function sendMsg() {
  const message = document.getElementById("msg").value.trim();
  const resultDiv = document.getElementById("result");

  if (!message) {
    alert("⚠️ Message dalna zaroori hai!");
    return;
  }

  resultDiv.innerHTML = "<p class='muted'>⏳ Message analyze ho raha hai…</p>";

  try {
    const res = await fetch(API_URL, {
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
  }
}

function clearMsg() {
  document.getElementById("msg").value = "";
  document.getElementById("result").innerHTML =
    "<p class='muted'>Result yahan dikhai dega…</p>";
}

function sendFeedback(feedback) {
  alert("Thanks for feedback " + feedback);
}
