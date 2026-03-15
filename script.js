const API_URL = "https://umar-k20u.onrender.com";

// ========================
// Global Saved History
// ========================
let conversationHistory = JSON.parse(localStorage.getItem("conversationHistory")) || [];

// ========================
// Save History
// ========================
function saveHistory(){
    localStorage.setItem("conversationHistory", JSON.stringify(conversationHistory));
}

// ========================
// Load campaigns on page load
// ========================
window.onload = async () => {
    await loadCampaigns();
    restoreHistory();
};

// ========================
// Restore History UI
// ========================
function restoreHistory(){
    const historyBox = document.getElementById("history_result");
    if(conversationHistory.length === 0){
        historyBox.innerHTML = "<p class='muted'>No saved history</p>";
        return;
    }
    let html = "<div class='card'>";
    conversationHistory.forEach(h=>{
        html += `<p><strong>${h.role}</strong>: ${h.content}</p>`;
    });
    html += "</div>";
    historyBox.innerHTML = html;
}

// ========================
// Campaign Search
// ========================
function filterCampaigns(){
    const search = document.getElementById("campaign_search").value.toLowerCase();
    const items = document.querySelectorAll(".sidebar-item");
    items.forEach(i=>{
        i.style.display = i.dataset.niche.toLowerCase().includes(search) ? "flex" : "none";
    });
}

// ========================
// Load Campaigns
// ========================
async function loadCampaigns(){
    const list = document.getElementById("campaign_list");
    list.innerHTML = "Loading campaigns...";
    try{
        const res = await fetch(`${API_URL}/campaigns`);
        const data = await res.json();
        if(data.status === "success"){
            if(data.campaigns.length === 0){
                list.innerHTML = "<p class='muted'>No campaigns yet...</p>";
            } else {
                list.innerHTML = "";
                data.campaigns.forEach(c => addCampaignToSidebar(c.id, c.niche));
            }
        }
    } catch(e){
        console.error("Load campaigns error:", e);
        list.innerHTML = "<p class='status-red'>Failed to load campaigns.</p>";
    }
}

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
            body: JSON.stringify({command, history: conversationHistory})
        });
        const r = await res.json();

        if(r.status === "error"){
            resultBox.innerHTML = `<p class="status-red">Error: ${r.message}</p>`;
            statusIndicator.innerText = "Status: Error";
            return;
        }

        statusIndicator.innerText = "Status: Completed";
        const productsList = r.products ? r.products.map(p => p.name).join(", ") : "N/A";

        resultBox.innerHTML = `
        <div class="card">
            <h3>Selected Niche</h3><p>${r.niche}</p>
            <h3>Keywords</h3><p>${r.keywords.join(", ")}</p>
            <h3>Products</h3><p>${productsList}</p>
            <h3>Blog URL</h3><a href="${r.blog_url}" target="_blank">${r.blog_url}</a>
            <h3>Source Info</h3><p>${r.source}</p>
        </div>`;

        conversationHistory.push({role:"user", content:command});
        conversationHistory.push({role:"assistant", content:`Generated content for ${r.niche}`});
        saveHistory();

        addCampaignToSidebar(r.campaign_id, r.niche);
        restoreHistory();

    } catch(e){
        console.error("Frontend error:", e);
        resultBox.innerHTML = "<p class='status-red'>Server error. Check console.</p>";
        statusIndicator.innerText = "Status: Error";
    }
}

// ========================
// Add Campaign to Sidebar
// ========================
function addCampaignToSidebar(campaignId, niche){
    const list = document.getElementById("campaign_list");
    if([...list.children].some(c => c.dataset.id === campaignId)) return;

    const div = document.createElement("div");
    div.className = "sidebar-item";
    div.dataset.id = campaignId;
    div.dataset.niche = niche;

    const p = document.createElement("p");
    p.innerText = niche;
    p.onclick = () => viewHistory(campaignId);

    const delBtn = document.createElement("button");
    delBtn.innerText = "🗑️";
    delBtn.className = "delete-btn";
    delBtn.onclick = async (e) => {
        e.stopPropagation();
        await deleteCampaign(campaignId);
        div.remove();
    };

    div.appendChild(p);
    div.appendChild(delBtn);
    list.prepend(div);
}

// ========================
// Delete Campaign
// ========================
async function deleteCampaign(campaignId){
    try{
        await fetch(`${API_URL}/campaign/delete/${campaignId}`, {method:"DELETE"});
    }catch(e){
        console.error("Delete error:", e);
    }
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
            let colorClass = step.source.includes("FALLBACK")
                ? "status-orange"
                : (step.status.toLowerCase()==="success" ? "status-green":"status-red");

            html += `<p><strong>${step.step_name}:</strong> <span class="${colorClass}">${step.status}</span> - <em>${step.source}</em>`;
            if(step.note) html += `<br>Note: ${step.note}`;
            html += `<br><small>${new Date(step.timestamp).toLocaleString()}</small></p><hr>`;
        });
        html += "</div>";
        historyResult.innerHTML = html;
    }catch(e){
        console.error("History error:", e);
        historyResult.innerHTML = "<p class='status-red'>Failed to load history.</p>";
    }
}
