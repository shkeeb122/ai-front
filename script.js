// ================= CONFIGURATION =================
const API_URL = "https://umar-k20u.onrender.com";
let currentCampaign = null;
let recognition = null;
let isTyping = false;
let currentMessages = [];
let allCampaigns = [];

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

function toggleSearch() {
    const searchBox = document.getElementById("search_history_box");
    if (searchBox.style.display === "none") {
        searchBox.style.display = "block";
    } else {
        searchBox.style.display = "none";
        document.getElementById("history_search").value = "";
        renderCampaigns(allCampaigns);
    }
}

function searchHistory() {
    const searchTerm = document.getElementById("history_search").value.toLowerCase();
    const filtered = allCampaigns.filter(c => 
        (c.niche || c.title || "").toLowerCase().includes(searchTerm)
    );
    renderCampaigns(filtered);
}

// ================= LOAD CAMPAIGNS =================
async function loadCampaigns() {
    try {
        const response = await fetch(`${API_URL}/campaigns`);
        const data = await response.json();
        allCampaigns = data.campaigns || [];
        renderCampaigns(allCampaigns);
        
        const totalQuestions = allCampaigns.reduce((sum, c) => sum + (c.questions || 0), 0);
        document.getElementById("totalQuestions").innerText = totalQuestions;
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
        list.innerHTML = '<div class="empty-history"><i class="fas fa-inbox"></i><p>No chats yet</p><p style="font-size:12px">Start a new chat!</p></div>';
        return;
    }
    
    campaigns.forEach(campaign => {
        const div = document.createElement("div");
        div.className = `chat-item ${currentCampaign === campaign.id ? "active" : ""}`;
        div.innerHTML = `
            <div class="chat-item-info">
                <div class="chat-item-title">${escapeHtml(campaign.niche || campaign.title || "Untitled Chat")}</div>
                <div class="chat-item-preview">${campaign.messages || 0} msgs • ${campaign.questions || 0} Qs</div>
            </div>
            <div class="chat-item-buttons">
                <button onclick="event.stopPropagation(); renameChat('${campaign.id}')" title="Rename">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="event.stopPropagation(); deleteChat('${campaign.id}')" title="Delete">
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
        showToast("Loading chat...", "info");
        currentCampaign = id;
        document.querySelectorAll(".chat-item").forEach(i => i.classList.remove("active"));
        if (element) element.classList.add("active");
        
        const response = await fetch(`${API_URL}/campaign/${id}`);
        const data = await response.json();
        
        if (data.conversation) {
            currentMessages = data.conversation;
            renderChat(data.conversation);
            updateChatTitle(data.title || getChatTitle(data.conversation));
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
        
        let aiResponse = data.response || (data.conversation ? data.conversation[data.conversation.length - 1]?.content : "");
        
        if (data.conversation) {
            currentMessages = data.conversation;
            renderChat(data.conversation);
            updateChatTitle(getChatTitle(data.conversation));
        } else if (aiResponse) {
            hideTypingIndicator();
            appendMessage("ai", aiResponse);
            currentMessages.push({ role: "assistant", content: aiResponse });
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
    
    // Apply syntax highlighting for code blocks
    contentDiv.querySelectorAll('pre code').forEach((block) => {
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(block);
        }
    });
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    box.appendChild(messageDiv);
}

// ================= CORE FORMATTER – FIXES CLICKABLE BLOGS =================
function formatMessage(content) {
    if (!content) return "";
    
    // Step 1: Remove any existing anchor tags that might be malformed or plain HTML.
    // We'll replace them with just the URL so our regex can catch them.
    let sanitized = content.replace(/<a[^>]*>|<\/a>/gi, '');
    
    // Step 2: Convert blog URLs to beautiful cards
    const blogRegex = /(https?:\/\/[^\s<]+?\/blog\/[^\s<]+)/g;
    sanitized = sanitized.replace(blogRegex, (url) => {
        return `<div class="blog-card">
                    <a href="${url}" target="_blank" class="blog-btn">
                        <i class="fas fa-book-open"></i> Read Full Blog
                    </a>
                    <span class="blog-url">${url}</span>
                </div>`;
    });
    
    // Step 3: Convert other URLs to simple clickable links
    const urlRegex = /(https?:\/\/[^\s<]+)(?![^<]*>)/g;
    sanitized = sanitized.replace(urlRegex, (url) => {
        if (url.includes('/blog/')) return url; // already handled
        return `<a href="${url}" target="_blank" class="link">🔗 ${url}</a>`;
    });
    
    // Step 4: Markdown / code formatting
    // Code blocks
    sanitized = sanitized.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang || 'plaintext'}">${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // Inline code
    sanitized = sanitized.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    sanitized = sanitized.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    sanitized = sanitized.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Headings
    sanitized = sanitized.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    sanitized = sanitized.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    sanitized = sanitized.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    
    // Line breaks
    sanitized = sanitized.replace(/\n/g, '<br>');
    
    return sanitized;
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
    if (!confirm("Are you sure you want to delete this chat? This cannot be undone.")) return;
    
    try {
        const response = await fetch(`${API_URL}/campaign/delete/${id}`, { method: "DELETE" });
        if (response.ok) {
            await loadCampaigns();
            if (currentCampaign === id) {
                newChat();
            }
            showToast("Chat deleted successfully", "success");
        } else {
            throw new Error("Delete failed");
        }
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
        const response = await fetch(`${API_URL}/campaign/rename/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName.trim() })
        });
        
        if (response.ok) {
            await loadCampaigns();
            showToast("Chat renamed successfully", "success");
            if (currentCampaign === id) {
                updateChatTitle(newName.trim());
            }
        } else {
            throw new Error("Rename failed");
        }
    } catch (error) {
        console.error("Error renaming chat:", error);
        showToast("Failed to rename chat", "error");
    }
}

