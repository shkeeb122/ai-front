// ================= CONFIGURATION =================
const API_URL = "https://umar-k20u.onrender.com";
let currentCampaign = null;
let recognition = null;
let isTyping = false;
let currentMessages = [];

// ================= INITIALIZATION =================
window.onload = () => {
    loadCampaigns();
    setupEventListeners();
    setupAutoResize();
    updateCharCount();
    showWelcomeMessage();
};

// ================= EVENT LISTENERS =================
function setupEventListeners() {
    const textarea = document.getElementById("chat_input");
    const sendBtn = document.getElementById("sendBtn");
    
    textarea.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendChat();
        }
    });
    
    textarea.addEventListener("input", function() {
        updateCharCount();
        autoResizeTextarea();
    });
    
    sendBtn.addEventListener("click", () => sendChat());
}

// ================= AUTO RESIZE TEXTAREA =================
function setupAutoResize() {
    const textarea = document.getElementById("chat_input");
    textarea.addEventListener("input", autoResizeTextarea);
}

function autoResizeTextarea() {
    const textarea = document.getElementById("chat_input");
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
}

function updateCharCount() {
    const textarea = document.getElementById("chat_input");
    const count = textarea.value.length;
    const counter = document.querySelector(".char-counter");
    if (counter) {
        counter.textContent = `${count} / 4000`;
        const sendBtn = document.getElementById("sendBtn");
        if (sendBtn) {
            sendBtn.disabled = count === 0 || count > 4000;
        }
    }
}

// ================= SIDEBAR FUNCTIONS =================
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("open");
}

function closeSidebar() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById("sidebar");
        sidebar.classList.remove("open");
    }
}

// ================= LOAD CAMPAIGNS =================
async function loadCampaigns() {
    try {
        const response = await fetch(`${API_URL}/campaigns`);
        const data = await response.json();
        renderCampaigns(data.campaigns || []);
    } catch (error) {
        console.error("Error loading campaigns:", error);
        showToast("Failed to load chats", "error");
    }
}

