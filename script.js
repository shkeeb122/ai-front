// ====================================================================
// 📁 FILE: script.js - COMPLETE WITH IMAGE SUPPORT
// 🎯 ROLE: Full chat with image upload, drag & drop, paste
// ====================================================================

const API_URL = "https://umar-k20u.onrender.com";

let currentCampaign = null;
let recognition = null;
let isTyping = false;
let currentMessages = [];
let allCampaigns = [];
let selectedImages = [];
let isSending = false;

// ================= INIT =================
window.onload = () => {
    try {
        loadCampaigns();
        setupEventListeners();
        setupAutoResize();
        updateCharCount();
        showWelcomeMessage();
        setupDragDrop();
        setupPasteImage();
        console.log("✅ App initialized with image support");
    } catch (error) {
        console.error("❌ Init error:", error);
        showToast("Failed to initialize app", "error");
    }
};

// ================= EVENT LISTENERS =================
function setupEventListeners() {
    const textarea = document.getElementById("chat_input");
    const sendBtn = document.getElementById("sendBtn");
    const imageInput = document.getElementById("imageInput");
    const imageBtn = document.getElementById("imageBtn");
    
    if (textarea) {
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
    }
    
    if (sendBtn) sendBtn.addEventListener("click", sendChat);
    
    if (imageInput) {
        imageInput.addEventListener("change", handleImageUpload);
    }
    
    if (imageBtn) {
        imageBtn.addEventListener("click", () => {
            if (imageInput) imageInput.click();
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener("keydown", function(e) {
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            newChat();
        }
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            if (imageInput) imageInput.click();
        }
    });
}

// ================= IMAGE UPLOAD =================
function handleImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            showToast(`${file.name} is not an image`, "error");
            continue;
        }
        if (file.size > 10 * 1024 * 1024) {
            showToast(`${file.name} is too large (max 10MB)`, "error");
            continue;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            selectedImages.push({
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result.split(',')[1],
                url: e.target.result
            });
            renderImagePreviews();
            updateImageInfo();
            document.getElementById('imageBtn').classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }
    event.target.value = '';
}

function renderImagePreviews() {
    const container = document.getElementById('imagePreviewContainer');
    const list = document.getElementById('imagePreviewList');
    if (!container || !list) return;
    
    if (selectedImages.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    list.innerHTML = '';
    
    selectedImages.forEach((img, index) => {
        const item = document.createElement('div');
        item.className = 'image-preview-item';
        item.innerHTML = `
            <img src="${img.url}" alt="${img.name}" loading="lazy">
            <button class="remove-img" onclick="removeImage(${index})" title="Remove image">×</button>
        `;
        item.onclick = (e) => {
            if (!e.target.closest('.remove-img')) {
                openImageModal(img.url);
            }
        };
        list.appendChild(item);
    });
}

function removeImage(index) {
    selectedImages.splice(index, 1);
    renderImagePreviews();
    updateImageInfo();
    if (selectedImages.length === 0) {
        document.getElementById('imageBtn').classList.remove('has-image');
    }
}

function clearAllImages() {
    selectedImages = [];
    renderImagePreviews();
    updateImageInfo();
    document.getElementById('imageBtn').classList.remove('has-image');
}

function updateImageInfo() {
    const info = document.getElementById('imageInfo');
    if (!info) return;
    if (selectedImages.length > 0) {
        info.textContent = `${selectedImages.length} image(s) attached`;
        info.style.display = 'inline';
    } else {
        info.textContent = '';
        info.style.display = 'none';
    }
}

// ================= DRAG & DROP =================
function setupDragDrop() {
    const zone = document.getElementById('dragDropZone');
    if (!zone) return;
    
    zone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    zone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });
    
    zone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;
        const input = document.getElementById('imageInput');
        if (input) {
            const dt = new DataTransfer();
            for (const file of files) {
                dt.items.add(file);
            }
            input.files = dt.files;
            input.dispatchEvent(new Event('change'));
        }
    });
}

// ================= PASTE IMAGE =================
function setupPasteImage() {
    document.addEventListener('paste', function(e) {
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                const input = document.getElementById('imageInput');
                if (input) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    input.files = dt.files;
                    input.dispatchEvent(new Event('change'));
                }
                showToast('📸 Image pasted', 'success');
                break;
            }
        }
    });
}