// ================= CLEAR ALL CHATS =================
async function clearAllChats() {
    if (!confirm("⚠️ This will delete ALL chats. This action cannot be undone. Continue?")) return;
    
    try {
        for (const campaign of allCampaigns) {
            await fetch(`${API_URL}/campaign/delete/${campaign.id}`, { method: "DELETE" });
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
        title: document.getElementById("chatTitle").innerText,
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
    recognition.lang = "hi-IN, en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    const voiceBtn = document.getElementById("voiceBtn");
    
    recognition.onstart = () => {
        showToast("🎤 Listening... Speak now", "success");
        voiceBtn.classList.add("active");
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById("chat_input").value = transcript;
        updateCharCount();
        sendChat();
    };
    
    recognition.onerror = () => {
        showToast("Voice recognition failed", "error");
        voiceBtn.classList.remove("active");
    };
    
    recognition.onend = () => {
        voiceBtn.classList.remove("active");
    };
    
    recognition.start();
}

// ================= SET COMMAND =================
function setCommand(command) {
    document.getElementById("chat_input").value = command;
    updateCharCount();
    sendChat();
}

// ================= STATS =================
function showStats() {
    const totalMessages = currentMessages.length;
    const userMessages = currentMessages.filter(m => m.role === "user").length;
    const aiMessages = currentMessages.filter(m => m.role === "assistant").length;
    const questions = currentMessages.filter(m => m.role === "user" && 
        (m.content.includes("?") || /(kya|kaise|kyu|kahan)/i.test(m.content))).length;
    
    document.getElementById("statTotalMessages").innerText = totalMessages;
    document.getElementById("statTotalQuestions").innerText = questions;
    document.getElementById("statAiMessages").innerText = aiMessages;
    document.getElementById("statsModal").style.display = "flex";
}

function closeStats() {
    document.getElementById("statsModal").style.display = "none";
}

// ================= HELPER FUNCTIONS =================
function showWelcomeMessage() {
    const box = document.getElementById("history_result");
    if (!box) return;
    
    if (box.children.length === 0) {
        box.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-robot"></i>
                </div>
                <h2>Welcome to AI Ultimate Pro</h2>
                <p>Your intelligent assistant, ready to help you anytime</p>
                <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button class="suggestion-chip" onclick="setCommand('Maine kitne sawal kiye?')">📊 Kitne sawal?</button>
                    <button class="suggestion-chip" onclick="setCommand('Pehle kya hua tha?')">📜 Pehle kya hua?</button>
                    <button class="suggestion-chip" onclick="setCommand('Aur batao')">💬 Aur batao</button>
                    <button class="suggestion-chip" onclick="setCommand('Blog banao car ke baare mein')">📝 Blog banao</button>
                </div>
            </div>
        `;
    }
}

function updateChatTitle(title) {
    const titleElement = document.getElementById("chatTitle");
    if (titleElement) titleElement.textContent = title;
}

function getChatTitle(conversation) {
    if (!conversation || conversation.length === 0) return "New Conversation";
    const firstUserMsg = conversation.find(msg => msg.role === "user");
    if (firstUserMsg) {
        const title = firstUserMsg.content.substring(0, 30);
        return title.length === 30 ? title + "..." : title;
    }
    return "Untitled Chat";
}

function scrollToBottom() {
    setTimeout(() => {
        const box = document.getElementById("history_result");
        if (box) box.scrollTop = box.scrollHeight;
    }, 100);
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : "fa-info-circle"}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = "slideInRight 0.3s reverse";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ================= CLICK OUTSIDE =================
document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById("sidebar");
        const menuToggle = document.getElementById("menuToggle");
        if (sidebar && sidebar.classList.contains("open")) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove("open");
            }
        }
    }
    
    const modal = document.getElementById("statsModal");
    if (modal && modal.style.display === "flex") {
        if (!modal.contains(e.target) || e.target.classList.contains("modal-close")) {
            closeStats();
        }
    }
});
