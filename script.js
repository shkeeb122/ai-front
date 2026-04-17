// ====================================================================
// 📁 FILE: script.js
// 🎯 ROLE: FRONTEND LOGIC - User interaction, API calls, UI updates
// 📋 TOTAL FUNCTIONS: 30+
// 📋 TOTAL SECTIONS: 18
// 🔧 FEATURES: Error handling, organized sections, easy maintenance
// ====================================================================

// ================= SECTION 1: CONFIGURATION =================
// 1.1 API Configuration
const API_URL = "https://umar-k20u.onrender.com";

// 1.2 Global Variables
let currentCampaign = null;
let recognition = null;
let isTyping = false;
let currentMessages = [];
let allCampaigns = [];

// ================= SECTION 2: INITIALIZATION =================
window.onload = () => {
    initializeApp();
};

function initializeApp() {
    try {
        loadCampaigns();
        setupEventListeners();
        setupAutoResize();
        updateCharCount();
        showWelcomeMessage();
        console.log("✅ App initialized successfully");
    } catch (error) {
        console.error("❌ Initialization error:", error);
        showToast("Failed to initialize app", "error");
    }
}

// ================= SECTION 3: EVENT LISTENERS =================
function setupEventListeners() {
    const textarea = document.getElementById("chat_input");
    const sendBtn = document.getElementById("sendBtn");
    
    if (!textarea || !sendBtn) {
        console.error("Required DOM elements not found");
        return;
    }
    
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
    
    // Search box click prevention
    const searchBox = document.getElementById("search_history_box");
    if (searchBox) {
        searchBox.addEventListener("click", function(e) {
            e.stopPropagation();
        });
    }
}

// ================= SECTION 4: AUTO RESIZE TEXTAREA =================
function setupAutoResize() {
    const textarea = document.getElementById("chat_input");
    if (textarea) {
        textarea.addEventListener("input", autoResizeTextarea);
    }
}

function autoResizeTextarea() {
    const textarea = document.getElementById("chat_input");
    if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
}

function updateCharCount() {
    const textarea = document.getElementById("chat_input");
    const counter = document.querySelector(".char-counter");
    
    if (textarea && counter) {
        const count = textarea.value.length;
        counter.textContent = `${count} / 4000`;
        
        const sendBtn = document.getElementById("sendBtn");
        if (sendBtn) {
            sendBtn.disabled = count === 0 || count > 4000;
        }
    }
}

// ================= SECTION 5: SIDEBAR FUNCTIONS =================
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
        sidebar.classList.toggle("open");
    }
}

function closeSidebar() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById("sidebar");
        if (sidebar) {
            sidebar.classList.remove("open");
        }
    }
}

function toggleSearch() {
    const searchBox = document.getElementById("search_history_box");
    const searchInput = document.getElementById("history_search");
    
    if (searchBox) {
        if (searchBox.style.display === "none") {
            searchBox.style.display = "block";
            if (searchInput) searchInput.focus();
        } else {
            searchBox.style.display = "none";
            if (searchInput) searchInput.value = "";
            renderCampaigns(allCampaigns);
        }
    }
}

function clearSearch() {
    const searchInput = document.getElementById("history_search");
    if (searchInput) {
        searchInput.value = "";
        renderCampaigns(allCampaigns);
    }
    toggleSearch();
}

function searchHistory() {
    const searchTerm = document.getElementById("history_search")?.value.toLowerCase() || "";
    const filtered = allCampaigns.filter(c => 
        (c.niche || c.title || "").toLowerCase().includes(searchTerm)
    );
    renderCampaigns(filtered);
}

