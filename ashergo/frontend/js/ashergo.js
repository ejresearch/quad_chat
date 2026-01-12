// ASHER - AI Provider Testing Tool (Local Use, No Auth)

const API_BASE = window.location.origin;

// State
let currentConversation = null;
let conversations = [];
let currentTab = 'all';
let referenceDocuments = [];

// Provider configuration
const PROVIDER_INFO = {
    '1': { id: 'openai', name: 'ChatGPT', defaultModel: 'gpt-4o' },
    '2': { id: 'claude', name: 'Claude', defaultModel: 'claude-3-haiku-20240307' },
    '3': { id: 'gemini', name: 'Gemini', defaultModel: 'gemini-2.0-flash' },
    '4': { id: 'grok', name: 'Grok', defaultModel: 'grok-3' }
};

// Enabled providers
let enabledProviders = new Set(['1', '2', '3', '4']);

// Selected models per provider
let providerModels = {
    '1': 'gpt-4o',
    '2': 'claude-3-haiku-20240307',
    '3': 'gemini-2.0-flash',
    '4': 'grok-3'
};

// Reset providers to defaults
function resetProvidersToDefault() {
    enabledProviders = new Set(['1', '2', '3', '4']);
    providerModels = {
        '1': 'gpt-4o',
        '2': 'claude-3-haiku-20240307',
        '3': 'gemini-2.0-flash',
        '4': 'grok-3'
    };
    initProviderUI();
}

// Load provider settings from conversation data
function loadProviderSettings(settings) {
    enabledProviders = new Set(['1', '2', '3', '4']);
    providerModels = {
        '1': 'gpt-4o',
        '2': 'claude-3-haiku-20240307',
        '3': 'gemini-2.0-flash',
        '4': 'grok-3'
    };

    if (settings && Object.keys(settings).length > 0) {
        Object.keys(settings).forEach(num => {
            if (PROVIDER_INFO[num]) {
                if (settings[num].enabled === false) {
                    enabledProviders.delete(num);
                } else {
                    enabledProviders.add(num);
                }
                if (settings[num].model) {
                    providerModels[num] = settings[num].model;
                }
            }
        });
    }

    initProviderUI();
}