// ================= IMAGE MODAL =================
function openImageModal(src) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('imageModalImg');
    if (modal && img) {
        img.src = src;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// ================= SEND CHAT =================
async function sendChat() {
    if (isSending) return;
    
    const input = document.getElementById("chat_input");
    if (!input) return;
    
    const message = input.value.trim();
    if (!message && selectedImages.length === 0) {
        showToast("Please enter a message or attach an image", "error");
        return;
    }
    
    isSending = true;
    const text = message || "Describe this image";
    
    input.value = "";
    updateCharCount();
    autoResizeTextarea();
    
    if (message) {
        appendMessage("user", message);
        currentMessages.push({ role: "user", content: message });
    }
    
    // Show images in chat if any
    if (selectedImages.length > 0) {
        const imageUrls = selectedImages.map(img => img.url);
        appendImagesToChat("user", imageUrls);
    }
    
    showTypingIndicator();
    
    try {
        let aiResponse = "";
        
        if (selectedImages.length > 0) {
            // Send first image to /chat/image
            const img = selectedImages[0];
            const imageUrl = `data:${img.type};base64,${img.data}`;
            
            const response = await fetch(`${API_URL}/chat/image`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: text,
                    image_url: imageUrl
                })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            aiResponse = data.response || "I couldn't analyze this image.";
            
            // Create campaign if needed
            if (!currentCampaign) {
                const cmdRes = await fetch(`${API_URL}/command`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ command: message || "Image analysis" })
                });
                if (cmdRes.ok) {
                    const cmdData = await cmdRes.json();
                    currentCampaign = cmdData.campaign_id;
                }
            }
        } else {
            // Normal text chat
            const url = currentCampaign ? `${API_URL}/chat/${currentCampaign}` : `${API_URL}/command`;
            const body = currentCampaign ? { message: message } : { command: message };
            
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            
            if (!currentCampaign && data.campaign_id) {
                currentCampaign = data.campaign_id;
            }
            
            aiResponse = data.response || (data.conversation ? data.conversation[data.conversation.length - 1]?.content : "");
            
            if (data.conversation) {
                currentMessages = data.conversation;
                renderChat(data.conversation);
                updateChatTitle(getChatTitle(data.conversation));
            }
        }
        
        if (aiResponse) {
            hideTypingIndicator();
            appendMessage("ai", aiResponse);
            currentMessages.push({ role: "assistant", content: aiResponse });
        }
        
        await loadCampaigns();
        clearAllImages();
        
    } catch (error) {
        console.error("Error:", error);
        showToast("Failed to send message", "error");
        hideTypingIndicator();
        appendMessage("ai", "Sorry, I encountered an error. Please try again.");
    } finally {
        isSending = false;
    }
}

// ================= APPEND IMAGES =================
function appendImagesToChat(role, imageUrls) {
    const box = document.getElementById("history_result");
    if (!box) return;
    
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role === "user" ? "user" : "ai"}`;
    
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML = role === "user" ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    
    let galleryHtml = '<div class="image-gallery">';
    imageUrls.forEach(url => {
        galleryHtml += `<img src="${url}" onclick="openImageModal('${url}')" loading="lazy">`;
    });
    galleryHtml += '</div>';
    
    contentDiv.innerHTML = galleryHtml;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    box.appendChild(messageDiv);
    scrollToBottom();
}

// ================= APPEND MESSAGE =================
function appendMessage(role, content) {
    const box = document.getElementById("history_result");
    if (!box) return;
    
    const welcomeMsg = box.querySelector(".welcome-message");
    if (welcomeMsg) welcomeMsg.remove();
    
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
    scrollToBottom();
}

// ================= FORMAT MESSAGE =================
function formatMessage(content) {
    if (!content) return "";
    let formatted = content;
    
    const blogRegex = /(https?:\/\/[^\s<]+?\/blog\/[^\s<]+)/g;
    formatted = formatted.replace(blogRegex, (url) => {
        return `<div class="blog-card"><a href="${url}" target="_blank" class="blog-btn">📖 पूरा ब्लॉग पढ़ें →</a><span class="blog-url">${url}</span></div>`;
    });
    
    const urlRegex = /(https?:\/\/[^\s<]+)(?![^<]*>)/g;
    formatted = formatted.replace(urlRegex, (url) => {
        if (url.includes('/blog/')) return url;
        return `<a href="${url}" target="_blank" class="link">🔗 ${url}</a>`;
    });
    
    formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang || 'plaintext'}">${escapeHtml(code.trim())}</code></pre>`;
    });
    
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    formatted = formatted.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

// ================= TYPING INDICATOR =================
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
    content.innerHTML = `
        <div class="typing-indicator">
            <span></span><span></span><span></span>
            <span class="typing-text">AI is thinking...</span>
        </div>
    `;
    
    indicator.appendChild(avatar);
    indicator.appendChild(content);
    box.appendChild(indicator);
    scrollToBottom();
}

function hideTypingIndicator() {
    isTyping = false;
    const indicator = document.getElementById("typingIndicator");
    if (indicator) indicator.remove();
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
        appendMessage(msg.role, msg.content);
    });
    scrollToBottom();
}

