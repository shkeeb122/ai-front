const API_URL = "https://umar-k20u.onrender.com";  

// Run AI command
async function runCommand() {
    const command = document.getElementById("command_input").value.trim();
    if(!command){ 
        alert("Please enter command"); 
        return; 
    }
    
    const resultBox = document.getElementById("result");
    const historyBox = document.querySelector(".history-box");
    historyBox.style.display = "none";
    resultBox.innerHTML = "Running AI system...";

    try {
        const res = await fetch(`${API_URL}/command`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({command})
        });

        const r = await res.json();

        if(r.status === "error"){
            resultBox.innerHTML = `<p style="color:red">Error: ${r.message}</p>`;
            console.error(r.trace || r.message);
            return;
        }

        const productsList = r.products ? r.products.map(p => p.name).join(", ") : "N/A";

        // Display main result
        resultBox.innerHTML = `
        <div class="card">
            <h3>Selected Niche</h3>
            <p>${r.niche}</p>

            <h3>Keywords</h3>
            <p>${r.keywords.join(", ")}</p>

            <h3>Products</h3>
            <p>${productsList}</p>

            <h3>Blog URL</h3>
            <a href="${r.blog_url}" target="_blank">${r.blog_url}</a>

            <h3>Source Info</h3>
            <p>${r.source}</p>

            <button class="primary" onclick="viewHistory('${r.campaign_id}')">View Campaign History</button>
        </div>`;

    } catch(e){
        console.error("Frontend error:", e);
        resultBox.innerHTML = "<p style='color:red'>Server error. Check console for details.</p>";
    }
}

// Fetch campaign history
async function viewHistory(campaignId){
    const historyBox = document.querySelector(".history-box");
    const historyResult = document.getElementById("history_result");
    historyBox.style.display = "block";
    historyResult.innerHTML = "Loading history...";

    try{
        const res = await fetch(`${API_URL}/history/${campaignId}`);
        const data = await res.json();

        if(data.status === "error"){
            historyResult.innerHTML = `<p style="color:red">${data.message}</p>`;
            return;
        }

        let html = "<div class='card'>";
        data.history.forEach(step => {
            let color = step.source.includes("FALLBACK") ? "orange" : "green";
            html += `<p><strong>${step.step_name}:</strong> <span style="color:${color}">${step.status}</span> - <em>${step.source}</em>`;
            if(step.note) html += `<br>Note: ${step.note}`;
            html += `<br><small>${new Date(step.timestamp).toLocaleString()}</small></p><hr>`;
        });
        html += "</div>";

        historyResult.innerHTML = html;

    }catch(e){
        console.error("History error:", e);
        historyResult.innerHTML = "<p style='color:red'>Failed to load history.</p>";
    }
}
