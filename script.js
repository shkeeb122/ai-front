const API_URL = "https://umar-k20u.onrender.com";

let currentCampaign = null;

// ================= INIT =================
window.onload = () => {
    loadCampaigns();
    loadMemory(); // NEW FEATURE
    restoreLastCampaign(); // NEW: restore last open campaign
};

// ================= LOAD CAMPAIGNS =================
async function loadCampaigns(){
    try{
        const res = await fetch(`${API_URL}/campaigns`);
        const data = await res.json();

        const list = document.getElementById("campaign_list");
        list.innerHTML = "";

        if(!data.campaigns || data.campaigns.length===0){
            list.innerHTML = "<p class='muted'>No campaigns yet...</p>";
            return;
        }

        data.campaigns.forEach(c=>{
            const div = document.createElement("div");
            div.className = "campaign-item";
            div.innerText = c.niche;

            div.onclick = ()=>{
                document.querySelectorAll(".campaign-item")
                .forEach(el=>el.classList.remove("active"));
                div.classList.add("active");
                openCampaign(c.id);
            };

            list.appendChild(div);
        });

        // Highlight & auto open last campaign if exists
        const last = localStorage.getItem("lastCampaign");
        if(last){
            const el = Array.from(document.getElementsByClassName("campaign-item"))
                .find(d => d.innerText === data.campaigns.find(c=>c.id===last)?.niche);
            if(el) el.click();
        }

    }catch(e){
        console.error("Campaign load error", e);
    }
}

// ================= RESTORE LAST CAMPAIGN =================
function restoreLastCampaign(){
    const last = localStorage.getItem("lastCampaign");
    if(last) openCampaign(last);
}

// ================= OPEN CAMPAIGN =================
async function openCampaign(id){
    currentCampaign = id;
    localStorage.setItem("lastCampaign", id); // save last opened campaign

    const res = await fetch(`${API_URL}/campaign/${id}`);
    const data = await res.json();
    renderChat(data.conversation);
}

// ================= LOAD MEMORY =================
async function loadMemory(){
    try{
        const res = await fetch(`${API_URL}/memory/list`);
        const data = await res.json();

        const memBox = document.getElementById("memory_list");
        memBox.innerHTML = "";

        if(!data.memory || data.memory.length===0){
            memBox.innerHTML = "<p class='muted'>No memory yet...</p>";
            return;
        }

        data.memory.forEach(m=>{
            const div = document.createElement("div");
            div.className = "memory-item";
            div.innerHTML = `<strong>User:</strong> ${m.user}<br><strong>AI:</strong> ${m.ai}`;
            memBox.appendChild(div);
        });

    }catch(e){
        console.error("Memory load error", e);
    }
}

// ================= CLEAR MEMORY =================
async function clearMemory(){
    if(!confirm("Are you sure to clear memory?")) return;

    try{
        await fetch(`${API_URL}/memory/delete`,{method:"POST"});
        loadMemory();
        alert("Memory cleared ✅");
    }catch(e){
        alert("Error clearing memory ❌");
    }
}

// ================= RUN COMMAND =================
async function runCommand(){
    const cmd = document.getElementById("command_input").value.trim();
    if(!cmd) return;

    setStatus("Running...");

    try{
        const res = await fetch(`${API_URL}/command`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({command:cmd})
        });

        const data = await res.json();
        currentCampaign = data.campaign_id;
        localStorage.setItem("lastCampaign", currentCampaign); // save last command campaign

        renderChat(data.conversation);
        loadCampaigns();
        loadMemory();

        setStatus("Completed ✅");

    }catch(e){
        setStatus("Error ❌");
    }
}

// ================= SEND CHAT =================
async function sendChat(){
    const input = document.getElementById("chat_input");
    const msg = input.value.trim();

    if(!msg || !currentCampaign) return;
    input.value = "";

    appendMessage("user", msg);

    try{
        const res = await fetch(`${API_URL}/chat/${currentCampaign}`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({message:msg})
        });

        const data = await res.json();
        renderChat(data.conversation);
        loadMemory();

    }catch(e){
        appendMessage("bot", "Error getting response.");
    }
}

// ================= RENDER CHAT =================
function renderChat(conv){
    const box = document.getElementById("history_result");
    if(!conv || conv.length===0){
        box.innerHTML = "<p class='muted'>No chat yet...</p>";
        return;
    }

    box.innerHTML = "";
    conv.forEach(m=>{
        appendMessage(m.role, m.content, false);
    });

    scrollBottom();
}

// ================= APPEND MESSAGE =================
function appendMessage(role, text, scroll=true){
    const box = document.getElementById("history_result");
    const div = document.createElement("div");
    div.className = role === "user" ? "msg user" : "msg bot";

    text = text.replace(/(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank">$1</a>'
    );

    div.innerHTML = text;
    box.appendChild(div);

    if(scroll) scrollBottom();
}

// ================= SCROLL =================
function scrollBottom(){
    const box = document.getElementById("history_result");
    box.scrollTop = box.scrollHeight;
}

// ================= STATUS =================
function setStatus(text){
    document.getElementById("status_indicator").innerText = "Status: " + text;
}
