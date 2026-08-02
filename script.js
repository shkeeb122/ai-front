// ====================================================================
// 📁 FILE: script.js - PRO LEVEL LOGIC
// 🎯 ROLE: Frontend logic with image support, drag & drop, paste
// 📋 TOTAL FUNCTIONS: 50+
// ====================================================================

// ================= SECTION 1: CONFIGURATION =================
const API_URL = "https://umar-k20u.onrender.com";

// ================= SECTION 2: GLOBAL VARIABLES =================
let currentCampaign = null;
let recognition = null;
let isTyping = false;
let currentMessages = [];
let allCampaigns = [];
let selectedImages = [];
let isSending = false;

// ================= SECTION 3: INITIALIZATION =================
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
        setupDragDrop();
        setupPasteImage();
        console.log("✅ App initialized successfully");
    } catch (error) {
        console.error("❌ Initialization error:", error);
        showToast("Failed to initialize app", "error");
    }
}

// ================= SECTION 4: EVENT LISTENERS =================
function setupEventListeners() {
    const textarea = document.getElementById("chat_input");
    const sendBtn = document.getElementById("sendBtn");
    const imageInput = document.getElementById("imageInput");
    const imageBtn = document.getElementById("imageBtn");
    
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
        // Ctrl + N = New Chat
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            newChat();
        }
        // Ctrl + I = Image upload
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            if (imageInput) imageInput.click();
        }
    });
}

// ================= SECTION 5: IMAGE UPLOAD =================
function handleImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    for (const file of files) {
        // Validate
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
            <img src="${img.url}" alt="${img.name}">
            <button class="remove-img" onclick="removeImage(${index})" title="Remove image">×</button>
        `;
        item.onclick = () => openImageModal(img.url);
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

// ================= SECTION 6: DRAG & DROP =================
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
        
        // Trigger file input change
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
    
    zone.addEventListener('click', function() {
        const input = document.getElementById('imageInput');
        if (input) input.click();
    });
}

// ================= SECTION 7: PASTE IMAGE =================
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

// ================= SECTION 8: IMAGE MODAL =================
function openImageModal(src) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('imageModalImg');
    if (modal && img) {
        img.src = src;
        modal.style.display = 'flex';
    }
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ================= SECTION 9: SEND CHAT WITH IMAGES =================
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
    
    // Build text
    let text = message || "Describe this image";
    let images = selectedImages.map(img => ({
        type: img.type,
        data: img.data
    }));
    
    // Clear input
    input.value = "";
    updateCharCount();
    autoResizeTextarea();
    
    // Show user message
    if (message) {
        appendMessage("user", message);
        currentMessages.push({ role: "user", content: message });
    }
    
    // Show images in chat
    if (images.length > 0) {
        appendImagesToChat("user", images.map(img => img.url));
    }
    
    showTypingIndicator();
    
    try {
        // If images present, use /chat/image endpoint
        if (images.length > 0) {
            // Send first image (or all)
            const imageUrl = `data:${images[0].type};base64,${images[0].data}`;
            
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
            const aiResponse = data.response || "I couldn't analyze this image.";
            
            hideTypingIndicator();
            appendMessage("ai", aiResponse);
            currentMessages.push({ role: "assistant", content: aiResponse });
            
            // Save campaign
            if (!currentCampaign) {
                // Create campaign from first message
                const commandResponse = await fetch(`${API_URL}/command`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ command: message || "Image analysis" })
                });
                if (commandResponse.ok) {
                    const cmdData = await commandResponse.json();
                    currentCampaign = cmdData.campaign_id;
                }
            }
        } else {
            // Normal chat
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
        }
        
        await loadCampaigns();
        clearAllImages();
        document.getElementById('imageBtn').classList.remove('has-image');
        
    } catch (error) {
        console.error("Error:", error);
        showToast("Failed to send message", "error");
        hideTypingIndicator();
        appendMessage("ai", "Sorry, I encountered an error. Please try again.");
    } finally {
        isSending = false;
    }
}

// ================= SECTION 10: APPEND IMAGES TO CHAT =================
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

// ================= SECTION 11: TYPING INDICATOR =================
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
            <span style="font-size:12px; color:var(--text-secondary); margin-left:8px;">AI is thinking...</span>
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
    if (indicator) {
        indicator.remove();
    }
}

// ================= SECTION 12: LOAD CAMPAIGNS =================
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
        list.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-inbox"></i>
                <p>No chats yet</p>
                <p style="font-size:12px; color:var(--text-secondary);">Start a new chat!</p>
            </div>
        `;
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

// ================= SECTION 13: NEW CHAT =================
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

// ================= SECTION 15: HELPER FUNCTIONS =================
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
        if (sendBtn) {
            sendBtn.disabled = count === 0 && selectedImages.length === 0;
        }
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
    if (textarea) {
        textarea.addEventListener("input", autoResizeTextarea);
    }
}

function scrollToBottom() {
    setTimeout(() => {
        const box = document.getElementById("history_result");
        if (box) box.scrollTop = box.scrollHeight;
    }, 100);
}

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

function removeActiveClass() {
    document.querySelectorAll(".chat-item").forEach(item => {
        item.classList.remove("active");
    });
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

// ================= SECTION 16: SHORTCUTS =================
console.log("🔄 Shortcuts:");
console.log("  Ctrl + N - New Chat");
console.log("  Ctrl + I - Upload Image");
console.log("  Ctrl + V - Paste Image");
