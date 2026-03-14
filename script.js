const API_URL = "https://umar-k20u.onrender.com";

// ========================
// Run AI Command
// ========================
async function runCommand() {
    const command = document.getElementById("command_input").value.trim();
    if(!command){ alert("Please enter command"); return; }

    const resultBox = document.getElementById("result");
    const statusIndicator = document.getElementById("status_indicator");
    statusIndicator.innerText = "Status: Running...";
    resultBox.innerHTML = "Executing AI marketing system...";

    try {
        const res = await fetch(`${API_URL}/command`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({command})
        });

        const r = await res.json();

        if(r.status === "error"){
            resultBox.innerHTML = `<p class="status-red">Error: ${r.message}</p>`;
            statusIndicator.innerText = "Status: Error";
            console.error(r.trace || r.message);
            return;
        }

        statusIndicator.innerText = "Status: Completed";

        const productsList = r.products ? r.products.map(p => p.name).join(", ") : "N/A";

        // Display result
        resultBox.innerHTML = `
        <div class="card">
            <h3>Selected Niche</h3><p>${r.niche}</p>
            <h3>Keywords</h3><p>${r.keywords.join(", ")}</p>
            <h3>Products</h3><p>${productsList}</p>
            <h3>Blog URL</h3><a href="${r.blog_url}" target="_blank">${r.blog_url}</a>
            <h3>Source Info</h3><p>${r.source}</p>
        </div>`;

        // Update sidebar with this campaign
        addCampaignToSidebar(r.campaign_id, r.niche);

    } catch(e){
        console.error("Frontend error:", e);
        resultBox.innerHTML = "<p class='status-red'>Server error. Check console.</p>";
        statusIndicator.innerText = "Status: Error";
    }
}

// ========================
// Sidebar Campaign
// ========================
function addCampaignToSidebar(campaignId, niche){
    const list = document.getElementById("campaign_list");
    const p = document.createElement("p");
    p.innerText = niche;
    p.onclick = () => viewHistory(campaignId);
    list.prepend(p);
}

// ========================
// Fetch Campaign History
// ========================
async function viewHistory(campaignId){
    const historyResult = document.getElementById("history_result");
    historyResult.innerHTML = "Loading history...";

    try{
        const res = await fetch(`${API_URL}/history/${campaignId}`);
        const data = await res.json();

        if(data.status === "error"){
            historyResult.innerHTML = `<p class="status-red">${data.message}</p>`;
            return;
        }

        let html = "<div class='card'>";
        data.history.forEach(step => {
            let colorClass = step.source.includes("FALLBACK") ? "status-orange" : (step.status.toLowerCase() === "success" ? "status-green" : "status-red");
            html += `<p><strong>${step.step_name}:</strong> <span class="${colorClass}">${step.status}</span> - <em>${step.source}</em>`;
            if(step.note) html += `<br>Note: ${step.note}`;
            html += `<br><small>${new Date(step.timestamp).toLocaleString()}</small></p><hr>`;
        });
        html += "</div>";
        historyResult.innerHTML = html;

    } catch(e){
        console.error("History error:", e);
        historyResult.innerHTML = "<p class='status-red'>Failed to load history.</p>";
    }
}
