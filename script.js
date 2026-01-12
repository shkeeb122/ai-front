const API_URL = "https://umar-k20u.onrender.com/chat"; // Backend API URL

async function sendMsg() {
  const message = document.getElementById("msg").value.trim();
  if (!message) {
    alert("Message dalna zaroori hai!");
    return;
  }

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "<p>Analyzing...</p>";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    if (!res.ok) throw new Error("Backend se response nahi aaya");

    const data = await res.json();
    resultDiv.innerHTML = "";

    data.reply.split("\n").forEach(line => {
      const p = document.createElement("p");

      if (line.includes("🔴")) p.style.color = "#e74c3c";      // Red
      else if (line.includes("🏛")) p.style.color = "#3498db"; // Blue
      else if (line.includes("🟢")) p.style.color = "#2ecc71"; // Green
      else p.style.color = "#2c3e50";                        // Black

      p.textContent = line;
      resultDiv.appendChild(p);
    });

    // Scroll to result
    resultDiv.scrollIntoView({ behavior: "smooth" });

  } catch (err) {
    resultDiv.textContent = "Error: " + err;
  }
}

// Clear message input
function clearMsg() {
  document.getElementById("msg").value = "";
  document.getElementById("result").innerHTML = "";
}

// Feedback system
function sendFeedback(feedback) {
  alert(`Thanks for your feedback: ${feedback}`);
  // TODO: backend API me feedback save karne ka option add kiya ja sakta hai
}
