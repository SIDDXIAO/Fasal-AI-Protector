/* ═══════════════════════════════════════════
   AI ASSISTANT — Chat Script v7.0
   Streaming + Voice + Copy + Better UX
   ═══════════════════════════════════════════ */

/**
 * Send message to AI Assistant backend
 */
async function sendAssistantMsg(presetMsg) {
    const input = document.getElementById('ai-input');
    const message = presetMsg || (input ? input.value.trim() : '');
    if (!message) return;

    appendAiMessage(message, 'user');
    if (input) input.value = '';

    const typingEl = document.getElementById('ai-typing');
    if (typingEl) typingEl.style.display = 'block';
    scrollAiMessages();

    try {
        const response = await fetch('/api/assistant/chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken') || ''
            },
            body: JSON.stringify({ message })
        });

        if (typingEl) typingEl.style.display = 'none';

        if (!response.ok) {
            appendAiMessage('⚠️ Server error (' + response.status + '). Please try again.', 'bot');
            return;
        }

        const contentType = response.headers.get('Content-Type') || '';

        if (contentType.includes('event-stream') || contentType.includes('text/plain') || contentType.includes('text/html')) {
            // Streaming mode
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
                        const textContainer = botBubble.querySelector('.message-text');
                        if (textContainer) {
                            textContainer.innerHTML = formatAiText(fullText);
                        } else {
                            botBubble.innerHTML = formatAiText(fullText);
                        }
                        scrollAiMessages();
                    }
                }
            } catch (streamErr) {
                console.error('Stream error:', streamErr);
            }

            if (!fullText.trim()) {
                const textContainer = botBubble.querySelector('.message-text');
                if (textContainer) {
                    textContainer.innerHTML = formatAiText('⚠️ No response from AI server. Is LM Studio running?');
                } else {
                    botBubble.innerHTML = formatAiText('⚠️ No response from AI server. Is LM Studio running?');
                }
            }

            // Add copy button
            addCopyButton(botBubble, fullText);

        } else if (contentType.includes('application/json')) {
            const data = await response.json();
            const text = data.response || data.error || 'No response received.';
            appendAiMessage(text, 'bot', true);
        } else {
            const text = await response.text();
            if (text && text.trim()) {
                appendAiMessage(text, 'bot', true);
            } else {
                appendAiMessage('⚠️ Empty response from server.', 'bot');
            }
        }

        // Update status to online
        updateAiStatus(true);

    } catch (err) {
        if (typingEl) typingEl.style.display = 'none';
        console.error('AI Assistant Error:', err);
        updateAiStatus(false);
        appendAiMessage(
            '⚠️ Cannot connect to AI server. Please make sure Django server and LM Studio are running.',
            'bot'
        );
    }
}

/**
 * Update AI status badge
 */
function updateAiStatus(online) {
    const badge = document.getElementById('ai-status-badge');
    if (badge) {
        badge.innerHTML = online
            ? '<i class="fas fa-circle" style="color:#7fff7f; font-size:0.45rem;"></i>&nbsp; Online'
            : '<i class="fas fa-circle" style="color:#ff4444; font-size:0.45rem;"></i>&nbsp; Offline';
    }
}

/**
 * Append a message bubble
 */
function appendAiMessage(text, role, addCopy = false) {
    const container = document.getElementById('ai-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = role === 'user' ? 'ai-bubble ai-user-bubble' : 'ai-bubble ai-bot-bubble';
    div.style.position = 'relative';

    const wrapper = document.createElement('div');
    wrapper.className = 'message-content-wrapper';

    let contentHtml = '';
    if (role === 'bot') {
        contentHtml = `
            <div class="avatar-icon">🤖</div>
            <div class="message-text">${formatAiText(text)}</div>
        `;
    } else {
        contentHtml = `
            <div class="user-message-text">${escapeHtml(text)}</div>
        `;
    }

    wrapper.innerHTML = contentHtml;
    div.appendChild(wrapper);

    if (addCopy && role === 'bot') {
        addCopyButton(div, text);
    }

    container.appendChild(div);
    scrollAiMessages();
}

/**
 * Create empty bot bubble for streaming
 */
function createAiBotBubble() {
    const container = document.getElementById('ai-messages');
    const div = document.createElement('div');
    div.className = 'ai-bubble ai-bot-bubble';
    div.style.position = 'relative';

    const wrapper = document.createElement('div');
    wrapper.className = 'message-content-wrapper';
    
    wrapper.innerHTML = `
        <div class="avatar-icon">🤖</div>
        <div class="message-text"></div>
    `;

    div.appendChild(wrapper);
    container.appendChild(div);
    
    // Return the actual div, but we will target .message-text when updating innerHTML
    return div;
}

/**
 * Add copy-to-clipboard button to a bubble
 */
function addCopyButton(bubble, text) {
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.innerHTML = '<i class="fas fa-copy"></i>';
    btn.title = 'Copy';
    btn.onclick = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i>'; }, 1500);
        }).catch(() => {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i>'; }, 1500);
        });
    };
    
    // Add inside the wrapper or inside the bubble
    // Usually copy btn goes to top right of the wrapper
    const wrapper = bubble.querySelector('.message-content-wrapper') || bubble;
    wrapper.style.position = 'relative';
    wrapper.appendChild(btn);
}

/**
 * Convert markdown-like syntax to HTML
 */
function formatAiText(text) {
    return text
        // Headers
        .replace(/^### (.+)$/gm, '<h4 style="margin:8px 0 4px; color:var(--primary);">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 style="margin:10px 0 4px; color:var(--primary);">$1</h3>')
        // Bold & Italic
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Lists
        .replace(/^[-•] (.+)$/gm, '<li style="margin-left:16px; list-style:disc;">$1</li>')
        .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:16px; list-style:decimal;">$1</li>')
        // Code
        .replace(/`([^`]+)`/g, '<code style="background:var(--bg-main); padding:1px 5px; border-radius:4px; font-size:0.84em;">$1</code>')
        // Newlines
        .replace(/\n/g, '<br>');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Scroll to bottom
 */
function scrollAiMessages() {
    const container = document.getElementById('ai-messages');
    if (container) container.scrollTop = container.scrollHeight;
}

/**
 * Voice input for AI assistant
 */
function startAssistantVoice() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        if (typeof showToast === 'function') showToast('Voice input not supported', 'warning');
        return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    const micIcon = document.getElementById('ai-mic-icon');

    rec.lang = typeof getVoiceLang === 'function' ? getVoiceLang() : 'hi-IN';
    rec.interimResults = false;

    if (micIcon) micIcon.className = 'fas fa-microphone-slash';

    rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        const inp = document.getElementById('ai-input');
        if (inp) inp.value = transcript;
        if (micIcon) micIcon.className = 'fas fa-microphone';
    };

    rec.onerror = () => { if (micIcon) micIcon.className = 'fas fa-microphone'; };
    rec.onend = () => { if (micIcon) micIcon.className = 'fas fa-microphone'; };

    rec.start();
}

/**
 * Helper: getCookie (reuse from script.js if available, otherwise define)
 */
if (typeof getCookie !== 'function') {
    function getCookie(name) {
        let value = null;
        if (document.cookie) {
            document.cookie.split(';').forEach(c => {
                c = c.trim();
                if (c.startsWith(name + '=')) {
                    value = decodeURIComponent(c.substring(name.length + 1));
                }
            });
        }
        return value;
    }
}