// ================= SECTION 6: LOAD CAMPAIGNS =================
async function loadCampaigns() {
    try {
        const response = await fetch(`${API_URL}/campaigns`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        allCampaigns = data.campaigns || [];
        renderCampaigns(allCampaigns);
        
        const totalQuestions = allCampaigns.reduce((sum, c) => sum + (c.questions || 0), 0);
        const totalQuestionsEl = document.getElementById("totalQuestions");
        if (totalQuestionsEl) {
            totalQuestionsEl.innerText = totalQuestions;
        }
        
    } catch (error) {
        console.error("Error loading campaigns:", error);
        showToast("Failed to load chats", "error");
        renderCampaigns([]);
    }
}

function renderCampaigns(campaigns) {
    const list = document.getElementById("campaign_list");
    if (!list) return;
    
    list.innerHTML = "";
    
    if (!campaigns || campaigns.length === 0) {
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

// ================= SECTION 7: NEW CHAT =================
function newChat() {
    currentCampaign = null;
    currentMessages = [];
    
    const chatArea = document.getElementById("history_result");
    if (chatArea) chatArea.innerHTML = "";
    
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

// ================= SECTION 8: OPEN CHAT =================
async function openCampaign(id, element) {
    try {
        showToast("Loading chat...", "info");
        currentCampaign = id;
        
        document.querySelectorAll(".chat-item").forEach(i => i.classList.remove("active"));
        if (element) element.classList.add("active");
        
        const response = await fetch(`${API_URL}/campaign/${id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
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

// ================= SECTION 9: SEND CHAT =================
async function sendChat() {
    const input = document.getElementById("chat_input");
    if (!input) return;
    
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
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
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

// ================= SECTION 10: RENDER CHAT =================
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
    if (!box) return;
    
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role === "user" ? "user" : "ai"}`;
    
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML = role === "user" ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.innerHTML = formatMessage(content);
    
    // Apply syntax highlighting
    contentDiv.querySelectorAll('pre code').forEach((block) => {
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(block);
        }
    });
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    box.appendChild(messageDiv);
}

// ================= SECTION 11: MESSAGE FORMATTER =================
function formatMessage(content) {
    if (!content) return "";
    
    let formatted = content;
    
    // Check if already formatted (avoid double formatting)
    const hasBlogCard = formatted.includes('class="blog-card"');
    const hasBlogBtn = formatted.includes('class="blog-btn"');
    const hasBlogPublished = formatted.includes('blog-published');
    const hasAnchor = formatted.includes('<a href') && formatted.includes('target="_blank"');
    
    if (hasBlogCard || hasBlogBtn || hasBlogPublished || hasAnchor) {
        return formatted;
    }
    
    // Convert blog URLs to cards
    const blogRegex = /(https?:\/\/[^\s<]+?\/blog\/[^\s<]+)/g;
    formatted = formatted.replace(blogRegex, (url) => {
        return `<div class="blog-card">
                    <a href="${url}" target="_blank" rel="noopener noreferrer" class="blog-btn">
                        <i class="fas fa-book-open"></i> 📖 पूरा ब्लॉग पढ़ें →
                    </a>
                    <span class="blog-url">${url}</span>
                </div>`;
    });
    
    // Convert other URLs to links
    const urlRegex = /(https?:\/\/[^\s<]+)(?![^<]*>)/g;
    formatted = formatted.replace(urlRegex, (url) => {
        if (url.includes('/blog/')) return url;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="link">🔗 ${url}</a>`;
    });
    
    // Code blocks
    formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang || 'plaintext'}">${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Headings
    formatted = formatted.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    formatted = formatted.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

// ================= SECTION 12: TYPING INDICATOR =================
function showTypingIndicator() {
    if (isTyping) return;
    isTyping = true;
    
    const box = document.getElementById("history_result");
    if (!box) return;
    
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

// ================= SECTION 13: CHAT MANAGEMENT =================
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

function exportChat() {
    if (!currentMessages || currentMessages.length === 0) {
        showToast("No messages to export", "error");
        return;
    }
    
    const exportData = {
        title: document.getElementById("chatTitle")?.innerText || "Chat",
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

// ================= SECTION 14: VOICE INPUT =================
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
        if (voiceBtn) voiceBtn.classList.add("active");
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById("chat_input");
        if (input) {
            input.value = transcript;
            updateCharCount();
            sendChat();
        }
    };
    
    recognition.onerror = () => {
        showToast("Voice recognition failed", "error");
        if (voiceBtn) voiceBtn.classList.remove("active");
    };
    
    recognition.onend = () => {
        if (voiceBtn) voiceBtn.classList.remove("active");
    };
    
    recognition.start();
}

// ================= SECTION 15: COMMAND & STATS =================
function setCommand(command) {
    const input = document.getElementById("chat_input");
    if (input) {
        input.value = command;
        updateCharCount();
        sendChat();
    }
}

function showStats() {
    const totalMessages = currentMessages.length;
    const userMessages = currentMessages.filter(m => m.role === "user").length;
    const aiMessages = currentMessages.filter(m => m.role === "assistant").length;
    const questions = currentMessages.filter(m => m.role === "user" && 
        (m.content.includes("?") || /(kya|kaise|kyu|kahan)/i.test(m.content))).length;
    
    const statTotal = document.getElementById("statTotalMessages");
    const statQuestions = document.getElementById("statTotalQuestions");
    const statAi = document.getElementById("statAiMessages");
    const modal = document.getElementById("statsModal");
    
    if (statTotal) statTotal.innerText = totalMessages;
    if (statQuestions) statQuestions.innerText = questions;
    if (statAi) statAi.innerText = aiMessages;
    if (modal) modal.style.display = "flex";
}

function closeStats() {
    const modal = document.getElementById("statsModal");
    if (modal) modal.style.display = "none";
}

// ================= SECTION 16: HELPER FUNCTIONS =================
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
    if (titleElement) {
        titleElement.textContent = title;
    }
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
        if (box) {
            box.scrollTop = box.scrollHeight;
        }
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

// ================= SECTION 17: CLICK OUTSIDE HANDLER =================
document.addEventListener("click", (e) => {
    // Sidebar close on outside click (mobile)
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById("sidebar");
        const menuToggle = document.getElementById("menuToggle");
        if (sidebar && sidebar.classList.contains("open")) {
            if (!sidebar.contains(e.target) && !menuToggle?.contains(e.target)) {
                sidebar.classList.remove("open");
            }
        }
    }
    
    // Modal close on outside click
    const modal = document.getElementById("statsModal");
    if (modal && modal.style.display === "flex") {
        if (!modal.contains(e.target) || e.target.classList.contains("modal-close")) {
            closeStats();
        }
    }
});

// ================= SECTION 18: EXPORTS (if needed) =================
// Functions are globally available via window object



// ====================================================================
// SECTION 19: HEALTH SERVICE FUNCTIONS (NEW)
// ====================================================================

// Health Service Variables
let healthCheckInterval = null;
let currentHealthStatus = 'healthy';

function addHealthIndicator() {
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (!sidebarFooter) return;
    
    const healthDiv = document.createElement('div');
    healthDiv.className = 'health-indicator health-healthy';
    healthDiv.id = 'healthIndicator';
    healthDiv.onclick = () => showHealthModal();
    healthDiv.innerHTML = `
        <i class="fas fa-heartbeat"></i>
        <span id="healthStatus">✅ System Healthy</span>
    `;
    
    sidebarFooter.insertBefore(healthDiv, sidebarFooter.firstChild);
}

function startHealthCheckInterval() {
    if (healthCheckInterval) clearInterval(healthCheckInterval);
    checkSystemHealth();
    healthCheckInterval = setInterval(checkSystemHealth, 30000);
}

async function checkSystemHealth() {
    try {
        const response = await fetch(`${API_URL}/health/quick`);
        if (!response.ok) throw new Error('Health check failed');
        
        const data = await response.json();
        currentHealthStatus = data.status;
        updateHealthIndicator(data);
    } catch (error) {
        console.error('Health check error:', error);
        updateHealthIndicator({ status: 'error', emoji: '❌', critical: 0 });
    }
}

function updateHealthIndicator(data) {
    const indicator = document.getElementById('healthIndicator');
    const statusSpan = document.getElementById('healthStatus');
    if (!indicator || !statusSpan) return;
    
    indicator.className = `health-indicator health-${data.status}`;
    
    const messages = {
        'healthy': '✅ System Healthy',
        'warning': `⚠️ ${data.critical || 0} Warnings`,
        'critical': `🔴 ${data.critical || 0} Critical`,
        'error': '❌ Offline'
    };
    
    statusSpan.textContent = messages[data.status] || '❓ Unknown';
}

async function showHealthModal() {
    showToast('Loading health report...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/health/full`);
        if (!response.ok) throw new Error('Failed to load report');
        
        const report = await response.json();
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'healthModal';
        modal.style.display = 'flex';
        
        let criticalHtml = '';
        report.problems.critical.slice(0, 5).forEach(p => {
            criticalHtml += `
                <div class="health-problem critical">
                    <div class="problem-location"><i class="fas fa-times-circle"></i> ${p.location}</div>
                    <div class="problem-issue">${p.issue}</div>
                    ${p.fix ? `<div class="problem-fix">💡 ${p.fix}</div>` : ''}
                </div>
            `;
        });
        
        let warningsHtml = '';
        report.problems.warnings.slice(0, 5).forEach(p => {
            warningsHtml += `
                <div class="health-problem warning">
                    <div class="problem-location"><i class="fas fa-exclamation-triangle"></i> ${p.location}</div>
                    <div class="problem-issue">${p.issue}</div>
                    ${p.fix ? `<div class="problem-fix">💡 ${p.fix}</div>` : ''}
                </div>
            `;
        });
        
        modal.innerHTML = `
            <div class="modal-content health-modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-heartbeat"></i> System Health Report</h3>
                    <button class="modal-close" onclick="closeHealthModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="health-overall ${report.overall_status}">
                        <span class="health-emoji">${report.overall_emoji}</span>
                        <span class="health-status">${report.overall}</span>
                    </div>
                    
                    <div class="health-summary">
                        <div class="summary-card">
                            <span class="summary-value">${report.stats.files}</span>
                            <span class="summary-label">Files</span>
                        </div>
                        <div class="summary-card">
                            <span class="summary-value">${report.stats.functions}</span>
                            <span class="summary-label">Functions</span>
                        </div>
                        <div class="summary-card">
                            <span class="summary-value">${report.stats.tables}</span>
                            <span class="summary-label">Tables</span>
                        </div>
                        <div class="summary-card">
                            <span class="summary-value">${report.stats.columns}</span>
                            <span class="summary-label">Columns</span>
                        </div>
                    </div>
                    
                    ${report.stats.critical > 0 ? `
                    <div class="health-section">
                        <h4><i class="fas fa-times-circle" style="color: #ef4444;"></i> Critical Issues (${report.stats.critical})</h4>
                        ${criticalHtml || '<p class="no-issues">No critical issues</p>'}
                    </div>
                    ` : ''}
                    
                    ${report.stats.warnings > 0 ? `
                    <div class="health-section">
                        <h4><i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i> Warnings (${report.stats.warnings})</h4>
                        ${warningsHtml || '<p class="no-issues">No warnings</p>'}
                    </div>
                    ` : ''}
                    
                    ${report.stats.critical === 0 && report.stats.warnings === 0 ? `
                    <div class="health-section">
                        <p class="all-good"><i class="fas fa-check-circle" style="color: #10b981;"></i> All systems operational!</p>
                    </div>
                    ` : ''}
                    
                    <div class="health-discovered">
                        <p><strong>📁 Files:</strong> ${report.discovered.files.slice(0, 6).join(', ')}${report.discovered.files.length > 6 ? '...' : ''}</p>
                        <p><strong>🗄️ Tables:</strong> ${report.discovered.tables.join(', ')}</p>
                    </div>
                    
                    <div class="health-actions">
                        <button class="health-btn primary" onclick="runAutoFix()">
                            <i class="fas fa-wrench"></i> Auto-Fix Issues
                        </button>
                        <button class="health-btn secondary" onclick="refreshHealthModal()">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                    </div>
                    
                    <p class="health-timestamp">Last checked: ${new Date(report.timestamp).toLocaleString()}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Health modal error:', error);
        showToast('Failed to load health report', 'error');
    }
}

function closeHealthModal() {
    const modal = document.getElementById('healthModal');
    if (modal) modal.remove();
}

async function refreshHealthModal() {
    closeHealthModal();
    await checkSystemHealth();
    showHealthModal();
}

async function runAutoFix() {
    showToast('Running auto-fix...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/health/fix`, { method: 'POST' });
        const data = await response.json();
        
        if (data.fixes && data.fixes.length > 0) {
            let fixMsg = '';
            data.fixes.slice(0, 3).forEach(f => { fixMsg += f + ' '; });
            showToast(`✅ ${fixMsg}`, 'success');
        } else {
            showToast('✅ No issues to fix', 'success');
        }
        
        setTimeout(() => {
            closeHealthModal();
            checkSystemHealth();
        }, 1500);
        
    } catch (error) {
        showToast('❌ Auto-fix failed', 'error');
    }
}

// Initialize health check on page load
(function initHealthCheck() {
    setTimeout(() => {
        addHealthIndicator();
        startHealthCheckInterval();
    }, 1000);
})();

// Patch click handler for health modal
document.addEventListener('click', function(e) {
    const healthModal = document.getElementById('healthModal');
    if (healthModal && healthModal.style.display === 'flex') {
        const modalContent = healthModal.querySelector('.modal-content');
        const closeBtn = healthModal.querySelector('.modal-close');
        
        if (closeBtn && (e.target === closeBtn || closeBtn.contains(e.target))) {
            closeHealthModal();
        } else if (modalContent && !modalContent.contains(e.target)) {
            closeHealthModal();
        }
    }
});