function renderCampaigns(campaigns) {
    const list = document.getElementById("campaign_list");
    if (!list) return;
    
    list.innerHTML = "";
    
    if (campaigns.length === 0) {
        list.innerHTML = '<div class="empty-history"><i class="fas fa-inbox"></i><p>No chats yet</p></div>';
        return;
    }
    
    campaigns.forEach(campaign => {
        const div = document.createElement("div");
        div.className = `chat-item ${currentCampaign === campaign.id ? "active" : ""}`;
        div.innerHTML = `
            <span>${escapeHtml(campaign.niche || "Untitled Chat")}</span>
            <div class="chat-item-buttons">
                <button onclick="renameChat('${campaign.id}')" title="Rename">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteChat('${campaign.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        div.onclick = (e) => {
            if (!e.target.closest("button")) {
                openCampaign(campaign.id, div);
            }
        };
        list.appendChild(div);
    });
}

// ================= NEW CHAT =================
function newChat() {
    currentCampaign = null;
    currentMessages = [];
    document.getElementById("history_result").innerHTML = "";
    showWelcomeMessage();
    updateChatTitle("New Conversation");
    closeSidebar();
    removeActiveClass();
}

function removeActiveClass() {
    document.querySelectorAll(".chat-item").forEach(item => {
        item.classList.remove("active");
    });
}

// ================= OPEN CHAT =================
async function openCampaign(id, element) {
    try {
        currentCampaign = id;
        document.querySelectorAll(".chat-item").forEach(i => i.classList.remove("active"));
        if (element) element.classList.add("active");
        
        const response = await fetch(`${API_URL}/campaign/${id}`);
        const data = await response.json();
        
        if (data.conversation) {
            currentMessages = data.conversation;
            renderChat(data.conversation);
            updateChatTitle(getChatTitle(data.conversation));
        }
        
        closeSidebar();
    } catch (error) {
        console.error("Error opening chat:", error);
        showToast("Failed to open chat", "error");
    }
}

// ================= SEND CHAT =================
async function sendChat() {
    const input = document.getElementById("chat_input");
    const message = input.value.trim();
    
    if (!message) return;
    if (message.length > 4000) {
        showToast("Message too long (max 4000 characters)", "error");
        return;
    }
    
    input.value = "";
    updateCharCount();
    autoResizeTextarea();
    
    appendMessage("user", message);
    currentMessages.push({ role: "user", content: message });
    
    showTypingIndicator();
    
    try {
        const url = currentCampaign ? `${API_URL}/chat/${currentCampaign}` : `${API_URL}/command`;
        const body = currentCampaign ? { message: message } : { command: message };
        
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (!currentCampaign && data.campaign_id) {
            currentCampaign = data.campaign_id;
        }
        
        if (data.conversation) {
            currentMessages = data.conversation;
            renderChat(data.conversation);
            updateChatTitle(getChatTitle(data.conversation));
        }
        
        await loadCampaigns();
        
    } catch (error) {
        console.error("Error sending message:", error);
        showToast("Failed to send message", "error");
        hideTypingIndicator();
        appendMessage("ai", "Sorry, I encountered an error. Please try again.");
    }
}

// ================= RENDER CHAT =================
function renderChat(conversation) {
    const box = document.getElementById("history_result");
    if (!box) return;
    
    box.innerHTML = "";
    
    if (!conversation || conversation.length === 0) {
        showWelcomeMessage();
        return;
    }
    
    conversation.forEach(msg => {
        appendMessageToContainer(msg.role, msg.content);
    });
    
    scrollToBottom();
}

function appendMessage(role, content) {
    const box = document.getElementById("history_result");
    if (!box) return;
    
    // Remove welcome message if exists
    const welcomeMsg = box.querySelector(".welcome-message");
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    appendMessageToContainer(role, content);
    scrollToBottom();
}

function appendMessageToContainer(role, content) {
    const box = document.getElementById("history_result");
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role === "user" ? "user" : "ai"}`;
    
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML = role === "user" ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.innerHTML = formatMessage(content);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    box.appendChild(messageDiv);
}

function formatMessage(content) {
    // Convert markdown-like formatting
    let formatted = escapeHtml(content);
    
    // Code blocks
    formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });
    
    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

// ================= TYPING INDICATOR =================
function showTypingIndicator() {
    if (isTyping) return;
    isTyping = true;
    
    const box = document.getElementById("history_result");
    const indicator = document.createElement("div");
    indicator.className = "message ai typing-message";
    indicator.id = "typingIndicator";
    
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML = '<i class="fas fa-robot"></i>';
    
    const content = document.createElement("div");
    content.className = "message-content";
    content.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    
    indicator.appendChild(avatar);
    indicator.appendChild(content);
    box.appendChild(indicator);
    scrollToBottom();
}

function hideTypingIndicator() {
    isTyping = false;
    const indicator = document.getElementById("typingIndicator");
    if (indicator) {
        indicator.remove();
    }
}

// ================= DELETE CHAT =================
async function deleteChat(id) {
    if (!confirm("Are you sure you want to delete this chat?")) return;
    
    try {
        await fetch(`${API_URL}/campaign/delete/${id}`, { method: "POST" });
        await loadCampaigns();
        
        if (currentCampaign === id) {
            newChat();
        }
        
        showToast("Chat deleted successfully", "success");
    } catch (error) {
        console.error("Error deleting chat:", error);
        showToast("Failed to delete chat", "error");
    }
}

// ================= RENAME CHAT =================
async function renameChat(id) {
    const newName = prompt("Enter new chat name:", "Chat");
    if (!newName || newName.trim() === "") return;
    
    try {
        await fetch(`${API_URL}/campaign/rename/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName.trim() })
        });
        await loadCampaigns();
        showToast("Chat renamed successfully", "success");
    } catch (error) {
        console.error("Error renaming chat:", error);
        showToast("Failed to rename chat", "error");
    }
}

// ================= CLEAR ALL CHATS =================
async function clearAllChats() {
    if (!confirm("⚠️ This will delete ALL chats. This action cannot be undone. Continue?")) return;
    
    try {
        const campaigns = await fetch(`${API_URL}/campaigns`).then(res => res.json());
        
        for (const campaign of (campaigns.campaigns || [])) {
            await fetch(`${API_URL}/campaign/delete/${campaign.id}`, { method: "POST" });
        }
        
        await loadCampaigns();
        newChat();
        showToast("All chats cleared successfully", "success");
    } catch (error) {
        console.error("Error clearing chats:", error);
        showToast("Failed to clear chats", "error");
    }
}

// ================= EXPORT CHAT =================
function exportChat() {
    if (!currentMessages || currentMessages.length === 0) {
        showToast("No messages to export", "error");
        return;
    }
    
    const exportData = {
        title: getChatTitle(currentMessages),
        date: new Date().toISOString(),
        messages: currentMessages
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast("Chat exported successfully", "success");
}

// ================= CLEAR CURRENT CHAT =================
function clearCurrentChat() {
    if (!currentMessages || currentMessages.length === 0) {
        showToast("No messages to clear", "error");
        return;
    }
    
    if (confirm("Clear all messages in current chat?")) {
        currentMessages = [];
        renderChat([]);
        showWelcomeMessage();
        showToast("Chat cleared", "success");
    }
}

// ================= VOICE INPUT =================
function startVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast("Your browser does not support voice input", "error");
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
        showToast("Listening... Speak now", "success");
        document.getElementById("voiceBtn").style.background = "var(--error)";
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById("chat_input").value = transcript;
        updateCharCount();
        sendChat();
    };
    
    recognition.onerror = (event) => {
        console.error("Voice recognition error:", event.error);
        showToast("Voice recognition failed", "error");
        document.getElementById("voiceBtn").style.background = "";
    };
    
    recognition.onend = () => {
        document.getElementById("voiceBtn").style.background = "";
    };
    
    recognition.start();
}

// ================= HELPER FUNCTIONS =================
function showWelcomeMessage() {
    const box = document.getElementById("history_result");
    if (!box) return
