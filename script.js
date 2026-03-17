const API_URL = "https://umar-k20u.onrender.com";

let currentCampaign = null;

window.onload = async () => {
    loadCampaigns();
};

async function loadCampaigns(){
    const res = await fetch(`${API_URL}/campaigns`);
    const data = await res.json();
    const list = document.getElementById("campaign_list");
    list.innerHTML = "";

    data.campaigns.forEach(c=>{
        const div = document.createElement("p");
        div.innerText = c.niche;
        div.onclick = ()=>openCampaign(c.id);
        list.appendChild(div);
    });
}

async function runCommand(){
    const cmd = document.getElementById("command_input").value;

    const res = await fetch(`${API_URL}/command`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({command:cmd})
    });

    const data = await res.json();

    currentCampaign = data.campaign_id;

    renderChat(data.conversation);
    loadCampaigns();
}

async function openCampaign(id){
    currentCampaign = id;

    const res = await fetch(`${API_URL}/campaign/${id}`);
    const data = await res.json();

    renderChat(data.conversation);
}

async function sendChat(){
    const msg = document.getElementById("chat_input").value;

    const res = await fetch(`${API_URL}/chat/${currentCampaign}`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message:msg})
    });

    const data = await res.json();

    renderChat(data.conversation);
    document.getElementById("chat_input").value = "";
}

function renderChat(conv){
    const box = document.getElementById("history_result");

    let html = "";
    conv.forEach(m=>{
        let cls = m.role==="user"?"user-msg":"bot-msg";
        html += `<div class="${cls}">${m.content.replace(/(https?:\/\/[^\s]+)/g,'<a href="$1" target="_blank">$1</a>')}</div>`;
    });

    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
}