// Save provider settings to current conversation
async function saveProviderSettings() {
    if (!currentConversation) return;

    const settings = {};
    ['1', '2', '3', '4'].forEach(num => {
        settings[num] = {
            enabled: enabledProviders.has(num),
            model: providerModels[num]
        };
    });

    try {
        await fetch(`${API_BASE}/api/conversations/${currentConversation.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider_settings: settings })
        });
    } catch (error) {
        console.error('Error saving provider settings:', error);
    }
}

// Initialize provider UI from state
function initProviderUI() {
    ['1', '2', '3', '4'].forEach(num => {
        const isEnabled = enabledProviders.has(num);
        const model = providerModels[num];

        const toggle = document.getElementById(`toggle-${num}`);
        const select = document.getElementById(`model-${num}`);
        const badge = document.getElementById(`badge-${num}`);
        const panel = document.getElementById(`panel-${num}`);
        const tab = document.querySelector(`.tab[data-tab="${num}"]`);

        if (toggle) toggle.checked = isEnabled;
        if (select) {
            select.value = model;
            select.disabled = !isEnabled;
        }
        if (badge) badge.classList.toggle('disabled', !isEnabled);
        if (panel) panel.classList.toggle('disabled', !isEnabled);
        if (tab) tab.classList.toggle('disabled', !isEnabled);
    });
}

// Toggle provider popover
function toggleProviderPopover(num, event) {
    event.stopPropagation();
    document.querySelectorAll('.provider-popover').forEach(p => {
        if (p.id !== `popover-${num}`) {
            p.classList.remove('visible');
        }
    });
    document.getElementById(`popover-${num}`).classList.toggle('visible');
}

// Close popovers when clicking outside
function closeAllPopovers() {
    document.querySelectorAll('.provider-popover').forEach(p => {
        p.classList.remove('visible');
    });
}

// Toggle provider enabled/disabled
function toggleProvider(num) {
    const toggle = document.getElementById(`toggle-${num}`);
    const badge = document.getElementById(`badge-${num}`);
    const select = document.getElementById(`model-${num}`);
    const panel = document.getElementById(`panel-${num}`);
    const tab = document.querySelector(`.tab[data-tab="${num}"]`);

    const isNowEnabled = toggle.checked;

    if (isNowEnabled) {
        enabledProviders.add(num);
    } else {
        enabledProviders.delete(num);
    }

    badge.classList.toggle('disabled', !isNowEnabled);
    panel.classList.toggle('disabled', !isNowEnabled);
    select.disabled = !isNowEnabled;
    if (tab) tab.classList.toggle('disabled', !isNowEnabled);

    saveProviderSettings();

    if (currentConversation) {
        renderMessages();
    }
}

// Set provider model
function setProviderModel(num, model) {
    providerModels[num] = model;
    saveProviderSettings();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadConversations();
    setupEventListeners();

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.provider-badge') && !e.target.closest('.provider-popover')) {
            closeAllPopovers();
        }
    });

    initProviderUI();
    startLogoCarousel();
});

// Logo provider carousel animation
function startLogoCarousel() {
    const carousels = [
        document.querySelectorAll('.logo-provider-icon'),
        document.querySelectorAll('.welcome-provider-icon')
    ];

    let currentIndex = 0;

    setInterval(() => {
        carousels.forEach(icons => {
            if (icons.length > 0) {
                icons.forEach(icon => icon.classList.remove('active'));
                currentIndex = (currentIndex + 1) % icons.length;
                icons[currentIndex].classList.add('active');
            }
        });
    }, 1000);
}

// Theme
function loadTheme() {
    const savedTheme = localStorage.getItem('asher-theme') || 'dark';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.checked = savedTheme === 'dark';
    }
}

function toggleTheme() {
    const toggle = document.getElementById('theme-toggle');
    const isDark = toggle.checked;

    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('asher-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('asher-theme', 'light');
    }
}

// Event Listeners
function setupEventListeners() {
    // Message input
    const input = document.getElementById('message-input');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    // New conversation modal - enter key
    document.getElementById('convo-title').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            createConversation();
        }
    });

    // Document upload
    document.getElementById('doc-upload').addEventListener('change', handleDocumentUpload);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        const isTyping = document.activeElement.tagName === 'INPUT' ||
                         document.activeElement.tagName === 'TEXTAREA';

        if (e.key === 'Escape') {
            const settingsModal = document.getElementById('settings-modal');
            const docsModal = document.getElementById('docs-modal');
            const newConvoModal = document.getElementById('new-convo-modal');

            if (settingsModal.style.display === 'flex') {
                closeSettingsModal();
            } else if (docsModal.style.display === 'flex') {
                closeDocsModal();
            } else if (newConvoModal.style.display === 'flex') {
                closeNewConvoModal();
            } else {
                toggleSidebar();
            }
        }

        if (!isTyping && ['1', '2', '3', '4'].includes(e.key)) {
            e.preventDefault();
            const toggle = document.getElementById(`toggle-${e.key}`);
            if (toggle) toggle.click();
        }

        if (e.key === '?' && e.shiftKey && !isTyping) {
            e.preventDefault();
            showKeyboardShortcuts();
        }
    });
}

// Show keyboard shortcuts modal
function showKeyboardShortcuts() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'shortcuts-modal';
    modal.innerHTML = `
        <div class="modal" style="max-width: 400px;">
            <div class="modal-header">
                <h3>Keyboard Shortcuts</h3>
                <button class="modal-close" onclick="document.getElementById('shortcuts-modal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="text-align: left;">
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <kbd style="background: var(--bg-tertiary); padding: 0.25rem 0.5rem; border-radius: 4px;">1</kbd>
                        <span>Toggle ChatGPT</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <kbd style="background: var(--bg-tertiary); padding: 0.25rem 0.5rem; border-radius: 4px;">2</kbd>
                        <span>Toggle Claude</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <kbd style="background: var(--bg-tertiary); padding: 0.25rem 0.5rem; border-radius: 4px;">3</kbd>
                        <span>Toggle Gemini</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <kbd style="background: var(--bg-tertiary); padding: 0.25rem 0.5rem; border-radius: 4px;">4</kbd>
                        <span>Toggle Grok</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <kbd style="background: var(--bg-tertiary); padding: 0.25rem 0.5rem; border-radius: 4px;">Esc</kbd>
                        <span>Toggle sidebar / Close modal</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <kbd style="background: var(--bg-tertiary); padding: 0.25rem 0.5rem; border-radius: 4px;">?</kbd>
                        <span>Show this help</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    document.body.appendChild(modal);
}

// Conversations
async function loadConversations() {
    try {
        const response = await fetch(`${API_BASE}/api/conversations`);
        const data = await response.json();
        conversations = data.conversations || [];
        renderConversationList();
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

function renderConversationList() {
    const list = document.getElementById('conversation-list');

    if (conversations.length === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem; text-align: center; padding: 1rem;">No conversations yet</p>';
        return;
    }

    list.innerHTML = conversations.map(convo => `
        <div class="conversation-item ${currentConversation?.id === convo.id ? 'active' : ''}"
             onclick="selectConversation(${convo.id})">
            <span class="title">${escapeHtml(convo.title)}</span>
            <button class="delete-btn" onclick="event.stopPropagation(); deleteConversation(${convo.id})">&times;</button>
        </div>
    `).join('');
}

async function selectConversation(id, skipProviderReload = false) {
    try {
        const response = await fetch(`${API_BASE}/api/conversations/${id}`);
        if (!response.ok) throw new Error('Failed to load conversation');

        currentConversation = await response.json();

        document.getElementById('system-prompt').value = currentConversation.system_prompt || '';
        referenceDocuments = currentConversation.documents || [];
        renderDocumentList();

        if (!skipProviderReload) {
            loadProviderSettings(currentConversation.provider_settings);
        }

        renderConversationList();
        showConversation();
    } catch (error) {
        console.error('Error selecting conversation:', error);
    }
}

function showConversation() {
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('input-bar').style.display = 'block';
    renderMessages();
}

function renderMessages() {
    const messages = currentConversation?.messages || [];

    if (currentTab === 'all') {
        document.getElementById('single-view').style.display = 'none';
        document.getElementById('grid-view').style.display = 'grid';

        ['1', '2', '3', '4'].forEach(num => {
            document.getElementById(`messages-${num}`).innerHTML = '';
        });

        const userMessageProviders = {};
        let userMsgIndex = -1;
        messages.forEach(msg => {
            if (msg.role === 'user') {
                userMsgIndex++;
                userMessageProviders[userMsgIndex] = new Set();
            } else if (msg.role === 'assistant' && userMsgIndex >= 0) {
                const panelNum = getProviderPanel(msg.model);
                if (panelNum) {
                    userMessageProviders[userMsgIndex].add(panelNum);
                }
            }
        });

        userMsgIndex = -1;
        messages.forEach(msg => {
            const panelNum = getProviderPanel(msg.model);
            if (msg.role === 'user') {
                userMsgIndex++;
                const respondedPanels = userMessageProviders[userMsgIndex] || new Set();
                respondedPanels.forEach(num => {
                    if (enabledProviders.has(num)) {
                        addMessageToPanel(num, 'user', msg.content);
                    }
                });
            } else if (panelNum && enabledProviders.has(panelNum)) {
                addMessageToPanel(panelNum, msg.role, msg.content);
            }
        });
    } else {
        if (!enabledProviders.has(currentTab)) {
            currentTab = 'all';
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector('.tab-btn[data-tab="all"]')?.classList.add('active');
            renderMessages();
            return;
        }

        document.getElementById('grid-view').style.display = 'none';
        document.getElementById('single-view').style.display = 'flex';

        const container = document.getElementById('single-messages');
        container.innerHTML = '';

        messages.forEach(msg => {
            if (msg.role === 'user' || matchesProvider(msg.model, currentTab)) {
                const div = document.createElement('div');
                div.className = `message-bubble ${msg.role}`;
                div.textContent = msg.content;
                container.appendChild(div);
            }
        });

        container.scrollTop = container.scrollHeight;
    }
}

function getProviderPanel(model) {
    if (!model) return null;
    if (model.includes('openai') || model.includes('gpt')) return '1';
    if (model.includes('claude')) return '2';
    if (model.includes('gemini')) return '3';
    if (model.includes('grok')) return '4';
    return null;
}

function matchesProvider(model, tab) {
    return getProviderPanel(model) === tab;
}

function addMessageToPanel(panelNum, role, content) {
    const container = document.getElementById(`messages-${panelNum}`);
    const div = document.createElement('div');
    div.className = `message-bubble ${role}`;
    div.textContent = content;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// Build context from system prompt and reference documents
function buildContext() {
    const systemPrompt = document.getElementById('system-prompt').value.trim();
    let context = systemPrompt;

    if (referenceDocuments.length > 0) {
        context += '\n\n=== REFERENCE DOCUMENTS ===\n\n';
        referenceDocuments.forEach(doc => {
            if (doc.content && doc.content.trim()) {
                context += `--- ${doc.filename} ---\n${doc.content}\n\n`;
            }
        });
    }

    return context;
}

// Send Message
async function sendMessage() {
    if (!currentConversation) {
        alert('Please select or create a conversation first');
        return;
    }

    const input = document.getElementById('message-input');
    const message = input.value.trim();
    if (!message) return;

    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;
    input.value = '';
    input.style.height = 'auto';

    const systemContext = buildContext();
    const activeProviderNums = Array.from(enabledProviders);

    if (activeProviderNums.length === 0) {
        alert('No providers enabled. Click a provider logo to enable it.');
        sendBtn.disabled = false;
        return;
    }

    activeProviderNums.forEach(num => {
        addMessageToPanel(num, 'user', message);
        addLoadingToPanel(num);
    });

    if (currentTab !== 'all') {
        const container = document.getElementById('single-messages');
        const userDiv = document.createElement('div');
        userDiv.className = 'message-bubble user';
        userDiv.textContent = message;
        container.appendChild(userDiv);

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message-bubble loading';
        loadingDiv.id = 'loading-single';
        loadingDiv.textContent = 'Thinking...';
        container.appendChild(loadingDiv);
        container.scrollTop = container.scrollHeight;
    }

    const promises = activeProviderNums.map((num, index) => {
        const providerInfo = PROVIDER_INFO[num];
        const model = providerModels[num];
        return sendToProvider(providerInfo.id, message, systemContext, num, index > 0, model);
    });
    await Promise.all(promises);

    sendBtn.disabled = false;
    await selectConversation(currentConversation.id, true);
}

async function sendToProvider(providerId, message, systemPrompt, panelNum, skipUserMessage = false, model = null) {
    try {
        const response = await fetch(`${API_BASE}/api/conversations/${currentConversation.id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                provider: providerId,
                system_prompt: systemPrompt,
                skip_user_message: skipUserMessage,
                model: model
            })
        });

        removeLoadingFromPanel(panelNum);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to send message');
        }

        if (currentTab === 'all') {
            addMessageToPanel(panelNum, 'assistant', data.assistant_message.content);
        } else {
            const container = document.getElementById('single-messages');
            const div = document.createElement('div');
            div.className = 'message-bubble assistant';
            div.textContent = data.assistant_message.content;
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }
    } catch (error) {
        removeLoadingFromPanel(panelNum);

        if (error.message.includes('API key not configured')) {
            showApiKeyAlert(error.message);
        } else if (currentTab === 'all') {
            addMessageToPanel(panelNum, 'error', `Error: ${error.message}`);
        } else {
            const container = document.getElementById('single-messages');
            const div = document.createElement('div');
            div.className = 'message-bubble error';
            div.textContent = `Error: ${error.message}`;
            container.appendChild(div);
        }
    }
}

let missingApiKeyProviders = new Set();
let apiKeyAlertTimeout = null;

function showApiKeyAlert(message) {
    let providerName = null;
    if (message.includes('OpenAI')) providerName = 'ChatGPT';
    else if (message.includes('Anthropic')) providerName = 'Claude';
    else if (message.includes('Google')) providerName = 'Gemini';
    else if (message.includes('xAI')) providerName = 'Grok';

    if (providerName) {
        missingApiKeyProviders.add(providerName);
    }

    if (apiKeyAlertTimeout) {
        clearTimeout(apiKeyAlertTimeout);
    }

    apiKeyAlertTimeout = setTimeout(() => {
        const providers = Array.from(missingApiKeyProviders);
        let displayText;

        if (providers.length === 1) {
            displayText = providers[0];
        } else if (providers.length === 2) {
            displayText = providers.join(' & ');
        } else if (providers.length > 2) {
            const last = providers.pop();
            displayText = providers.join(', ') + ', & ' + last;
        } else {
            displayText = 'the selected providers';
        }

        document.getElementById('api-key-alert-provider').textContent = displayText;
        document.getElementById('api-key-alert').style.display = 'flex';

        missingApiKeyProviders.clear();
    }, 300);
}

function closeApiKeyAlert() {
    document.getElementById('api-key-alert').style.display = 'none';
}

function addLoadingToPanel(panelNum) {
    const container = document.getElementById(`messages-${panelNum}`);
    const div = document.createElement('div');
    div.className = 'message-bubble loading';
    div.id = `loading-${panelNum}`;
    div.textContent = 'Thinking...';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function removeLoadingFromPanel(panelNum) {
    const loading = document.getElementById(`loading-${panelNum}`) || document.getElementById('loading-single');
    if (loading) loading.remove();
}

// Conversation CRUD
function openNewConvoModal() {
    document.getElementById('new-convo-modal').style.display = 'flex';
    document.getElementById('convo-title').value = '';
    document.getElementById('convo-title').focus();
}

function closeNewConvoModal() {
    document.getElementById('new-convo-modal').style.display = 'none';
}

async function createConversation() {
    const title = document.getElementById('convo-title').value.trim();
    if (!title) {
        alert('Please enter a conversation name');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });

        if (!response.ok) throw new Error('Failed to create conversation');

        const newConvo = await response.json();
        closeNewConvoModal();
        await loadConversations();
        selectConversation(newConvo.id);
    } catch (error) {
        console.error('Error creating conversation:', error);
        alert('Failed to create conversation');
    }
}

async function deleteConversation(id) {
    if (!confirm('Delete this conversation?')) return;

    try {
        await fetch(`${API_BASE}/api/conversations/${id}`, {
            method: 'DELETE'
        });

        if (currentConversation?.id === id) {
            currentConversation = null;
            document.getElementById('empty-state').style.display = 'block';
            document.getElementById('single-view').style.display = 'none';
            document.getElementById('grid-view').style.display = 'none';
            document.getElementById('input-bar').style.display = 'none';
        }

        await loadConversations();
    } catch (error) {
        console.error('Error deleting conversation:', error);
    }
}

// Tab Switching
function switchTab(tab) {
    if (tab !== 'all' && !enabledProviders.has(tab)) {
        return;
    }

    currentTab = tab;

    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });

    if (currentConversation) {
        renderMessages();
    }
}

// Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    sidebar.classList.toggle('collapsed');

    if (sidebar.classList.contains('collapsed')) {
        toggle.classList.add('visible');
    } else {
        toggle.classList.remove('visible');
    }
}

function goHome() {
    currentConversation = null;
    renderConversationList();
    document.getElementById('empty-state').style.display = 'block';
    document.getElementById('single-view').style.display = 'none';
    document.getElementById('grid-view').style.display = 'none';
    document.getElementById('input-bar').style.display = 'none';
}

// Modals
function openDocsModal() {
    document.getElementById('docs-modal').style.display = 'flex';
    renderDocumentList();
}

async function closeDocsModal() {
    document.getElementById('docs-modal').style.display = 'none';

    if (currentConversation) {
        const systemPrompt = document.getElementById('system-prompt').value;

        try {
            await fetch(`${API_BASE}/api/conversations/${currentConversation.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_prompt: systemPrompt,
                    documents: referenceDocuments
                })
            });

            currentConversation.system_prompt = systemPrompt;
            currentConversation.documents = referenceDocuments;
        } catch (error) {
            console.error('Error saving prompt/docs:', error);
        }
    }
}

function renderDocumentList() {
    const list = document.getElementById('doc-list');
    if (!list) return;

    if (referenceDocuments.length === 0) {
        list.innerHTML = '';
        return;
    }

    list.innerHTML = referenceDocuments.map((doc, index) => `
        <div class="doc-item">
            <span class="doc-name">${escapeHtml(doc.filename)}</span>
            <button class="doc-remove" onclick="removeDocument(${index})">&times;</button>
        </div>
    `).join('');
}

function removeDocument(index) {
    referenceDocuments.splice(index, 1);
    renderDocumentList();
}

async function handleDocumentUpload(e) {
    const files = e.target.files;
    if (!files.length) return;

    for (const file of files) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE}/upload/document`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                alert(`Error uploading ${file.name}: ${error.detail}`);
                continue;
            }

            const result = await response.json();

            referenceDocuments.push({
                id: result.id,
                filename: result.filename,
                content: result.content,
                file_type: result.file_type
            });

            renderDocumentList();
        } catch (error) {
            console.error('Error uploading document:', error);
            alert(`Error uploading ${file.name}`);
        }
    }

    e.target.value = '';
}

function openSettingsModal() {
    document.getElementById('settings-modal').style.display = 'flex';
    const savedTheme = localStorage.getItem('asher-theme') || 'dark';
    document.getElementById('theme-toggle').checked = savedTheme === 'dark';
}

function closeSettingsModal() {
    document.getElementById('settings-modal').style.display = 'none';
}

// Utilities
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
