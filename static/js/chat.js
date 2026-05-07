/* ═══════════════════════════════════════════
    AI ASSISTANT — Chat & Voice Dashboard Script
    ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('agriUser');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            const firstName = user.full_name ? user.full_name.split(' ')[0] : (user.username || 'Farmer');
            const hiNameSpan = document.querySelector('.ai-user-name');
            const enNameSpan = document.querySelector('.ai-user-name-en');
            if (hiNameSpan) hiNameSpan.innerText = firstName;
            if (enNameSpan) enNameSpan.innerText = firstName;
        } catch(e) { console.error("Name fetch error:", e); }
    }
    initChatVoiceInput();
});

function detectLanguage(text) {
    // Hindi (Devanagari)
    if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
    // Punjabi (Gurmukhi)
    if (/[\u0A00-\u0A7F]/.test(text)) return 'pa-IN';
    // Bengali
    if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN';
    // Tamil
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN';
    // Telugu
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';
    // Kannada
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN';
    // Malayalam
    if (/[\u0D00-\u0D7F]/.test(text)) return 'ml-IN';
    // Gujarati
    if (/[\u0A80-\u0AFF]/.test(text)) return 'gu-IN';
    // Odia
    if (/[\u0B00-\u0B7F]/.test(text)) return 'or-IN';
    // Marathi (uses Devanagari like Hindi)
    if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
    return 'en-IN';
}

// ═══════════════════════════════════════════════════════════════
// CHAT MIC INPUT - Voice to Text in Chat Box
// ═══════════════════════════════════════════════════════════════
let chatRecognition = null;
let isChatListening = false;

function initChatVoiceInput() {
    const micBtn = document.getElementById('chat-mic-btn');
    if (!micBtn) return;

    micBtn.addEventListener('click', function() {
        if (isChatListening) {
            stopChatVoiceInput();
        } else {
            startChatVoiceInput();
        }
    });
}

function startChatVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Voice input not supported in this browser', 'warning');
        return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    chatRecognition = new SR();
    chatRecognition.continuous = false;
    chatRecognition.interimResults = true;
    chatRecognition.lang = getVoiceLang ? getVoiceLang() : 'hi-IN';

    const input = document.getElementById('ai-input');
    const micBtn = document.getElementById('chat-mic-btn');

    chatRecognition.onstart = function() {
        isChatListening = true;
        if (micBtn) {
            micBtn.classList.add('listening');
            micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        }
        if (input) input.placeholder = 'Listening...';
    };

    chatRecognition.onresult = function(event) {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        if (input) input.value = transcript;
    };

    chatRecognition.onerror = function(event) {
        console.error('Voice recognition error:', event.error);
        stopChatVoiceInput();
    };

    chatRecognition.onend = function() {
        stopChatVoiceInput();
    };

    chatRecognition.start();
}

function stopChatVoiceInput() {
    if (chatRecognition) {
        chatRecognition.stop();
    }
    isChatListening = false;
    const micBtn = document.getElementById('chat-mic-btn');
    const input = document.getElementById('ai-input');
    if (micBtn) {
        micBtn.classList.remove('listening');
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    }
    if (input) input.placeholder = 'Ask about farming, crops, fertilizers...';
}

// ─── CHAT LOGIC ───
async function sendAssistantMsg(presetMsg) {
    const input = document.getElementById('ai-input');
    const message = presetMsg || (input ? input.value.trim() : '');
    if (!message) return;

    appendAiMessage(message, 'user');
    if (input) input.value = '';

    const typingEl = document.getElementById('ai-typing');
    if (typingEl) typingEl.style.display = 'block';
    scrollAiMessages();

    const detectedLang = detectLanguage(message);

    try {
        const response = await fetch('/api/assistant/chat/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') || '' },
            body: JSON.stringify({ message: message, lang: detectedLang })
        });

        if (typingEl) typingEl.style.display = 'none';

        if (!response.ok) {
            appendAiMessage('⚠️ Server error. Please try again.', 'bot');
            return;
        }

        const contentType = response.headers.get('Content-Type') || '';
        if (contentType.includes('event-stream') || contentType.includes('text/')) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            const botBubble = createAiBotBubble();
            let fullText = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    if (chunk) {
                        fullText += chunk;
                        const textContainer = botBubble.querySelector('.message-text') || botBubble;
                        textContainer.innerHTML = formatAiText(fullText);
                        scrollAiMessages();
                    }
                }
            } catch (e) {}
            addMessageActions(botBubble, fullText, detectedLang);
        } else {
            const data = await response.json();
            appendAiMessage(data.response || 'No response', 'bot', true, detectedLang);
        }
        updateAiStatus(true);
    } catch (err) {
        if (typingEl) typingEl.style.display = 'none';
        updateAiStatus(false);
        appendAiMessage('⚠️ Cannot connect to AI server.', 'bot');
    }
}

function updateAiStatus(online) {
    const badge = document.getElementById('ai-status-badge');
    if (badge) {
        badge.innerHTML = online
            ? '<i class="fas fa-circle" style="color:#00b09b; font-size: 0.7rem;"></i> <span style="font-size: 0.8rem;">Online</span>'
            : '<i class="fas fa-circle" style="color:#ff4444; font-size: 0.7rem;"></i> <span style="font-size: 0.8rem;">Offline</span>';
    }

    // Also update any other status indicators
    const statusText = document.getElementById('ai-connection-status');
    if (statusText) {
        statusText.textContent = online ? 'Connected to AI' : 'AI Offline - Using fallback';
    }
}

function appendAiMessage(text, role, addActions = false, lang = 'en-IN') {
    const container = document.getElementById('ai-messages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = role === 'user' ? 'ai-bubble ai-user-bubble' : 'ai-bubble ai-bot-bubble';
    const wrapper = document.createElement('div');
    wrapper.className = 'message-content-wrapper';
    wrapper.innerHTML = role === 'bot' ? `<div class="message-text">${formatAiText(text)}</div>` : `<div class="user-message-text">${escapeHtml(text)}</div>`;
    div.appendChild(wrapper);
    if (addActions && role === 'bot') addMessageActions(div, text, lang);
    container.appendChild(div);
    scrollAiMessages();
}

function createAiBotBubble() {
    const container = document.getElementById('ai-messages');
    const div = document.createElement('div');
    div.className = 'ai-bubble ai-bot-bubble';
    div.innerHTML = `<div class="message-content-wrapper"><div class="message-text"></div></div>`;
    container.appendChild(div);
    return div;
}

function addMessageActions(bubble, text, lang) {
    const wrapper = bubble.querySelector('.message-content-wrapper') || bubble;
    const actionBar = document.createElement('div');
    actionBar.className = 'modern-action-bar';
    actionBar.innerHTML = `
        <button class="mod-action-btn" title="Like"><i class="far fa-thumbs-up"></i></button>
        <button class="mod-action-btn copy-btn" title="Copy"><i class="far fa-copy"></i></button>
        <button class="mod-action-btn export-btn" title="Export to Docx"><i class="fas fa-file-export"></i></button>
        <button class="mod-action-btn listen-btn" title="Listen"><i class="fas fa-volume-up"></i></button>
    `;

    actionBar.querySelector('.copy-btn').onclick = function(e) {
        e.stopPropagation(); navigator.clipboard.writeText(text);
        this.innerHTML = '<i class="fas fa-check"></i>'; setTimeout(() => this.innerHTML = '<i class="far fa-copy"></i>', 1500);
    };
    actionBar.querySelector('.export-btn').onclick = (e) => { e.stopPropagation(); exportToDocx(text); };
    actionBar.querySelector('.listen-btn').onclick = (e) => { e.stopPropagation(); playTTS(text, lang); };
    wrapper.appendChild(actionBar);
}

// ─── CHAT HELPERS ───
let currentUtterance = null;
let isSpeaking = false;

function playTTS(text, langCode) {
    // Stop any current speech
    window.speechSynthesis.cancel();
    isSpeaking = true;

    // Clean text - remove markdown formatting
    const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/[#_]/g, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/\n+/g, ' ')
        .trim();

    if (!cleanText) return;

    currentUtterance = new SpeechSynthesisUtterance(cleanText);
    currentUtterance.lang = langCode || 'hi-IN';
    currentUtterance.rate = 0.9;
    currentUtterance.pitch = 1.0;
    currentUtterance.volume = 1.0;

    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = currentUtterance.lang.split('-')[0];

    // Find best matching voice
    const bestVoice = voices.find(v =>
        v.lang.includes(langPrefix) &&
        (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Online'))
    ) || voices.find(v => v.lang.includes(langPrefix)) || voices[0];

    if (bestVoice) {
        currentUtterance.voice = bestVoice;
    }

    currentUtterance.onend = () => {
        isSpeaking = false;
        updateListenButtonState(false);
    };

    currentUtterance.onerror = (e) => {
        console.error('TTS Error:', e);
        isSpeaking = false;
        updateListenButtonState(false);
    };

    updateListenButtonState(true);
    window.speechSynthesis.speak(currentUtterance);
}

function stopSpeaking() {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    updateListenButtonState(false);
}

function updateListenButtonState(speaking) {
    document.querySelectorAll('.listen-btn').forEach(btn => {
        if (speaking) {
            btn.innerHTML = '<i class="fas fa-stop"></i>';
            btn.title = 'Stop';
            btn.onclick = (e) => {
                e.stopPropagation();
                stopSpeaking();
            };
        } else {
            btn.innerHTML = '<i class="fas fa-volume-up"></i>';
            btn.title = 'Listen';
            // Restore original playTTS - will be set when message is created
        }
    });
}

function exportToDocx(text) {
    const html = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>AI Response</title></head><body>" + text.replace(/\n/g, '<br>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') + "</body></html>";
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'Fasal_AI.doc';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function formatAiText(text) {
    return text.replace(/^### (.+)$/gm, '<h4 style="color:var(--primary);">$1</h4>').replace(/^## (.+)$/gm, '<h3 style="color:var(--primary);">$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^[-•] (.+)$/gm, '<li style="margin-left:16px;">$1</li>').replace(/\n/g, '<br>');
}
function escapeHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function scrollAiMessages() { const c = document.getElementById('ai-messages'); if (c) c.scrollTop = c.scrollHeight; }
if (typeof getCookie !== 'function') { function getCookie(name) { let v = null; if (document.cookie) { document.cookie.split(';').forEach(c => { c = c.trim(); if (c.startsWith(name + '=')) v = decodeURIComponent(c.substring(name.length + 1)); }); } return v; } }

/* ═════════════════════════════════════════════════
   VOICE DASHBOARD MODAL LOGIC (NEW)
   ═════════════════════════════════════════════════ */

