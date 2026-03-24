const API_URL = "https://umar-k20u.onrender.com";
let currentCampaign = null;
let recognition = null;

// ================= INIT =================
window.onload = () => {
    loadCampaigns();
};

// ================= LOAD CAMPAIGNS =================
async function loadCampaigns(){
    const res = await fetch(`${API_URL}/campaigns`);
    const data = await res.json();
    const list = document.getElementById("campaign_list");
    list.innerHTML = "";

    data.campaigns.forEach(c=>{
        const div = document.createElement("div");
        div.className = "chat-item";
        div.innerHTML = `<span>${c.niche}</span>
                         <span>
                           <button onclick="renameChat('${c.id}')">✏️</button>
                           <button onclick="deleteChat('${c.id}')">🗑️</button>
                         </span>`;
        div.onclick = ()=>openCampaign(c.id, div);
        list.appendChild(div);
    });
}

// ================= NEW CHAT =================
function newChat(){
    currentCampaign = null;
    document.getElementById("history_result").innerHTML = "";
}

// ================= OPEN CHAT =================
async function openCampaign(id, el){
    currentCampaign = id;
    document.querySelectorAll(".chat-item").forEach(i=>i.classList.remove("active"));
    el.classList.add("active");

    const res = await fetch(`${API_URL}/campaign/${id}`);
    const data = await res.json();
    renderChat(data.conversation);
}

// ================= SEND CHAT =================
async function sendChat(){
    const input = document.getElementById("chat_input");
    const msg = input.value.trim();
    if(!msg) return;
    input.value = "";

    appendMessage("user", msg);
    showTyping();

    const url = currentCampaign ? `${API_URL}/chat/${currentCampaign}` : `${API_URL}/command`;
    const body = currentCampaign ? {message: msg} : {command: msg};

    const res = await fetch(url,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body)
    });

    const data = await res.json();
    currentCampaign = data.campaign_id || currentCampaign;

    renderChat(data.conversation);
    loadCampaigns();
}

// ================= RENDER CHAT =================
function renderChat(conv){
    const box = document.getElementById("history_result");
    box.innerHTML = "";
    conv.forEach(m=>typeMessage(m.role, m.content));
    box.scrollTop = box.scrollHeight;
}

// ================= TYPING EFFECT =================
function showTyping(){
    const box = document.getElementById("history_result");
    const div = document.createElement("div");
    div.className = "msg bot typing";
    div.innerText = "AI is typing...";
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function typeMessage(role, text){
    const box = document.getElementById("history_result");
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    box.appendChild(div);

    let i = 0;
    const interval = setInterval(()=>{
        div.innerHTML = text.slice(0,i+1);
        i++;
        box.scrollTop = box.scrollHeight;
        if(i>=text.length) clearInterval(interval);
    },15);
}

// ================= CHAT DELETE =================
async function deleteChat(id){
    if(!confirm("Delete this chat?")) return;
    await fetch(`${API_URL}/campaign/delete/${id}`,{method:"POST"});
    loadCampaigns();
    if(currentCampaign===id) newChat();
}

// ================= CHAT RENAME =================
async function renameChat(id){
    const newName = prompt("Enter new chat name:");
    if(!newName) return;
    await fetch(`${API_URL}/campaign/rename/${id}`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({name:newName})
    });
    loadCampaigns();
}

// ================= VOICE INPUT =================
function startVoice(){
    if(!('webkitSpeechRecognition' in window)){
        alert("Your browser does not support voice input.");
        return;
    }
    recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    recognition.onresult = function(event){
        const transcript = event.results[0][0].transcript;
        document.getElementById("chat_input").value = transcript;
        sendChat();
    }
}

// ================= ENTER SEND =================
document.getElementById("chat_input").addEventListener("keydown", function(e){
    if(e.key==="Enter" && !e.shiftKey){
        e.preventDefault();
        sendChat();
    }
});
