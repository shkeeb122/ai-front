async function sendMsg() {
  const message = document.getElementById("msg").value.trim();
  if (!message) {
    alert("Message dalna zaroori hai!");
    return;
  }

  // Backend URL - fallback included
  const API_URL = window.API_URL || "https://umar-k20u.onrender.com/chat";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    if (!res.ok) throw new Error("Backend se response nahi aaya");

    const data = await res.json();
    
    const replyDiv = document.getElementById("result");
    replyDiv.innerHTML = "";  // Clear previous

    // Line by line output with color coding
    data.reply.split("\n").forEach(line => {
      const p = document.createElement("p");
      if (line.includes("🔴")) p.style.color = "red";
      else if (line.includes("🏛")) p.style.color = "blue";
      else if (line.includes("🟢")) p.style.color = "green";
      else p.style.color = "black";
      p.textContent = line; // safer than innerHTML
      replyDiv.appendChild(p);
    });

  } catch (err) {
    document.getElementById("result").textContent = "Error: " + err;
  }
}