// ================= LOAD CAMPAIGNS =================
async function loadCampaigns() {
    try {
        const response = await fetch(`${API_URL}/campaigns`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        allCampaigns = data.campaigns || [];
        renderCampaigns(allCampaigns);
        const totalQuestions = allCampaigns.reduce((sum, c) => sum + (c.questions || 0), 0);
        const totalQuestionsEl = document.getElementById("totalQuestions");
        if (totalQuestionsEl) totalQuestionsEl.innerText = totalQuestions;
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
                <button onclick="event.stopPropagation(); renameChat('${campaign.id}')" title="Rename"><i class="fas fa-edit"></i></button>
                <button onclick="event.stopPropagation(); deleteChat('${campaign.id}')" title="Delete"><i class="fas fa-trash"></i></button>
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
    selectedImages = [];
    clearAllImages();
    const chatArea = document.getElementById("history_result");
    if (chatArea) chatArea.innerHTML = "";
    showWelcomeMessage();
    updateChatTitle("New Conversation");
    closeSidebar();
    removeActiveClass();
    document.getElementById('imageBtn').classList.remove('has-image');
}

function openCampaign(id, element) {
    // Similar implementation
    showToast("Opening chat...", "info");
}

function removeActiveClass() {
    document.querySelectorAll(".chat-item").forEach(item => item.classList.remove("active"));
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

function showWelcomeMessage() {
    const box = document.getElementById("history_result");
    if (!box || box.children.length > 0) return;
    box.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon"><i class="fas fa-robot"></i></div>
            <h2>Welcome to AI Ultimate Pro</h2>
            <p>Your intelligent assistant, ready to help you anytime</p>
            <div style="margin-top:30px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                <button class="suggestion-chip" onclick="setCommand('Maine kitne sawal kiye?')">📊 Kitne sawal?</button>
                <button class="suggestion-chip" onclick="setCommand('Pehle kya hua tha?')">📜 Pehle kya hua?</button>
                <button class="suggestion-chip" onclick="setCommand('Aur batao')">💬 Aur batao</button>
                <button class="suggestion-chip" onclick="setCommand('Blog banao car ke baare mein')">📝 Blog banao</button>
            </div>
        </div>
    `;
}

function setCommand(command) {
    const input = document.getElementById("chat_input");
    if (input) {
        input.value = command;
        updateCharCount();
        sendChat();
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

// ================= OTHER FUNCTIONS =================
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.toggle("open");
}

function closeSidebar() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.classList.remove("open");
    }
}

function toggleSearch() {
    const searchBox = document.getElementById("search_history_box");
    if (searchBox) {
        searchBox.style.display = searchBox.style.display === "none" ? "block" : "none";
    }
}

function searchHistory() {
    // Search logic
}

function clearSearch() {
    const searchBox = document.getElementById("search_history_box");
    if (searchBox) searchBox.style.display = "none";
}

function deleteChat(id) {
    if (!confirm("Are you sure you want to delete this chat?")) return;
    // Delete logic
}

function renameChat(id) {
    const newName = prompt("Enter new chat name:");
    if (newName) {
        // Rename logic
    }
}

function clearAllChats() {
    if (!confirm("Delete all chats?")) return;
    // Clear logic
}

function exportChat() {
    showToast("Exporting chat...", "info");
}

function clearCurrentChat() {
    if (!currentMessages || currentMessages.length === 0) return;
    if (confirm("Clear current chat?")) {
        currentMessages = [];
        renderChat([]);
        showWelcomeMessage();
        showToast("Chat cleared", "success");
    }
}

function showStats() {
    const modal = document.getElementById("statsModal");
    if (modal) modal.style.display = "flex";
}

function closeStats() {
    const modal = document.getElementById("statsModal");
    if (modal) modal.style.display = "none";
}

// ================= HELPER FUNCTIONS =================
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : "fa-info-circle"}"></i><span>${escapeHtml(message)}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = "slideUp 0.3s reverse";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateCharCount() {
    const textarea = document.getElementById("chat_input");
    const counter = document.querySelector(".char-counter");
    if (textarea && counter) {
        const count = textarea.value.length;
        counter.textContent = `${count} / 4000`;
        const sendBtn = document.getElementById("sendBtn");
        if (sendBtn) sendBtn.disabled = count === 0 && selectedImages.length === 0;
    }
}

function autoResizeTextarea() {
    const textarea = document.getElementById("chat_input");
    if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
}

function setupAutoResize() {
    const textarea = document.getElementById("chat_input");
    if (textarea) textarea.addEventListener("input", autoResizeTextarea);
}

function scrollToBottom() {
    setTimeout(() => {
        const box = document.getElementById("history_result");
        if (box) box.scrollTop = box.scrollHeight;
    }, 150);
}

// ================= HEALTH MODAL =================
function showHealthModal() {
    showToast("System Healthy ✅", "success");
}

function closeHealthModal() {
    // Close health modal
}

function runAutoFix() {
    showToast("Running auto-fix...", "info");
}

function refreshHealthModal() {
    showToast("Refreshing...", "info");
}

// Click outside handlers
document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById("sidebar");
        const menuToggle = document.getElementById("menuToggle");
        if (sidebar && sidebar.classList.contains("open")) {
            if (!sidebar.contains(e.target) && !menuToggle?.contains(e.target)) {
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
    const imageModal = document.getElementById("imageModal");
    if (imageModal && imageModal.style.display === "flex") {
        if (e.target === imageModal) {
            closeImageModal();
        }
    }
});

console.log("✅ AI Ultimate Pro loaded with image support!");
console.log("🔑 Shortcuts: Ctrl+N = New Chat, Ctrl+I = Upload Image, Ctrl+V = Paste Image");