let dashRecognition;
let isDashListening = false;
let dashVoices = [];

function openVoiceDashboard() {
    document.getElementById('voice-dashboard-modal').style.display = 'flex';
    populateDashboardVoices();
}

function closeVoiceDashboard() {
    document.getElementById('voice-dashboard-modal').style.display = 'none';
    if(isDashListening && dashRecognition) dashRecognition.stop();
    window.speechSynthesis.cancel();
}

function populateDashboardVoices() {
    dashVoices = window.speechSynthesis.getVoices();
    const select = document.getElementById('voice-select');
    if(!select) return;
    select.innerHTML = '';
    const relevant = dashVoices.filter(v => v.lang.includes('hi') || v.lang.includes('en'));
    (relevant.length > 0 ? relevant : dashVoices).forEach(v => {
        const opt = document.createElement('option');
        opt.textContent = `${v.name} (${v.lang})`;
        opt.setAttribute('data-name', v.name);
        select.appendChild(opt);
    });
}
if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = populateDashboardVoices;

function toggleDashboardListening() {
    const btn = document.getElementById('btn-listen');
    const display = document.getElementById('voice-display-text');
    const wave = document.getElementById('waveform-icon');

    if (isDashListening) {
        if(dashRecognition) dashRecognition.stop();
        return;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        dashRecognition = new SR();
        dashRecognition.continuous = false;
        dashRecognition.interimResults = true;
        dashRecognition.lang = "hi-IN";

        dashRecognition.onstart = () => {
            isDashListening = true;
            btn.innerText = "Stop Listening"; btn.style.background = "#ef4444";
            wave.classList.add('active');
            display.innerText = "सुन रहा हूँ...";
        };

        dashRecognition.onresult = (e) => {
            let transcript = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) transcript += e.results[i][0].transcript;
            display.innerText = transcript;
        };

        dashRecognition.onend = () => {
            isDashListening = false;
            btn.innerText = "Start Listening"; btn.style.background = "#f1f5f9";
            wave.classList.remove('active');
        };

        dashRecognition.start();
    } else {
        alert("Browser does not support Speech Recognition.");
    }
}

function testDashboardVoice() {
    const text = document.getElementById('voice-display-text').innerText;
    if (!text || text === 'सुन रहा हूँ...') return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = parseFloat(document.getElementById('rate-slider').value);
    utterance.pitch = parseFloat(document.getElementById('pitch-slider').value);
    
    const vName = document.getElementById('voice-select').selectedOptions[0]?.getAttribute('data-name');
    if(vName) utterance.voice = dashVoices.find(v => v.name === vName);

    const wave = document.getElementById('waveform-icon');
    utterance.onstart = () => wave.classList.add('active');
    utterance.onend = () => wave.classList.remove('active');
    window.speechSynthesis.speak(utterance);
}

// User boli hui line ko seedha chat me bhejna
function sendVoiceToChat() {
    const text = document.getElementById('voice-display-text').innerText;
    if (!text || text === 'सुन रहा हूँ...' || text === 'नमस्ते! मैं आपका वॉइस असिस्टेंट हूँ। आप जो भी बोलेंगे, मैं उसे टाइप कर दूंगा।') {
        alert("Pehle kuch boliye!"); return;
    }
    
    closeVoiceDashboard();
    
    const input = document.getElementById('ai-input');
    if(input) {
        input.value = text;
        sendAssistantMsg(); 
    }
}