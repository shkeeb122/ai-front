async function sendMsg() {
  const message = document.getElementById("msg").value.trim();
  if (!message) {
    alert("Message dalna zaroori hai!");
    return;
  }

  const API_URL = "https://umar-k20u.onrender.com/chat"; // Backend URL

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    
    // Line by line output
    const replyDiv = document.getElementById("result");
    replyDiv.innerHTML = "";  // Clear previous

    data.reply.split("\n").forEach(line => {
      const p = document.createElement("p");

      // Color coding based on keywords
      if (line.includes("🔴")) p.style.color = "red";
      else if (line.includes("🏛")) p.style.color = "blue";
      else if (line.includes("🟢")) p.style.color = "green";
      else p.style.color = "black";

      p.innerHTML = line;
      replyDiv.appendChild(p);
    });

  } catch (err) {
    document.getElementById("result").innerHTML = "Error: " + err;
  }
}
