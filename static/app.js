/* ==========================================================================
   MemoDrop Frontend Application Controller - Chat Shell Redesign
   ========================================================================== */

// Global memory cache to support edit modal lookup from any card
let memoryCache = {};
let currentUserPhone = localStorage.getItem('currentUserPhone') || null;

const MOCK_SCREENSHOTS = {
    wedding_saree: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%231e1b4b'/><circle cx='200' cy='120' r='60' fill='%23f43f5e'/><path d='M100 240 Q 200 180 300 240' stroke='%23fb7185' stroke-width='8' fill='none'/><text x='50%' y='230' font-family='sans-serif' font-size='18' font-weight='bold' fill='%23ffffff' text-anchor='middle'>Designer Silk Saree</text><text x='50%' y='260' font-family='sans-serif' font-size='14' fill='%2394a3b8' text-anchor='middle'>Rs. 2400 | Wedding Collection</text></svg>",
    home_address: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%230f172a'/><rect x='40' y='40' width='320' height='220' rx='15' fill='%231e293b' stroke='%2338bdf8' stroke-width='2'/><circle cx='200' cy='110' r='35' fill='%2338bdf8' opacity='0.15'/><path d='M200 85 L215 110 A15 15 0 0 1 185 110 Z' fill='%2338bdf8'/><circle cx='200' cy='110' r='6' fill='%230f172a'/><text x='50%' y='180' font-family='sans-serif' font-size='16' font-weight='bold' fill='%23ffffff' text-anchor='middle'>Hosur Warehouse Hub</text><text x='50%' y='210' font-family='sans-serif' font-size='12' fill='%2394a3b8' text-anchor='middle'>42 Garden Avenue, Block C, Hosur</text></svg>",
    business_card: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23022c22'/><rect x='40' y='50' width='320' height='200' rx='12' fill='%23064e3b' stroke='%2334d399' stroke-width='1.5'/><text x='65' y='105' font-family='sans-serif' font-size='22' font-weight='900' fill='%2334d399'>RAMESH MILLS</text><text x='65' y='130' font-family='sans-serif' font-size='12' fill='%23a7f3d0' letter-spacing='1'>TEXTILE MANUFACTURER</text><text x='65' y='180' font-family='sans-serif' font-size='14' font-weight='bold' fill='%23ffffff'>Ramesh Kumar</text><text x='65' y='200' font-family='sans-serif' font-size='12' fill='%2394a3b8'>Phone: +91 98765 43210</text><text x='65' y='218' font-family='sans-serif' font-size='12' fill='%2394a3b8'>Email: sales@rameshfabrics.com</text></svg>",
    receipt: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%231c1917'/><rect x='60' y='30' width='280' height='240' fill='%23292524' stroke='%23f59e0b' stroke-width='1'/><path d='M60 30 L80 40 L100 30 L120 40 L140 30 L160 40 L180 30 L200 40 L220 30 L240 40 L260 30 L280 40 L300 30 L320 40 L340 30' fill='none' stroke='%23f59e0b' stroke-width='2'/><text x='80' y='80' font-family='monospace' font-size='16' font-weight='bold' fill='%23ffffff'>INVOICE No. 8921</text><text x='80' y='110' font-family='monospace' font-size='12' fill='%23a8a29e'>Ramesh Saree Mills</text><text x='80' y='150' font-family='monospace' font-size='12' fill='%23d6d3d1'>Satin Saree Silk x15   Rs. 3000</text><text x='80' y='170' font-family='monospace' font-size='12' fill='%23d6d3d1'>Cotton Roll Type A x10  Rs. 1500</text><line x1='80' y1='195' x2='320' y2='195' stroke='%2344403c' stroke-dasharray='5,5'/><text x='80' y='225' font-family='monospace' font-size='14' font-weight='bold' fill='%23f59e0b'>TOTAL DUE: Rs. 4500</text></svg>",
    saree_tag: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23172554'/><rect x='50' y='60' width='300' height='180' rx='10' fill='%231e3a8a' stroke='%2360a5fa' stroke-width='1.5'/><text x='75' y='110' font-family='sans-serif' font-size='18' font-weight='bold' fill='%23ffffff'>Satin Saree Blue M05</text><text x='75' y='135' font-family='sans-serif' font-size='12' fill='%2393c5fd'>Premium Silk Weave</text><line x1='75' y1='155' x2='325' y2='155' stroke='%233b82f6'/><rect x='75' y='170' width='10' height='40' fill='%23fff'/><rect x='90' y='170' width='4' height='40' fill='%23fff'/><rect x='98' y='170' width='12' height='40' fill='%23fff'/><rect x='114' y='170' width='6' height='40' fill='%23fff'/><rect x='124' y='170' width='2' height='40' fill='%23fff'/><rect x='130' y='170' width='14' height='40' fill='%23fff'/><rect x='148' y='170' width='4' height='40' fill='%23fff'/><text x='170' y='195' font-family='monospace' font-size='16' font-weight='bold' fill='%2360a5fa'>BARCODE M05</text></svg>"
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation Elements ---
    const navChatBtn = document.getElementById('nav-chat-btn');
    const navVaultBtn = document.getElementById('nav-vault-btn');
    const navFoldersBtn = document.getElementById('nav-folders-btn');
    const viewChat = document.getElementById('view-chat');
    const viewVault = document.getElementById('view-vault');
    const viewFolders = document.getElementById('view-folders');

    // --- Chat Interface Elements ---
    const chatInput = document.querySelector('#view-chat #chat-input');
    const chatSendBtn = document.querySelector('#view-chat #chat-send-btn');
    const chatMessagesThread = document.getElementById('chat-messages-thread');
    const scenarioButtons = document.querySelectorAll('.pill-btn');
    
    // Explainer Toggle Elements
    const explainerToggleBtn = document.getElementById('explainer-toggle-btn');
    const explainerContentBox = document.getElementById('explainer-content-box');
    
    // --- Vault Interface Elements ---
    const vaultSearchInput = document.querySelector('#view-vault #vault-search-input');
    const vaultSearchBtn = document.querySelector('#view-vault #vault-search-btn');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const memoriesContainer = document.getElementById('memories-container');
    const memoryCountEl = document.getElementById('memory-count');

    // Mode Toggle
    const modeToggle = document.getElementById('mode-toggle-checkbox');

    // --- Quick Actions & Mode Toggle Elements ---
    const composerPlusBtn = document.getElementById('composer-plus-btn');
    const composerVoiceBtn = document.getElementById('composer-voice-btn');
    const composerModeToggle = document.getElementById('composer-mode-toggle');
    const composerModeIcon = document.getElementById('composer-mode-icon');
    const composerModeLabel = document.getElementById('composer-mode-label');
    const composerPopover = document.getElementById('composer-actions-popover');
    const actionModal = document.getElementById('action-form-modal');
    const actionModalIcon = document.getElementById('action-modal-icon');
    const actionModalTitle = document.getElementById('action-modal-title');
    const actionModalFormContent = document.getElementById('action-modal-form-content');
    const actionModalCancel = document.getElementById('action-modal-cancel');
    const actionModalSubmit = document.getElementById('action-modal-submit');

    // Edit Modal Elements
    const editModal = document.getElementById('edit-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editForm = document.getElementById('edit-memory-form');

    // --- State Variables ---
    let currentCategoryFilter = 'All';
    let allMemories = [];
    let currentComposerMode = 'save'; // can be 'save' or 'ask'
    let isManualModeOverride = false;
    
    // Core Chat State Array: stores all messages in current thread session
    let chatMessages = [];

    // --- Attachment Helper Functions ---
    function parseAttachment(content) {
        if (!content || typeof content !== 'string') return null;
        if (content.startsWith('[Image Attachment]')) {
            const parts = content.split(' | data: ');
            if (parts.length < 2) return null;
            const captionPart = parts[0].replace('[Image Attachment]', '').trim();
            const caption = captionPart.replace('caption:', '').trim();
            const data = parts[1].trim();
            return { type: 'image', caption, data };
        }
        if (content.startsWith('[Location Attachment]')) {
            const parts = content.replace('[Location Attachment]', '').split(' | ');
            const attachment = { type: 'location' };
            parts.forEach(p => {
                const sub = p.split(': ');
                if (sub.length >= 2) {
                    const key = sub[0].trim();
                    const val = sub.slice(1).join(': ').trim();
                    attachment[key] = val;
                }
            });
            attachment.lat = parseFloat(attachment.lat) || 0.0;
            attachment.lon = parseFloat(attachment.lon) || 0.0;
            return attachment;
        }
        if (content.startsWith('[Contact Attachment]')) {
            const parts = content.replace('[Contact Attachment]', '').split(' | ');
            const attachment = { type: 'contact' };
            parts.forEach(p => {
                const sub = p.split(': ');
                if (sub.length >= 2) {
                    const key = sub[0].trim();
                    const val = sub.slice(1).join(': ').trim();
                    attachment[key] = val;
                }
            });
            return attachment;
        }
        if (content.startsWith('[Document Attachment]')) {
            const parts = content.replace('[Document Attachment]', '').split(' | ');
            const attachment = { type: 'document' };
            parts.forEach(p => {
                const sub = p.split(': ');
                if (sub.length >= 2) {
                    const key = sub[0].trim();
                    const val = sub.slice(1).join(': ').trim();
                    attachment[key] = val;
                }
            });
            return attachment;
        }

        // Fallbacks for quick action presets and text-based mock uploads
        if (content.includes("Supplier Receipt No. 8921")) {
            return { type: 'image', caption: "Supplier Receipt No. 8921 (Rs 4500)", data: MOCK_SCREENSHOTS.receipt };
        }
        if (content.includes("Satin Saree Blue M05")) {
            return { type: 'image', caption: "Satin Saree Blue M05 (Product Tag)", data: MOCK_SCREENSHOTS.saree_tag };
        }
        if (content.includes("Designer Silk Saree offer")) {
            return { type: 'image', caption: "Designer Silk Saree", data: MOCK_SCREENSHOTS.wedding_saree };
        }
        if (content.includes("Hosur warehouse delivery address")) {
            return { type: 'location', name: "Hosur Warehouse Hub", address: "42 Garden Avenue, Block C, Hosur", lat: 12.7408, lon: 77.8253 };
        }
        if (content.includes("Contact Card - Fabric Supplier Ramesh")) {
            return { type: 'contact', name: "Ramesh Fabrics", phone: "+91 98765 43210", email: "sales@rameshfabrics.com" };
        }
        if (content.includes("Supplier Quote Invoice - Ramesh Mills")) {
            return { type: 'document', filename: "invoice_ramesh_mills.pdf", size: "45 KB", caption: "Supplier Quote Invoice - Ramesh Mills", data: "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbNCAwIFJdCi9Db3VudCAxCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMyAwIFIKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KL0NvbnRlbnRzIDYgMCBSCj4+CmVuZG9iag==" };
        }
        if (content.includes("Inventory Sheet - Satin Saree Stock")) {
            return { type: 'document', filename: "saree_inventory_count.xlsx", size: "12 KB", caption: "Satin Saree Stock Inventory Sheet", data: "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQAAAAIA" };
        }

        return null;
    }

    function renderAttachment(attachment) {
        if (!attachment) return '';
        if (attachment.type === 'image') {
            return `
                <div class="attachment-media-bubble" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.35rem; width: 100%; max-width: 280px; margin-top: 0.2rem;">
                    <img src="${attachment.data}" style="width: 100%; border-radius: 12px; max-height: 200px; object-fit: contain; background-color: #0b0c10; border: 1px solid rgba(255,255,255,0.08); cursor: pointer;" onclick="window.openImageFullScreen('${attachment.data}')">
                    ${attachment.caption ? `<p style="font-size: 0.85rem; color: var(--text-primary); margin: 0; line-height: 1.45; padding: 0.15rem 0.25rem;">${attachment.caption}</p>` : ''}
                </div>
            `;
        }
        if (attachment.type === 'location') {
            return `
                <div class="attachment-location-bubble" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.35rem; width: 280px; max-width: 100%; margin-top: 0.2rem;">
                    <div style="width: 100%; height: 150px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: #000;">
                        <iframe src="https://www.openstreetmap.org/export/embed.html?bbox=${attachment.lon - 0.003}%2C${attachment.lat - 0.002}%2C${attachment.lon + 0.003}%2C${attachment.lat + 0.002}&layer=mapnik&marker=${attachment.lat}%2C${attachment.lon}" style="width: 100%; height: 100%; border: none;"></iframe>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.15rem; padding: 0.15rem 0.25rem;">
                        <span style="font-size: 0.85rem; font-weight: 700; color: #ffffff;">${attachment.name || 'Shared Location'}</span>
                        <span style="font-size: 0.72rem; color: #8B8F9C; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${attachment.address || `GPS: ${attachment.lat.toFixed(4)}, ${attachment.lon.toFixed(4)}`}</span>
                    </div>
                </div>
            `;
        }
        if (attachment.type === 'contact') {
            const initials = attachment.name ? attachment.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'C';
            return `
                <div class="attachment-contact-bubble" style="display: flex; flex-direction: column; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; width: 250px; max-width: 100%; overflow: hidden; margin-bottom: 0.35rem; margin-top: 0.2rem;">
                    <div style="display: flex; gap: 0.75rem; padding: 0.75rem 0.85rem; align-items: center;">
                        <div style="width: 34px; height: 34px; border-radius: 50%; background: #34d399; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.9rem; font-weight: 700; flex-shrink: 0;">
                            ${initials}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.1rem; flex: 1; overflow: hidden;">
                            <span style="font-size: 0.85rem; font-weight: 700; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${attachment.name}</span>
                            <span style="font-size: 0.72rem; color: #8B8F9C; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${attachment.phone}</span>
                        </div>
                    </div>
                    <div style="border-top: 1px solid rgba(255,255,255,0.08); padding: 0.45rem; text-align: center; background: rgba(255,255,255,0.02);">
                        <a href="tel:${attachment.phone}" style="font-size: 0.78rem; font-weight: 700; color: #34d399; text-decoration: none; display: block; width: 100%;">Call Contact</a>
                    </div>
                </div>
            `;
        }
        if (attachment.type === 'document') {
            const isPdf = attachment.filename && attachment.filename.toLowerCase().endsWith('.pdf');
            const fileBg = isPdf ? '#f87171' : '#60a5fa';
            const fileIcon = isPdf ? 'fa-file-pdf' : 'fa-file-invoice';
            return `
                <div class="attachment-document-bubble" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.35rem; width: 260px; max-width: 100%; margin-top: 0.2rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); width: 100%;">
                        <div style="width: 36px; height: 36px; border-radius: 6px; background: ${fileBg}; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 1.15rem; flex-shrink: 0;">
                            <i class="fa-solid ${fileIcon}"></i>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.1rem; overflow: hidden; flex: 1;">
                            <span style="font-size: 0.82rem; font-weight: 700; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${attachment.filename}">${attachment.filename}</span>
                            <span style="font-size: 0.68rem; color: #8B8F9C;">${attachment.size || 'Document'}</span>
                        </div>
                        <div style="flex-shrink: 0; color: #8B8F9C; cursor: pointer; padding: 0.25rem;" onclick="window.openTextDocumentViewer('${attachment.filename}', '${attachment.data}')" title="View Document">
                            <i class="fa-solid fa-arrow-down-to-bracket" style="font-size: 0.85rem; color: #60a5fa;"></i>
                        </div>
                    </div>
                    ${attachment.caption ? `<p style="font-size: 0.82rem; color: var(--text-primary); margin: 0; line-height: 1.45; padding: 0.15rem 0.25rem;">${attachment.caption}</p>` : ''}
                </div>
            `;
        }
        return '';
    }

    // Expose fullscreen image helper
    window.openImageFullScreen = function(src) {
        const viewer = document.createElement('div');
        viewer.style = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.95); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: zoom-out;";
        viewer.innerHTML = `<img src="${src}" style="max-width: 95%; max-height: 95%; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">`;
        viewer.onclick = () => viewer.remove();
        document.body.appendChild(viewer);
    };

    // Expose document viewer helper
    window.openTextDocumentViewer = function(filename, data) {
        let displayContent = data;
        if (data.startsWith('data:')) {
            displayContent = `[Base64 Attachment Data file: ${filename}]\n\nClick the link to download or open locally in your browser.`;
        }
        
        const viewer = document.createElement('div');
        viewer.style = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 2rem;";
        viewer.innerHTML = `
            <div style="background: #111318; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; width: 100%; max-width: 500px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-family: 'League Spartan', sans-serif; font-weight: 800; font-size: 1.05rem; color: #ffffff; text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">${filename}</span>
                    <button style="background: transparent; border: none; color: #8B8F9C; cursor: pointer; font-size: 1.1rem;" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1rem; font-family: monospace; font-size: 0.82rem; color: #8B8F9C; min-height: 120px; max-height: 250px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;">
                    ${displayContent}
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
                    <a href="${data}" download="${filename}" style="padding: 0.5rem 1.1rem; font-family: 'League Spartan', sans-serif; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; border-radius: 8px; cursor: pointer; background: #FF6B4A; border: none; color: #ffffff; text-decoration: none; display: inline-block; text-align: center;">Download File</a>
                </div>
            </div>
        `;
        viewer.className = "modal-overlay";
        viewer.onclick = (e) => {
            if (e.target === viewer) viewer.remove();
        };
        document.body.appendChild(viewer);
    };

    // --- Custom Confirmation & Alert Modals ---
    const confirmModal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-modal-title');
    const confirmMessage = document.getElementById('confirm-modal-message');
    const confirmCancelBtn = document.getElementById('confirm-modal-cancel');
    const confirmSubmitBtn = document.getElementById('confirm-modal-submit');
    const confirmIcon = document.getElementById('confirm-modal-icon');
    
    let currentConfirmCallback = null;
    
    function showCustomConfirm(options) {
        confirmTitle.innerText = options.title || 'Are you sure?';
        confirmMessage.innerHTML = options.message || '';
        confirmSubmitBtn.innerText = options.confirmText || 'Confirm';
        
        if (options.isDanger) {
            confirmSubmitBtn.style.backgroundColor = '#ef4444';
            confirmIcon.style.color = '#ef4444';
            confirmIcon.className = 'fa-solid fa-triangle-exclamation';
        } else {
            confirmSubmitBtn.style.backgroundColor = 'var(--accent-color)';
            confirmIcon.style.color = 'var(--accent-color)';
            confirmIcon.className = 'fa-solid fa-circle-question';
        }
        
        confirmCancelBtn.style.display = 'inline-block';
        currentConfirmCallback = options.onConfirm || null;
        confirmModal.style.display = 'flex';
    }
    
    function showCustomAlert(title, message) {
        confirmTitle.innerText = title || 'Notification';
        confirmMessage.innerHTML = message || '';
        confirmSubmitBtn.innerText = 'OK';
        confirmSubmitBtn.style.backgroundColor = 'var(--accent-color)';
        confirmIcon.style.color = 'var(--accent-color)';
        confirmIcon.className = 'fa-solid fa-circle-info';
        
        confirmCancelBtn.style.display = 'none';
        currentConfirmCallback = null;
        confirmModal.style.display = 'flex';
    }
    
    function closeConfirmModal() {
        confirmModal.style.display = 'none';
        currentConfirmCallback = null;
        const recordingDot = document.getElementById('voice-recording-dot');
        if (recordingDot) recordingDot.style.display = 'none';
    }
    
    confirmCancelBtn.addEventListener('click', closeConfirmModal);
    confirmSubmitBtn.addEventListener('click', () => {
        if (currentConfirmCallback) {
            currentConfirmCallback();
        }
        closeConfirmModal();
    });
    
    window.showCustomConfirm = showCustomConfirm;
    window.showCustomAlert = showCustomAlert;

    // --- Navigation Listeners ---
    navChatBtn.addEventListener('click', () => {
        switchView('chat');
    });

    navVaultBtn.addEventListener('click', () => {
        switchView('vault');
    });

    if (navFoldersBtn) {
        navFoldersBtn.addEventListener('click', () => {
            switchView('folders');
        });
    }

    // Logo click redirects to Chat view (Home Page)
    const topbarLogo = document.querySelector('.topbar-left');
    const sidebarLogo = document.querySelector('.sidebar-logo');
    if (topbarLogo) {
        topbarLogo.style.cursor = 'pointer';
        topbarLogo.addEventListener('click', () => {
            switchView('chat');
        });
    }
    if (sidebarLogo) {
        sidebarLogo.style.cursor = 'pointer';
        sidebarLogo.addEventListener('click', () => {
            switchView('chat');
        });
    }

    function switchView(viewName) {
        if (viewName === 'chat') {
            navChatBtn.classList.add('active');
            navVaultBtn.classList.remove('active');
            if (navFoldersBtn) navFoldersBtn.classList.remove('active');
            viewChat.classList.add('active');
            viewVault.classList.remove('active');
            if (viewFolders) viewFolders.classList.remove('active');
            renderChat(); // Re-render chat layout on load
        } else if (viewName === 'vault') {
            navVaultBtn.classList.add('active');
            navChatBtn.classList.remove('active');
            if (navFoldersBtn) navFoldersBtn.classList.remove('active');
            viewVault.classList.add('active');
            viewChat.classList.remove('active');
            if (viewFolders) viewFolders.classList.remove('active');
            loadMemories(); // Refresh when opening vault
        } else if (viewName === 'folders') {
            if (navFoldersBtn) navFoldersBtn.classList.add('active');
            navChatBtn.classList.remove('active');
            navVaultBtn.classList.remove('active');
            if (viewFolders) viewFolders.classList.add('active');
            viewChat.classList.remove('active');
            viewVault.classList.remove('active');
            loadFoldersView(); // Refresh and load folders view contents
        }
    }


    const backToFoldersBtn = document.getElementById('back-to-folders-btn');
    if (backToFoldersBtn) {
        backToFoldersBtn.addEventListener('click', () => {
            document.getElementById('folders-index-level').style.display = 'block';
            document.getElementById('folder-contents-level').style.display = 'none';
        });
    }

    // --- Chat Composer Listeners ---
    chatSendBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });

    // Quick Action scenario buttons
    scenarioButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.getAttribute('data-text');
            chatInput.value = text;
            chatInput.dispatchEvent(new Event('input'));
            handleSendMessage();
        });
    });

    // --- Composer Mode State Controller ---
    function setComposerMode(mode) {
        currentComposerMode = mode;
        if (mode === 'ask') {
            composerModeIcon.className = 'fa-solid fa-magnifying-glass';
            composerModeLabel.innerText = 'Ask Mode';
            composerModeToggle.style.borderColor = 'rgba(255, 107, 74, 0.25)';
            composerModeToggle.style.backgroundColor = 'rgba(255, 107, 74, 0.05)';
            chatInput.placeholder = 'Search memories or ask a question...';
        } else {
            composerModeIcon.className = 'fa-solid fa-inbox';
            composerModeLabel.innerText = 'Save Mode';
            composerModeToggle.style.borderColor = 'rgba(255, 255, 255, 0.06)';
            composerModeToggle.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
            chatInput.placeholder = 'Ask me anything or drop something to save...';
        }
    }
    window.setComposerMode = setComposerMode;

    // Toggle composer mode manually on click
    composerModeToggle.addEventListener('click', () => {
        isManualModeOverride = true;
        if (currentComposerMode === 'ask') {
            setComposerMode('save');
        } else {
            setComposerMode('ask');
        }
    });

    // Detect question/search syntax dynamically to toggle indicators
    chatInput.addEventListener('input', () => {
        if (isManualModeOverride) return;
        const val = chatInput.value.trim().toLowerCase();
        const isQuery = val.endsWith('?') || /^(what|where|when|who|how|why|which|find|search|show|get|retrieve|recall|verify|check|lookup|list|is|are|can|do|does|did|will|would|should|has|have|had|any)\b/.test(val);
        if (isQuery) {
            setComposerMode('ask');
        } else {
            setComposerMode('save');
        }
    });

    // --- Plus Action Popover Toggle Listener ---
    composerPlusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = composerPopover.style.display === 'grid';
        if (isOpen) {
            composerPopover.style.display = 'none';
            composerPlusBtn.classList.remove('open');
        } else {
            composerPopover.style.display = 'grid';
            composerPlusBtn.classList.add('open');
        }
    });

    // Close popover when clicking anywhere outside
    document.addEventListener('click', (e) => {
        if (!composerPopover.contains(e.target) && e.target !== composerPlusBtn && !composerPlusBtn.contains(e.target)) {
            composerPopover.style.display = 'none';
            composerPlusBtn.classList.remove('open');
        }
    });

    // --- Simulated & Live Voice Note Action ---
    let mediaRecorder = null;
    let audioChunks = [];
    let recordTimerInterval = null;
    let recordSeconds = 0;

    composerVoiceBtn.addEventListener('click', () => {
        const recordingDot = document.getElementById('voice-recording-dot');
        
        // Show voice note modal dialog
        showCustomConfirm({
            title: 'Voice Note Recorder',
            message: `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <span id="voice-modal-rec-dot" style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #ef4444; animation: pulse 1s infinite;"></span>
                        <span id="voice-modal-timer" style="font-family: monospace; font-size: 1.15rem; font-weight: 700; color: #ffffff;">00:00</span>
                    </div>
                    <p id="voice-modal-status" style="font-size: 0.82rem; color: var(--text-secondary); text-align: center; margin: 0;">Recording audio from your microphone...</p>
                    
                    <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.85rem; width: 100%; display: flex; flex-direction: column; gap: 0.5rem; align-items: center;">
                        <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Quick Demo Presets:</span>
                        <div style="display: flex; gap: 0.5rem; justify-content: center; width: 100%; flex-wrap: wrap;">
                            <button id="preset-voice-tamil" type="button" style="background: rgba(139,92,246,0.06); border: 1px solid rgba(139,92,246,0.2); border-radius: 12px; padding: 0.4rem 0.65rem; font-size: 0.72rem; color: #c084fc; cursor: pointer; font-family: inherit; font-weight: 600; transition: background 0.2s;" onmouseover="this.style.background='rgba(139,92,246,0.12)'" onmouseout="this.style.background='rgba(139,92,246,0.06)'">தமிழ் (Tamil)</button>
                            <button id="preset-voice-hindi" type="button" style="background: rgba(253,224,71,0.06); border: 1px solid rgba(253,224,71,0.2); border-radius: 12px; padding: 0.4rem 0.65rem; font-size: 0.72rem; color: #fde047; cursor: pointer; font-family: inherit; font-weight: 600; transition: background 0.2s;" onmouseover="this.style.background='rgba(253,224,71,0.12)'" onmouseout="this.style.background='rgba(253,224,71,0.06)'">हिंदी (Hindi)</button>
                            <button id="preset-voice-malayalam" type="button" style="background: rgba(20,184,166,0.06); border: 1px solid rgba(20,184,166,0.2); border-radius: 12px; padding: 0.4rem 0.65rem; font-size: 0.72rem; color: #2dd4bf; cursor: pointer; font-family: inherit; font-weight: 600; transition: background 0.2s;" onmouseover="this.style.background='rgba(20,184,166,0.12)'" onmouseout="this.style.background='rgba(20,184,166,0.06)'">മലയാളം (Malayalam)</button>
                            <button id="preset-voice-telugu" type="button" style="background: rgba(249,115,22,0.06); border: 1px solid rgba(249,115,22,0.2); border-radius: 12px; padding: 0.4rem 0.65rem; font-size: 0.72rem; color: #fb923c; cursor: pointer; font-family: inherit; font-weight: 600; transition: background 0.2s;" onmouseover="this.style.background='rgba(249,115,22,0.12)'" onmouseout="this.style.background='rgba(249,115,22,0.06)'">తెలుగు (Telugu)</button>
                            <button id="preset-voice-kannada" type="button" style="background: rgba(56,189,248,0.06); border: 1px solid rgba(56,189,248,0.2); border-radius: 12px; padding: 0.4rem 0.65rem; font-size: 0.72rem; color: #38bdf8; cursor: pointer; font-family: inherit; font-weight: 600; transition: background 0.2s;" onmouseover="this.style.background='rgba(56,189,248,0.12)'" onmouseout="this.style.background='rgba(56,189,248,0.06)'">ಕನ್ನಡ (Kannada)</button>
                        </div>
                    </div>
                </div>
            `,
            confirmText: 'Stop & Transcribe',
            cancelText: 'Cancel',
            onConfirm: () => {
                stopRecordingAndTranscribe();
            },
            onCancel: () => {
                cancelRecording();
            }
        });

        // Start recording
        startRecording();

        // Bind preset click events inside the modal
        const tamilBtn = document.getElementById('preset-voice-tamil');
        const hindiBtn = document.getElementById('preset-voice-hindi');
        const malayalamBtn = document.getElementById('preset-voice-malayalam');
        const teluguBtn = document.getElementById('preset-voice-telugu');
        const kannadaBtn = document.getElementById('preset-voice-kannada');
        
        if (tamilBtn) {
            tamilBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                cleanupRecorderState();
                closeConfirmModal();
                
                chatInput.value = "விற்பனையாளர் பருத்தி ரோல் விலையை மீட்டர் ரூ.120 என்று கூறினார். தொடர்பு கொள்ளவும்: 9876543210.";
                chatInput.dispatchEvent(new Event('input'));
                showCustomAlert("Tamil Preset loaded! Click the send button to test native language classification.");
            });
        }
        
        if (hindiBtn) {
            hindiBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                cleanupRecorderState();
                closeConfirmModal();
                
                chatInput.value = "विक्रेता ने सूती धागे की कीमत 120 रुपये प्रति मीटर बताई। संपर्क करें: 9876543210.";
                chatInput.dispatchEvent(new Event('input'));
                showCustomAlert("Hindi Preset loaded! Click the send button to test native language classification.");
            });
        }

        if (malayalamBtn) {
            malayalamBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                cleanupRecorderState();
                closeConfirmModal();
                
                chatInput.value = "വിൽപ്പനക്കാരൻ കോട്ടൺ റോൾ വില മീറ്ററിന് 120 രൂപ എന്ന് പറഞ്ഞു. ബന്ധപ്പെടുക: 9876543210.";
                chatInput.dispatchEvent(new Event('input'));
                showCustomAlert("Malayalam Preset loaded! Click the send button to test native language classification.");
            });
        }

        if (teluguBtn) {
            teluguBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                cleanupRecorderState();
                closeConfirmModal();
                
                chatInput.value = "విక్రేత పత్తి రోల్ ధర మీటరుకు 120 రూపాయలు అని చెప్పాడు. సంప్రదించండి: 9876543210.";
                chatInput.dispatchEvent(new Event('input'));
                showCustomAlert("Telugu Preset loaded! Click the send button to test native language classification.");
            });
        }

        if (kannadaBtn) {
            kannadaBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                cleanupRecorderState();
                closeConfirmModal();
                
                chatInput.value = "ಮಾರಾಟಗಾರನು ಹತ್ತಿ ರೋಲ್ ಬೆಲೆ ಮೀಟರ್‌ಗೆ 120 ರೂಪಾಯಿ ಎಂದು ಹೇಳಿದ್ದಾನೆ. ಸಂಪರ್ಕಿಸಿ: 9876543210.";
                chatInput.dispatchEvent(new Event('input'));
                showCustomAlert("Kannada Preset loaded! Click the send button to test native language classification.");
            });
        }
    });

    function startRecording() {
        const recordingDot = document.getElementById('voice-recording-dot');
        if (recordingDot) recordingDot.style.display = 'inline-block';
        
        audioChunks = [];
        recordSeconds = 0;
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.addEventListener('dataavailable', event => {
                    audioChunks.push(event.data);
                });
                mediaRecorder.start();
                
                // Start timer interval
                recordTimerInterval = setInterval(() => {
                    recordSeconds++;
                    const mins = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
                    const secs = String(recordSeconds % 60).padStart(2, '0');
                    const timerEl = document.getElementById('voice-modal-timer');
                    if (timerEl) timerEl.innerText = `${mins}:${secs}`;
                }, 1000);
            })
            .catch(err => {
                console.error("Mic access denied or error:", err);
                const statusEl = document.getElementById('voice-modal-status');
                const recDotEl = document.getElementById('voice-modal-rec-dot');
                if (statusEl) statusEl.innerHTML = "<span style='color: #ef4444;'>Microphone access denied. You can still use the presets below!</span>";
                if (recDotEl) recDotEl.style.display = 'none';
            });
    }

    function stopRecordingAndTranscribe() {
        cleanupRecorderState();
        
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                if (audioBlob.size > 0) {
                    performTranscriptionUpload(audioBlob);
                }
            });
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }

    function cancelRecording() {
        cleanupRecorderState();
        if (mediaRecorder) {
            if (mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }

    function cleanupRecorderState() {
        const recordingDot = document.getElementById('voice-recording-dot');
        if (recordingDot) recordingDot.style.display = 'none';
        
        if (recordTimerInterval) {
            clearInterval(recordTimerInterval);
            recordTimerInterval = null;
        }
    }

    async function performTranscriptionUpload(audioBlob) {
        chatInput.value = "... Transcribing voice note using Whisper ...";
        chatInput.disabled = true;
        
        try {
            const formData = new FormData();
            formData.append("file", audioBlob, "recording.webm");
            
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            chatInput.disabled = false;
            
            if (data.text) {
                chatInput.value = data.text;
                chatInput.dispatchEvent(new Event('input'));
            } else {
                chatInput.value = "";
                showCustomAlert("Transcription failed: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            chatInput.disabled = false;
            chatInput.value = "";
            showCustomAlert("Error connecting to transcription API: " + err.message);
        }
    }

    // --- Popover Action Button Click Listener ---
    let activeQuickAction = '';
    
    document.querySelectorAll('.popover-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
            activeQuickAction = action;
            composerPopover.style.display = 'none';
            composerPlusBtn.classList.remove('open');
            
            if (action === 'gallery') {
                triggerGalleryUpload();
            } else if (action === 'camera') {
                triggerCameraCapture();
            } else if (action === 'location') {
                triggerLocationShare();
            } else if (action === 'contact') {
                triggerContactPicker();
            } else if (action === 'document') {
                triggerDocumentUpload();
            } else {
                openActionFormModal(action);
            }
        });
    });

    // --- WhatsApp-style Document Controller ---
    const realDocumentInput = document.getElementById('real-document-input');
    const documentPreviewModal = document.getElementById('document-preview-modal');
    const docPreviewName = document.getElementById('doc-preview-name');
    const docPreviewSize = document.getElementById('doc-preview-size');
    const docPreviewIcon = document.getElementById('doc-preview-icon');
    const documentCaptionInput = document.getElementById('document-caption-input');
    const documentSendBtn = document.getElementById('document-preview-send-btn');
    const documentCancelBtn = document.getElementById('document-preview-cancel-btn');
    const closeDocumentPreviewModalBtn = document.getElementById('close-document-preview-modal');

    let currentDocumentName = '';
    let currentDocumentSize = '';
    let currentDocumentData = '';

    function triggerDocumentUpload() {
        realDocumentInput.value = '';
        realDocumentInput.click();
    }

    realDocumentInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        currentDocumentName = file.name;
        const sizeKb = Math.round(file.size / 1024);
        currentDocumentSize = `${sizeKb} KB`;

        const reader = new FileReader();
        reader.onload = function(evt) {
            currentDocumentData = evt.target.result;
            
            docPreviewName.innerText = currentDocumentName;
            docPreviewName.title = currentDocumentName;
            const isPdf = currentDocumentName.toLowerCase().endsWith('.pdf');
            docPreviewSize.innerText = `${isPdf ? 'PDF Document' : 'File'} • ${currentDocumentSize}`;
            docPreviewIcon.className = isPdf ? 'fa-solid fa-file-pdf' : 'fa-solid fa-file-invoice';
            docPreviewIcon.parentElement.style.background = isPdf ? '#f87171' : '#60a5fa';

            documentCaptionInput.value = '';
            documentPreviewModal.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    });

    // Wire Document Preset pills
    document.querySelectorAll('.document-preset-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetKey = btn.getAttribute('data-preset');
            if (presetKey === 'invoice_pdf') {
                currentDocumentName = 'invoice_ramesh_mills.pdf';
                currentDocumentSize = '45 KB';
                currentDocumentData = 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbNCAwIFJdCi9Db3VudCAxCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMyAwIFIKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KL0NvbnRlbnRzIDYgMCBSCj4+CmVuZG9iag==';
                
                docPreviewName.innerText = currentDocumentName;
                docPreviewName.title = currentDocumentName;
                docPreviewSize.innerText = `PDF Document • ${currentDocumentSize}`;
                docPreviewIcon.className = 'fa-solid fa-file-pdf';
                docPreviewIcon.parentElement.style.background = '#f87171';
                documentCaptionInput.value = 'Supplier Quote Invoice - Ramesh Mills - Rs 15,000 for 100 meters of satin fabric.';
            } else if (presetKey === 'stock_sheet') {
                currentDocumentName = 'saree_inventory_count.xlsx';
                currentDocumentSize = '12 KB';
                currentDocumentData = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQAAAAIA';
                
                docPreviewName.innerText = currentDocumentName;
                docPreviewName.title = currentDocumentName;
                docPreviewSize.innerText = `Excel Spreadsheet • ${currentDocumentSize}`;
                docPreviewIcon.className = 'fa-solid fa-file-invoice';
                docPreviewIcon.parentElement.style.background = '#60a5fa';
                documentCaptionInput.value = 'Inventory Sheet - Satin Saree Stock Count: 45 units available.';
            }
            documentPreviewModal.style.display = 'flex';
        });
    });

    function closeDocumentPreview() {
        documentPreviewModal.style.display = 'none';
        currentDocumentName = '';
        currentDocumentSize = '';
        currentDocumentData = '';
    }

    documentCancelBtn.addEventListener('click', closeDocumentPreview);
    closeDocumentPreviewModalBtn.addEventListener('click', closeDocumentPreview);

    documentSendBtn.addEventListener('click', () => {
        const caption = documentCaptionInput.value.trim();
        const msgText = `[Document Attachment] filename: ${currentDocumentName} | size: ${currentDocumentSize} | caption: ${caption} | data: ${currentDocumentData}`;
        closeDocumentPreview();
        
        chatInput.value = msgText;
        handleSendMessage();
    });

    // --- WhatsApp-style Gallery Controller ---
    const realGalleryInput = document.getElementById('real-gallery-input');
    const galleryPreviewModal = document.getElementById('gallery-preview-modal');
    const galleryPreviewImg = document.getElementById('gallery-preview-img');
    const galleryCaptionInput = document.getElementById('gallery-caption-input');
    const gallerySendBtn = document.getElementById('gallery-preview-send-btn');
    const galleryCancelBtn = document.getElementById('gallery-preview-cancel-btn');
    const closeGalleryPreviewModalBtn = document.getElementById('close-gallery-preview-modal');

    let currentGalleryBase64 = '';

    function triggerGalleryUpload() {
        realGalleryInput.value = '';
        realGalleryInput.click();
    }

    realGalleryInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
            currentGalleryBase64 = evt.target.result;
            galleryPreviewImg.src = currentGalleryBase64;
            galleryCaptionInput.value = '';
            galleryPreviewModal.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    });

    // Wire Gallery Preset pills
    document.querySelectorAll('.gallery-preset-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetKey = btn.getAttribute('data-preset');
            if (MOCK_SCREENSHOTS[presetKey]) {
                currentGalleryBase64 = MOCK_SCREENSHOTS[presetKey];
                galleryPreviewImg.src = currentGalleryBase64;
                galleryCaptionInput.value = '';
                galleryPreviewModal.style.display = 'flex';
            }
        });
    });

    function closeGalleryPreview() {
        galleryPreviewModal.style.display = 'none';
        currentGalleryBase64 = '';
    }

    galleryCancelBtn.addEventListener('click', closeGalleryPreview);
    closeGalleryPreviewModalBtn.addEventListener('click', closeGalleryPreview);

    gallerySendBtn.addEventListener('click', () => {
        const caption = galleryCaptionInput.value.trim();
        const msgText = `[Image Attachment] caption: ${caption} | data: ${currentGalleryBase64}`;
        closeGalleryPreview();
        
        chatInput.value = msgText;
        handleSendMessage();
    });

    // --- WhatsApp-style Camera Controller ---
    const cameraModal = document.getElementById('camera-capture-modal');
    const cameraVideo = document.getElementById('camera-video');
    const cameraCanvas = document.getElementById('camera-canvas');
    const cameraShutterBtn = document.getElementById('camera-shutter-btn');
    const cameraStreamContainer = document.getElementById('camera-stream-container');
    const cameraPreviewContainer = document.getElementById('camera-preview-container');
    const cameraPreviewImg = document.getElementById('camera-preview-img');
    const cameraCaptionInput = document.getElementById('camera-caption-input');
    const cameraRetryBtn = document.getElementById('camera-retry-btn');
    const cameraSendBtn = document.getElementById('camera-send-btn');
    const closeCameraBtn = document.getElementById('close-camera-modal');

    let cameraStream = null;
    let capturedPhotoBase64 = '';

    async function triggerCameraCapture() {
        cameraStreamContainer.style.display = 'flex';
        cameraPreviewContainer.style.display = 'none';
        capturedPhotoBase64 = '';
        cameraCaptionInput.value = '';

        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
            });
            cameraVideo.srcObject = cameraStream;
            cameraModal.style.display = 'flex';
        } catch (err) {
            console.warn('[Camera] Failed to initialize webcam stream:', err);
            capturedPhotoBase64 = MOCK_SCREENSHOTS.receipt; 
            cameraPreviewImg.src = capturedPhotoBase64;
            cameraStreamContainer.style.display = 'none';
            cameraPreviewContainer.style.display = 'flex';
            cameraModal.style.display = 'flex';
        }
    }

    // Wire Camera presets click
    document.querySelectorAll('.camera-preset-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetKey = btn.getAttribute('data-preset');
            if (MOCK_SCREENSHOTS[presetKey]) {
                capturedPhotoBase64 = MOCK_SCREENSHOTS[presetKey];
                cameraPreviewImg.src = capturedPhotoBase64;
                stopCameraStream();
                cameraStreamContainer.style.display = 'none';
                cameraPreviewContainer.style.display = 'flex';
            }
        });
    });

    function stopCameraStream() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
    }

    function closeCameraModal() {
        stopCameraStream();
        cameraModal.style.display = 'none';
    }

    closeCameraBtn.addEventListener('click', closeCameraModal);

    cameraShutterBtn.addEventListener('click', () => {
        if (!cameraStream) return;
        
        const width = cameraVideo.videoWidth || 640;
        const height = cameraVideo.videoHeight || 480;
        cameraCanvas.width = width;
        cameraCanvas.height = height;
        
        const ctx = cameraCanvas.getContext('2d');
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(cameraVideo, 0, 0, width, height);
        
        capturedPhotoBase64 = cameraCanvas.toDataURL('image/jpeg');
        cameraPreviewImg.src = capturedPhotoBase64;
        
        stopCameraStream();
        cameraStreamContainer.style.display = 'none';
        cameraPreviewContainer.style.display = 'flex';
    });

    cameraRetryBtn.addEventListener('click', () => {
        triggerCameraCapture();
    });

    cameraSendBtn.addEventListener('click', () => {
        const caption = cameraCaptionInput.value.trim();
        const msgText = `[Image Attachment] caption: ${caption} | data: ${capturedPhotoBase64}`;
        closeCameraModal();
        
        chatInput.value = msgText;
        handleSendMessage();
    });

    // --- WhatsApp-style Location Controller ---
    const locationModal = document.getElementById('location-share-modal');
    const locationLoading = document.getElementById('location-loading-container');
    const locationMapContainer = document.getElementById('location-map-container');
    const locationMapIframe = document.getElementById('location-map-iframe');
    const locationCoordsVal = document.getElementById('location-coords-val');
    const locationNameInput = document.getElementById('location-name-input');
    const locationSendBtn = document.getElementById('location-send-btn');
    const locationCancelBtn = document.getElementById('location-cancel-btn');
    const closeLocationBtn = document.getElementById('close-location-modal');

    let currentLat = 0.0;
    let currentLon = 0.0;

    function triggerLocationShare() {
        locationLoading.style.display = 'flex';
        locationMapContainer.style.display = 'none';
        locationSendBtn.style.display = 'none';
        locationNameInput.value = '';
        locationModal.style.display = 'flex';

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    currentLat = pos.coords.latitude;
                    currentLon = pos.coords.longitude;
                    
                    locationCoordsVal.innerText = `${currentLat.toFixed(6)}° N, ${currentLon.toFixed(6)}° E`;
                    locationNameInput.value = 'My Current Location';
                    
                    const bboxDelta = 0.003;
                    locationMapIframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${currentLon - bboxDelta}%2C${currentLat - bboxDelta}%2C${currentLon + bboxDelta}%2C${currentLat + bboxDelta}&layer=mapnik&marker=${currentLat}%2C${currentLon}`;
                    
                    locationLoading.style.display = 'none';
                    locationMapContainer.style.display = 'flex';
                    locationSendBtn.style.display = 'inline-block';
                },
                (err) => {
                    console.warn('[Geolocation] Failed to resolve GPS location:', err);
                    currentLat = 12.7408;
                    currentLon = 77.8253;
                    
                    locationCoordsVal.innerText = `${currentLat}° N, ${currentLon}° E (Simulated GPS)`;
                    locationNameInput.value = 'Hosur Warehouse Hub';
                    
                    const bboxDelta = 0.003;
                    locationMapIframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${currentLon - bboxDelta}%2C${currentLat - bboxDelta}%2C${currentLon + bboxDelta}%2C${currentLat + bboxDelta}&layer=mapnik&marker=${currentLat}%2C${currentLon}`;
                    
                    locationLoading.style.display = 'none';
                    locationMapContainer.style.display = 'flex';
                    locationSendBtn.style.display = 'inline-block';
                },
                { timeout: 5000, enableHighAccuracy: true }
            );
        } else {
            currentLat = 12.7408;
            currentLon = 77.8253;
            locationCoordsVal.innerText = '12.7408° N, 77.8253° E (Geolocation unsupported)';
            locationNameInput.value = 'Hosur Warehouse Hub';
            
            const bboxDelta = 0.003;
            locationMapIframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${currentLon - bboxDelta}%2C${currentLat - bboxDelta}%2C${currentLon + bboxDelta}%2C${currentLat + bboxDelta}&layer=mapnik&marker=${currentLat}%2C${currentLon}`;
            
            locationLoading.style.display = 'none';
            locationMapContainer.style.display = 'flex';
            locationSendBtn.style.display = 'inline-block';
        }
    }

    function closeLocationModal() {
        locationModal.style.display = 'none';
        locationMapIframe.src = 'about:blank';
    }

    closeLocationBtn.addEventListener('click', closeLocationModal);
    locationCancelBtn.addEventListener('click', closeLocationModal);

    locationSendBtn.addEventListener('click', () => {
        const placeName = locationNameInput.value.trim() || 'Shared Location';
        const msgText = `[Location Attachment] name: ${placeName} | lat: ${currentLat} | lon: ${currentLon} | address: ${placeName}`;
        closeLocationModal();
        
        chatInput.value = msgText;
        handleSendMessage();
    });

    // --- WhatsApp-style Contact Controller ---
    const contactModal = document.getElementById('contact-picker-modal');
    const contactsContainer = document.getElementById('contacts-list-container');
    const contactSearch = document.getElementById('contact-search-input');
    const toggleNewContactBtn = document.getElementById('btn-toggle-new-contact');
    const newContactForm = document.getElementById('contact-custom-form');
    const contactSendBtn = document.getElementById('contact-picker-send');
    const contactCancelBtn = document.getElementById('contact-picker-cancel');
    const closeContactPickerBtn = document.getElementById('close-contact-picker-btn');

    const customNameInput = document.getElementById('new-contact-name');
    const customPhoneInput = document.getElementById('new-contact-phone');
    const customEmailInput = document.getElementById('new-contact-email');

    const CONTACT_PRESETS = [
        { name: 'Ramesh Fabrics', phone: '+91 98765 43210', email: 'sales@rameshfabrics.com' },
        { name: 'Anjali Weavers', phone: '+91 91234 56789', email: 'contact@anjaliweavers.in' },
        { name: 'Karan Logistics', phone: '+91 88888 77777', email: 'dispatch@karanlogistics.com' },
        { name: 'Priya Saree Boutique', phone: '+91 76543 21098', email: 'priya@boutique.com' }
    ];

    let selectedContact = null;

    function renderContactsList(filterText = '') {
        contactsContainer.innerHTML = '';
        const searchVal = filterText.toLowerCase();
        
        const filtered = CONTACT_PRESETS.filter(c => 
            c.name.toLowerCase().includes(searchVal) || 
            c.phone.toLowerCase().includes(searchVal) || 
            c.email.toLowerCase().includes(searchVal)
        );

        if (filtered.length === 0) {
            contactsContainer.innerHTML = `
                <div style="font-size: 0.8rem; color: #8B8F9C; text-align: center; padding: 1rem;">
                    No contacts found. Use "New Contact" to add one!
                </div>
            `;
            return;
        }

        filtered.forEach((c, idx) => {
            const card = document.createElement('div');
            card.style = "display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; border-radius: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: all 0.15s; margin-bottom: 0.35rem;";
            
            const initials = c.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
            const colors = ['#34d399', '#60a5fa', '#fb923c', '#a78bfa'];
            const avatarBg = colors[idx % colors.length];

            const isSelected = selectedContact && selectedContact.name === c.name;
            if (isSelected) {
                card.style.borderColor = '#34d399';
                card.style.backgroundColor = 'rgba(52,211,153,0.05)';
            }

            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.75rem; overflow: hidden; flex: 1;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: ${avatarBg}; color: #fff; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        ${initials}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.1rem; overflow: hidden;">
                        <span style="font-size: 0.85rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.name}</span>
                        <span style="font-size: 0.72rem; color: #8B8F9C; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.phone}</span>
                    </div>
                </div>
                <div style="margin-left: 0.5rem;">
                    <input type="radio" name="contact-selection-radio" ${isSelected ? 'checked' : ''} style="accent-color: #34d399; cursor: pointer;">
                </div>
            `;

            card.addEventListener('click', () => {
                selectedContact = c;
                renderContactsList(filterText);
                updateContactSendButtonState();
            });

            contactsContainer.appendChild(card);
        });
    }

    function updateContactSendButtonState() {
        if (selectedContact) {
            contactSendBtn.innerText = `Share Contact`;
            contactSendBtn.style.opacity = '1';
            contactSendBtn.style.cursor = 'pointer';
        } else {
            contactSendBtn.innerText = `Share`;
            contactSendBtn.style.opacity = '0.5';
            contactSendBtn.style.cursor = 'not-allowed';
        }
    }

    function triggerContactPicker() {
        selectedContact = null;
        contactSearch.value = '';
        newContactForm.style.display = 'none';
        toggleNewContactBtn.style.display = 'block';
        customNameInput.value = '';
        customPhoneInput.value = '';
        customEmailInput.value = '';
        
        renderContactsList();
        updateContactSendButtonState();
        contactModal.style.display = 'flex';
    }

    contactSearch.addEventListener('input', (e) => {
        renderContactsList(e.target.value);
    });

    toggleNewContactBtn.addEventListener('click', () => {
        newContactForm.style.display = 'flex';
        toggleNewContactBtn.style.display = 'none';
        
        selectedContact = null;
        renderContactsList(contactSearch.value);
        updateContactSendButtonState();
    });

    function handleCustomContactChange() {
        const name = customNameInput.value.trim();
        const phone = customPhoneInput.value.trim();
        const email = customEmailInput.value.trim();

        if (name && phone) {
            selectedContact = { name, phone, email: email || 'N/A' };
        } else {
            selectedContact = null;
        }
        updateContactSendButtonState();
    }

    customNameInput.addEventListener('input', handleCustomContactChange);
    customPhoneInput.addEventListener('input', handleCustomContactChange);
    customEmailInput.addEventListener('input', handleCustomContactChange);

    function closeContactPicker() {
        contactModal.style.display = 'none';
    }

    closeContactPickerBtn.addEventListener('click', closeContactPicker);
    contactCancelBtn.addEventListener('click', closeContactPicker);

    contactSendBtn.addEventListener('click', () => {
        if (!selectedContact) return;
        const msgText = `[Contact Attachment] name: ${selectedContact.name} | phone: ${selectedContact.phone} | email: ${selectedContact.email}`;
        closeContactPicker();
        
        chatInput.value = msgText;
        handleSendMessage();
    });

    // Setup Business Quote button visibility based on switcher mode
    function updateBizQuoteActionVisibility() {
        const quoteBtn = document.getElementById('action-business-quote-btn');
        if (!quoteBtn) return;
        const isBusiness = modeToggle && modeToggle.checked;
        quoteBtn.style.display = isBusiness ? 'flex' : 'none';
        
        // Re-adjust grid columns if hidden
        if (composerPopover) {
            composerPopover.style.gridTemplateColumns = isBusiness ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)';
        }
    }
    
    // Listen to personal/business toggle change events to update action visibility
    if (modeToggle) {
        modeToggle.addEventListener('change', updateBizQuoteActionVisibility);
        // Initial setup
        updateBizQuoteActionVisibility();
    }

    // Dynamic forms injector inside Action modal
    function openActionFormModal(action) {
        actionModalFormContent.innerHTML = '';
        
        if (action === 'gallery') {
            actionModalTitle.innerText = 'Upload Gallery Screenshot';
            actionModalIcon.className = 'fa-solid fa-image';
            actionModalIcon.style.color = '#60a5fa';
            
            actionModalFormContent.innerHTML = `
                <div class="action-form-row">
                    <label>Select Mock Screenshot</label>
                    <select id="action-select-gallery">
                        <option value="wedding_saree">Screenshot: Designer Silk Saree - Rs. 2400</option>
                        <option value="home_address">Screenshot: New Warehouse Address card</option>
                        <option value="business_card">Screenshot: Ramesh Mills Contact card</option>
                    </select>
                </div>
            `;
        } else if (action === 'camera') {
            actionModalTitle.innerText = 'Camera Capture';
            actionModalIcon.className = 'fa-solid fa-camera';
            actionModalIcon.style.color = '#f87171';
            
            actionModalFormContent.innerHTML = `
                <div class="action-form-row">
                    <label>Captured Snapshot Preset</label>
                    <select id="action-select-camera">
                        <option value="receipt">Snapshot: Supplier Receipt No. 8921 (Rs 4500)</option>
                        <option value="saree_tag">Snapshot: Product Tag: Satin Saree Blue M05</option>
                    </select>
                </div>
            `;
        } else if (action === 'document') {
            actionModalTitle.innerText = 'Upload Document';
            actionModalIcon.className = 'fa-solid fa-file-pdf';
            actionModalIcon.style.color = '#fb923c';
            
            actionModalFormContent.innerHTML = `
                <div class="action-form-row">
                    <label>Select Invoice / PDF</label>
                    <select id="action-select-document">
                        <option value="quote_pdf">Document: Supplier Quote Invoice - Ramesh Mills - Rs 15,000</option>
                        <option value="inventory_pdf">Document: Inventory Sheet - Satin Saree Stock Count</option>
                    </select>
                </div>
            `;
        } else if (action === 'contact') {
            actionModalTitle.innerText = 'Add Contact Info';
            actionModalIcon.className = 'fa-solid fa-address-book';
            actionModalIcon.style.color = '#34d399';
            
            actionModalFormContent.innerHTML = `
                <div class="action-form-row">
                    <label>Contact Name</label>
                    <input type="text" id="action-contact-name" placeholder="e.g. Ramesh Fabrics">
                </div>
                <div class="action-form-row">
                    <label>Phone Number</label>
                    <input type="text" id="action-contact-phone" placeholder="e.g. 9876543210">
                </div>
                <div class="action-form-row">
                    <label>Business Email</label>
                    <input type="text" id="action-contact-email" placeholder="e.g. sales@rameshfabrics.com">
                </div>
            `;
        } else if (action === 'location') {
            actionModalTitle.innerText = 'Attach Location';
            actionModalIcon.className = 'fa-solid fa-map-pin';
            actionModalIcon.style.color = '#a78bfa';
            
            actionModalFormContent.innerHTML = `
                <div class="action-form-row">
                    <label>Address details</label>
                    <input type="text" id="action-location-address" placeholder="e.g. 42 Garden Avenue, Block C, Hosur">
                </div>
                <div class="action-form-row" style="margin-top: 0.25rem;">
                    <button type="button" id="btn-use-location" style="padding: 0.4rem; font-size: 0.72rem; font-weight: 600; border-radius: 6px; cursor: pointer; background: rgba(255,255,255,0.05); border: 1px solid var(--border-light); color: var(--text-primary);">
                        <i class="fa-solid fa-location-crosshairs" style="margin-right: 0.25rem;"></i> Use Current GPS Coordinates
                    </button>
                </div>
            `;
            
            // Wire GPS Coordinates click listener
            setTimeout(() => {
                const btn = document.getElementById('btn-use-location');
                if (btn) {
                    btn.addEventListener('click', () => {
                        const input = document.getElementById('action-location-address');
                        if (input) input.value = "Current Location (GPS: 12.7408° N, 77.8253° E) - Hosur Warehouse Hub";
                    });
                }
            }, 50);
        } else if (action === 'savelink') {
            actionModalTitle.innerText = 'Paste Link directly';
            actionModalIcon.className = 'fa-solid fa-link';
            actionModalIcon.style.color = '#22d3ee';
            
            actionModalFormContent.innerHTML = `
                <div class="action-form-row">
                    <label>Save Link URL</label>
                    <input type="text" id="action-link-url" value="https://" placeholder="e.g. https://myntra.com/saree/designer-saree">
                </div>
                <div class="action-form-row">
                    <label>Description / Note</label>
                    <input type="text" id="action-link-desc" placeholder="e.g. Wedding Silk Saree reference link">
                </div>
            `;
        } else if (action === 'reminder') {
            actionModalTitle.innerText = 'Add Task Reminder';
            actionModalIcon.className = 'fa-solid fa-calendar-check';
            actionModalIcon.style.color = '#fbbf24';
            
            actionModalFormContent.innerHTML = `
                <div class="action-form-row">
                    <label>Reminder Message</label>
                    <input type="text" id="action-reminder-msg" placeholder="e.g. Remind me to verify Ramesh's quote">
                </div>
                <div class="action-form-row">
                    <label>Due Date & Time (Optional)</label>
                    <input type="datetime-local" id="action-reminder-date">
                </div>
                <div class="action-form-row">
                    <label>Urgency</label>
                    <select id="action-reminder-urgency">
                        <option value="none">None</option>
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
            `;
        } else if (action === 'business_quote') {
            actionModalTitle.innerText = 'Add Business Quote Form';
            actionModalIcon.className = 'fa-solid fa-file-invoice-dollar';
            actionModalIcon.style.color = '#f472b6';
            
            actionModalFormContent.innerHTML = `
                <div class="action-form-row">
                    <label>Supplier Name</label>
                    <input type="text" id="action-quote-supplier" placeholder="e.g. Ramesh Saree Mills">
                </div>
                <div class="action-form-row">
                    <label>Item Description</label>
                    <input type="text" id="action-quote-item" placeholder="e.g. Cotton Roll Type A">
                </div>
                <div class="action-form-row">
                    <label>Price</label>
                    <input type="text" id="action-quote-price" placeholder="e.g. Rs 120 per meter">
                </div>
                <div class="action-form-row">
                    <label>Quantity</label>
                    <input type="text" id="action-quote-qty" placeholder="e.g. 50 rolls">
                </div>
            `;
        }
        
        actionModal.style.display = 'flex';
    }

    actionModalCancel.addEventListener('click', () => {
        actionModal.style.display = 'none';
        activeQuickAction = '';
    });

    actionModalSubmit.addEventListener('click', () => {
        let compiledText = '';
        
        if (activeQuickAction === 'gallery') {
            const selectVal = document.getElementById('action-select-gallery').value;
            if (selectVal === 'wedding_saree') {
                compiledText = "Uploaded Gallery Screenshot: Designer Silk Saree offer at Rs. 2400. Reference: https://www.myntra.com/saree/designer-silk-saree-10934";
            } else if (selectVal === 'home_address') {
                compiledText = "Uploaded Gallery Screenshot: Hosur warehouse delivery address: 42 Garden Avenue, Block C, Hosur, Tamil Nadu.";
            } else {
                compiledText = "Uploaded Gallery Screenshot: Contact Card - Fabric Supplier Ramesh, phone: 9876543210.";
            }
        } else if (activeQuickAction === 'camera') {
            const selectVal = document.getElementById('action-select-camera').value;
            if (selectVal === 'receipt') {
                compiledText = "Captured Camera Image: Supplier Receipt No. 8921 total Rs 4500 paid to Ramesh Fabrics.";
            } else {
                compiledText = "Captured Camera Image: Product Tag: Satin Saree Blue M05 (Store Rack 4).";
            }
        } else if (activeQuickAction === 'document') {
            const selectVal = document.getElementById('action-select-document').value;
            if (selectVal === 'quote_pdf') {
                compiledText = "Uploaded Document: Supplier Quote Invoice - Ramesh Mills - Rs 15,000 for 100 meters of satin fabric.";
            } else {
                compiledText = "Uploaded Document: Inventory Sheet - Satin Saree Stock Count: 45 units available.";
            }
        } else if (activeQuickAction === 'contact') {
            const name = document.getElementById('action-contact-name').value.trim() || 'Unknown';
            const phone = document.getElementById('action-contact-phone').value.trim() || 'N/A';
            const email = document.getElementById('action-contact-email').value.trim() || 'N/A';
            compiledText = `Contact Info: ${name}. Phone: ${phone}. Email: ${email}.`;
        } else if (activeQuickAction === 'location') {
            const addr = document.getElementById('action-location-address').value.trim();
            if (!addr) return;
            compiledText = `Attached Location: ${addr}`;
        } else if (activeQuickAction === 'savelink') {
            const url = document.getElementById('action-link-url').value.trim();
            const desc = document.getElementById('action-link-desc').value.trim();
            if (!url || url === 'https://') return;
            compiledText = `${desc ? desc + ': ' : 'Save Link: '}${url}`;
        } else if (activeQuickAction === 'reminder') {
            const msg = document.getElementById('action-reminder-msg').value.trim();
            const date = document.getElementById('action-reminder-date').value;
            const urgency = document.getElementById('action-reminder-urgency').value;
            if (!msg) return;
            compiledText = `Reminder: ${msg}${date ? ' due at ' + date : ''}. [Urgency: ${urgency}]`;
        } else if (activeQuickAction === 'business_quote') {
            const supplier = document.getElementById('action-quote-supplier').value.trim() || 'N/A';
            const item = document.getElementById('action-quote-item').value.trim() || 'N/A';
            const price = document.getElementById('action-quote-price').value.trim() || 'N/A';
            const qty = document.getElementById('action-quote-qty').value.trim() || 'N/A';
            compiledText = `Business Quote Form: Supplier: ${supplier}, Item: ${item}, Price: ${price}, Quantity: ${qty}.`;
        }
        
        if (compiledText) {
            chatInput.value = compiledText;
            actionModal.style.display = 'none';
            activeQuickAction = '';
            
            // Switch mode to save mode before sending structured input
            if (currentComposerMode !== 'save') {
                setComposerMode('save');
            }
            
            handleSendMessage();
        }
    });

    // Explainer Toggle Logic
    explainerToggleBtn.addEventListener('click', () => {
        const isVisible = window.getComputedStyle(explainerContentBox).display !== 'none';
        if (isVisible) {
            explainerContentBox.style.display = 'none';
            explainerToggleBtn.classList.remove('active');
        } else {
            explainerContentBox.style.display = 'block';
            explainerToggleBtn.classList.add('active');
        }
    });

    // --- Vault Control Listeners ---
    vaultSearchBtn.addEventListener('click', handleVaultSearch);
    vaultSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleVaultSearch();
    });

    // Category Tabs Filter
    tabButtons.forEach(tab => {
        tab.addEventListener('click', () => {
            tabButtons.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategoryFilter = tab.getAttribute('data-category');
            renderMemories();
        });
    });

    // Business/Personal toggle listener
    const modeSegmentedControl = document.getElementById('mode-segmented-control');
    const segmentBtnPersonal = document.getElementById('segment-btn-personal');
    const segmentBtnBusiness = document.getElementById('segment-btn-business');

    const vaultModeSegmentedControl = document.getElementById('vault-mode-segmented-control');
    const vaultSegmentBtnPersonal = document.getElementById('vault-segment-btn-personal');
    const vaultSegmentBtnBusiness = document.getElementById('vault-segment-btn-business');

    function updateSegmentedUI(isBusiness) {
        if (isBusiness) {
            segmentBtnBusiness.classList.add('active');
            segmentBtnPersonal.classList.remove('active');
            modeSegmentedControl.classList.add('business-active');
            if (vaultSegmentBtnBusiness) {
                vaultSegmentBtnBusiness.classList.add('active');
                vaultSegmentBtnPersonal.classList.remove('active');
                vaultModeSegmentedControl.classList.add('business-active');
            }
        } else {
            segmentBtnPersonal.classList.add('active');
            segmentBtnBusiness.classList.remove('active');
            modeSegmentedControl.classList.remove('business-active');
            if (vaultSegmentBtnPersonal) {
                vaultSegmentBtnPersonal.classList.add('active');
                vaultSegmentBtnBusiness.classList.remove('active');
                vaultModeSegmentedControl.classList.remove('business-active');
            }
        }
    }

    modeToggle.addEventListener('change', () => {
        const isBiz = modeToggle.checked;
        console.log(`[Mode Toggle] Switched to: ${isBiz ? 'Business' : 'Personal'}`);
        updateSegmentedUI(isBiz);
        renderMemories();
    });

    [segmentBtnPersonal, vaultSegmentBtnPersonal].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                if (modeToggle.checked) {
                    modeToggle.checked = false;
                    modeToggle.dispatchEvent(new Event('change'));
                }
            });
        }
    });

    [segmentBtnBusiness, vaultSegmentBtnBusiness].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                if (!modeToggle.checked) {
                    modeToggle.checked = true;
                    modeToggle.dispatchEvent(new Event('change'));
                }
            });
        }
    });

    // --- Edit Modal Form Handlers ---
    function closeEditModal() {
        editModal.style.display = 'none';
    }

    closeModalBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('edit-memory-id').value;
        const content = document.getElementById('edit-content').value;
        const summary = document.getElementById('edit-summary').value;
        const category = document.getElementById('edit-category').value;
        const urgency = document.getElementById('edit-urgency').value;
        const is_business_related = document.getElementById('edit-business-toggle').checked;
        const tags = document.getElementById('edit-tags').value
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);
            
        const memory = memoryCache[id] || {};
        const language = memory.language || 'en';
        const due_date = memory.due_date || null;
        const reminder_status = memory.reminder_status || null;
            
        try {
            const response = await fetch(`/api/memories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    summary,
                    category,
                    urgency,
                    is_business_related,
                    tags,
                    language,
                    due_date,
                    reminder_status
                })
            });
            
            const data = await response.json();
            if (data.status === 'success') {
                closeEditModal();
                
                // Update local cache
                const updatedMemory = {
                    id,
                    content,
                    summary,
                    category,
                    urgency,
                    is_business_related,
                    tags,
                    due_date,
                    reminder_status,
                    created_at: memory.created_at || new Date().toISOString(),
                    entities: {
                        updated_at: new Date().toISOString(),
                        due_date,
                        reminder_status
                    }
                };
                memoryCache[id] = updatedMemory;
                
                // Dynamically update the state array and re-render
                updateChatBubblesForMemory(updatedMemory);
                refreshAllViews(); // Refresh grid
            } else {
                showCustomAlert('Save Failed', 'Failed to save changes: ' + data.message);
            }
        } catch (error) {
            console.error('Error saving edits:', error);
            showCustomAlert('Database Error', 'Error connecting to database to save edits.');
        }
    });

    async function refreshAllViews() {
        await loadMemories();
        await updateStorageUsage();
        if (window.loadFoldersView) {
            await window.loadFoldersView();
            const activeFolderContainer = document.getElementById('folder-contents-level');
            if (activeFolderContainer && activeFolderContainer.style.display === 'block') {
                const activeFolderName = document.getElementById('active-folder-name').innerText;
                window.openFolder(activeFolderName);
            }
        }
    }
    window.refreshAllViews = refreshAllViews;

    // --- Database Core Functions ---

    /**
     * Fetches memories from the database.
     */
    async function loadMemories() {
        try {
            const response = await fetch(`/api/memories?user_phone=${encodeURIComponent(currentUserPhone || 'anonymous')}`);
            const data = await response.json();
            allMemories = data.memories || [];
            
            // Populate the memory cache
            allMemories.forEach(m => {
                memoryCache[m.id] = m;
            });
            
            await renderMemories();
            checkDueReminders();
            loadVaultInsights();
        } catch (error) {
            console.error('Error loading memories:', error);
            memoriesContainer.innerHTML = `
                <div class="empty-state text-danger">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>Failed to connect to memories database.</p>
                </div>
            `;
        }
    }
    window.loadMemories = loadMemories;

    let groupedDocuments = {};

    async function loadFoldersView() {
        const gridContainer = document.getElementById('folders-grid-container');
        if (gridContainer) {
            gridContainer.innerHTML = '<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i> Loading folders...</div>';
        }
        document.getElementById('folders-index-level').style.display = 'block';
        document.getElementById('folder-contents-level').style.display = 'none';
        
        try {
            const showBusinessMode = modeToggle.checked;
            const response = await fetch(`/api/vault/documents?user_phone=${encodeURIComponent(currentUserPhone || 'anonymous')}&is_business=${showBusinessMode}`);
            const data = await response.json();
            groupedDocuments = data.documents || {};

            // Ensure standard folders always exist in groupedDocuments (even if empty) to preserve default options
            const standardFolders = ["Government & Legal", "Business & Finance", "Academic & Coursework", "Personal"];
            standardFolders.forEach(sf => {
                if (!groupedDocuments[sf]) {
                    groupedDocuments[sf] = [];
                }
            });

            let html = '';
            // Sort standard folders first, then custom folders alphabetically
            const allFolders = Object.keys(groupedDocuments).sort((a, b) => {
                const aIdx = standardFolders.indexOf(a);
                const bIdx = standardFolders.indexOf(b);
                if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                if (aIdx !== -1) return -1;
                if (bIdx !== -1) return 1;
                return a.localeCompare(b);
            });

            // Folder themes mapper
            const themes = {
                "Government & Legal": { icon: "fa-folder-closed", cls: "gov", desc: "Official identity proofs, regulatory documents, certificates, and tax records." },
                "Business & Finance": { icon: "fa-folder-closed", cls: "biz", desc: "Invoices, quotes, transaction receipts, agreements, and statements." },
                "Academic & Coursework": { icon: "fa-folder-closed", cls: "acad", desc: "Lecture notes, assignments, university certificates, and syllabus files." },
                "Personal": { icon: "fa-folder-closed", cls: "personal", desc: "Uncategorized attachments, scanned personal photos, recipes, and notes." }
            };

            allFolders.forEach(folder => {
                const count = (groupedDocuments[folder] || []).length;
                const theme = themes[folder] || { icon: "fa-folder-closed", cls: "custom", desc: "Custom folder created from search results." };
                
                html += `
                    <div class="folder-card" data-folder="${escapeHtml(folder)}" onclick="window.openFolder('${escapeHtml(folder)}')">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div class="folder-icon-wrapper ${theme.cls}">
                                <i class="fa-solid ${theme.icon}"></i>
                            </div>
                            <span class="count-badge" style="background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700;">${count} files</span>
                        </div>
                        <div>
                            <h3>${escapeHtml(folder)}</h3>
                            <p>${escapeHtml(theme.desc)}</p>
                        </div>
                        <div class="folder-card-action ${theme.cls}">
                            Open Folder <i class="fa-solid fa-arrow-right-long"></i>
                        </div>
                    </div>
                `;
            });

            if (gridContainer) {
                gridContainer.innerHTML = html;
            }
        } catch (error) {
            console.error('Error loading folders view:', error);
        }
    }
    window.loadFoldersView = loadFoldersView;

    function showDuplicateModal(summary) {
        return new Promise((resolve) => {
            const modal = document.getElementById('duplicate-modal');
            const summaryLabel = document.getElementById('duplicate-modal-summary');
            const replaceBtn = document.getElementById('duplicate-modal-replace');
            const separateBtn = document.getElementById('duplicate-modal-separate');
            const cancelBtn = document.getElementById('duplicate-modal-cancel');
            
            summaryLabel.innerText = summary || 'Untitled Memory';
            modal.style.display = 'flex';
            
            function cleanUp() {
                modal.style.display = 'none';
                replaceBtn.removeEventListener('click', onReplace);
                separateBtn.removeEventListener('click', onSeparate);
                cancelBtn.removeEventListener('click', onCancel);
            }
            
            function onReplace() {
                cleanUp();
                resolve('replace');
            }
            
            function onSeparate() {
                cleanUp();
                resolve('separate');
            }
            
            function onCancel() {
                cleanUp();
                resolve(null);
            }
            
            replaceBtn.addEventListener('click', onReplace);
            separateBtn.addEventListener('click', onSeparate);
            cancelBtn.addEventListener('click', onCancel);
        });
    }

    let isSimulatingStorageFull = localStorage.getItem('simulate_storage_full') === 'true';
    let currentStorageUsagePercent = 0;

    async function updateStorageUsage() {
        const phone = currentUserPhone || 'anonymous';
        try {
            const res = await fetch(`/api/vault/storage?user_phone=${encodeURIComponent(phone)}`);
            const data = await res.json();
            
            const storageBtn = document.getElementById('sidebar-storage-btn');
            const storageDot = document.getElementById('sidebar-storage-dot');
            const billingBar = document.getElementById('billing-storage-bar');
            const billingText = document.getElementById('billing-storage-text');
            const billingPercent = document.getElementById('billing-storage-percent');
            const planBadge = document.getElementById('billing-current-plan-badge');
            
            let percent = data.percentage || 0;
            let usedText = `${data.used_formatted || '0 B'} of ${data.limit_formatted || '15 GB'}`;
            let activePercentText = `${(data.percentage || 0).toFixed(4)}% used`;
            let dotColor = '#22c55e'; // Green
            
            if (isSimulatingStorageFull) {
                percent = 100;
                usedText = "15.0 GB of 15.0 GB";
                activePercentText = "100% used (Simulated Full)";
                dotColor = '#ef4444'; // Red
                if (storageBtn) storageBtn.title = "Storage Full (15.0 GB of 15.0 GB used)";
            } else {
                if (percent >= 90) dotColor = '#ef4444'; // Red
                else if (percent >= 70) dotColor = '#f59e0b'; // Orange
                if (storageBtn) storageBtn.title = `Storage: ${usedText} (${percent.toFixed(2)}% used)`;
            }
            
            currentStorageUsagePercent = percent;
            
            if (storageDot) storageDot.style.backgroundColor = dotColor;
            if (billingBar) billingBar.style.width = `${percent}%`;
            if (billingText) billingText.innerText = usedText;
            if (billingPercent) billingPercent.innerText = activePercentText;
        } catch (err) {
            console.error("Error updating storage usage:", err);
        }
    }
    window.updateStorageUsage = updateStorageUsage;

    // Billing modal toggle and event setup
    const billingModal = document.getElementById('billing-modal');
    const simulateToggle = document.getElementById('simulate-full-toggle');
    const simulateToggleBg = document.getElementById('simulate-toggle-bg');
    const simulateToggleDot = document.getElementById('simulate-toggle-dot');
    
    function setSimulateToggleUI(active) {
        if (simulateToggle) simulateToggle.checked = active;
        if (simulateToggleBg && simulateToggleDot) {
            if (active) {
                simulateToggleBg.style.backgroundColor = 'var(--accent-color)';
                simulateToggleDot.style.left = '25px';
                simulateToggleDot.style.background = '#ffffff';
            } else {
                simulateToggleBg.style.backgroundColor = '#374151';
                simulateToggleDot.style.left = '3px';
                simulateToggleDot.style.background = '#9ca3af';
            }
        }
    }

    if (simulateToggle) {
        setSimulateToggleUI(isSimulatingStorageFull);
        simulateToggle.addEventListener('change', (e) => {
            isSimulatingStorageFull = e.target.checked;
            localStorage.setItem('simulate_storage_full', isSimulatingStorageFull ? 'true' : 'false');
            setSimulateToggleUI(isSimulatingStorageFull);
            updateStorageUsage();
        });
    }

    const storageBtn = document.getElementById('sidebar-storage-btn');
    if (storageBtn) {
        storageBtn.addEventListener('click', () => {
            if (billingModal) {
                updateStorageUsage();
                billingModal.style.display = 'flex';
            }
        });
    }

    const billingClose = document.getElementById('billing-modal-close');
    if (billingClose) {
        billingClose.addEventListener('click', () => {
            if (billingModal) billingModal.style.display = 'none';
        });
    }

    // Pro and business upgrade clicks
    const upgradeProBtn = document.getElementById('upgrade-pro-btn');
    const upgradeBizBtn = document.getElementById('upgrade-biz-btn');
    const planBadge = document.getElementById('billing-current-plan-badge');

    if (upgradeProBtn) {
        upgradeProBtn.addEventListener('click', () => {
            isSimulatingStorageFull = false;
            localStorage.setItem('simulate_storage_full', 'false');
            setSimulateToggleUI(false);
            
            if (planBadge) {
                planBadge.innerText = 'Pro Plan (100 GB)';
                planBadge.style.color = 'var(--accent-color)';
            }
            
            updateStorageUsage();
            showCustomAlert("Upgrade Success", "🎉 Thank you for upgrading to Pro Plan! Your storage capacity has been expanded to 100 GB.");
            if (billingModal) billingModal.style.display = 'none';
        });
    }

    if (upgradeBizBtn) {
        upgradeBizBtn.addEventListener('click', () => {
            isSimulatingStorageFull = false;
            localStorage.setItem('simulate_storage_full', 'false');
            setSimulateToggleUI(false);
            
            if (planBadge) {
                planBadge.innerText = 'Business Plan (2 TB)';
                planBadge.style.color = '#c084fc';
            }
            
            updateStorageUsage();
            showCustomAlert("Upgrade Success", "🚀 Thank you for upgrading to Business Plan! Your storage capacity has been expanded to 2 TB.");
            if (billingModal) billingModal.style.display = 'none';
        });
    }

    function showNewFolderModal() {
        return new Promise((resolve) => {
            const modal = document.getElementById('new-folder-modal');
            const input = document.getElementById('new-folder-input');
            const cancelBtn = document.getElementById('new-folder-modal-cancel');
            const confirmBtn = document.getElementById('new-folder-modal-submit');
            
            input.value = '';
            modal.style.display = 'flex';
            input.focus();
            
            function cleanUp() {
                modal.style.display = 'none';
                confirmBtn.removeEventListener('click', onSubmit);
                cancelBtn.removeEventListener('click', onCancel);
                input.removeEventListener('keypress', onKeyPress);
            }
            
            function onSubmit() {
                const val = input.value.trim();
                cleanUp();
                resolve(val);
            }
            
            function onCancel() {
                cleanUp();
                resolve(null);
            }
            
            function onKeyPress(e) {
                if (e.key === 'Enter') {
                    onSubmit();
                }
            }
            
            confirmBtn.addEventListener('click', onSubmit);
            cancelBtn.addEventListener('click', onCancel);
            input.addEventListener('keypress', onKeyPress);
        });
    }

    async function convertResultsToFolder(matchedIdsStr) {
        const folderName = await showNewFolderModal();
        if (!folderName) return;

        const memoryIds = matchedIdsStr.split(',');
        try {
            const response = await fetch('/api/vault/folders/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    memory_ids: memoryIds,
                    folder_name: folderName.trim()
                })
            });
            const result = await response.json();
            if (response.ok) {
                // Refresh local memories state
                if (window.loadMemories) window.loadMemories();
                if (window.loadFoldersView) window.loadFoldersView();

                // Append bot message confirmation directly in thread
                const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const botMsgId = `bot-reply-${Date.now()}`;
                const confirmationMsg = {
                    id: botMsgId,
                    role: 'assistant',
                    content: `📁 Created folder **'${folderName.trim()}'** containing ${memoryIds.length} documents. You can view it under the **Folders** tab!`,
                    timestamp: timeNow
                };
                
                // Add to messages and render
                chatMessages.push(confirmationMsg);
                renderChat();
            } else {
                alert(`Error creating folder: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error converting to folder:', error);
            alert('Failed to create folder.');
        }
    }
    window.convertResultsToFolder = convertResultsToFolder;

    function openFolder(folderName) {
        const showBusinessMode = modeToggle.checked;
        const docsList = groupedDocuments[folderName] || [];
        
        document.getElementById('folders-index-level').style.display = 'none';
        document.getElementById('folder-contents-level').style.display = 'block';
        
        document.getElementById('active-folder-name').innerText = folderName;
        document.getElementById('active-folder-count').innerText = docsList.length;
        
        const container = document.getElementById('folder-memories-container');
        if (docsList.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; width: 100%;">
                    <i class="fa-solid fa-folder-open"></i>
                    <p>No documents found in this folder.</p>
                </div>
            `;
        } else {
            container.innerHTML = docsList.map(m => buildMemoryCardHtml(m, showBusinessMode)).join('');
        }
    }
    window.openFolder = openFolder;

    /**
     * Category Icons Mapper
     */
    function getCategoryIcon(cat) {
        const icons = {
            "business_supplier_quote": "fa-file-invoice",
            "business_customer_complaint": "fa-triangle-exclamation",
            "business_order": "fa-box",
            "business_inventory_note": "fa-briefcase",
            "shopping_link": "fa-cart-shopping",
            "task_reminder": "fa-clock",
            "random_thought": "fa-lightbulb",
            "idea": "fa-brain",
            "contact_info": "fa-address-book",
            "document": "fa-file-lines",
            "other": "fa-note-sticky"
        };
        return icons[cat] || "fa-note-sticky";
    }

    /**
     * Format category names nicely for humans
     */
    function formatCategoryName(cat) {
        if (!cat) return "Other";
        return cat
            .replace("business_", "")
            .replace("_", " ")
            .split(" ")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    }

    function getCategoryColor(cat) {
        const colors = {
            "shopping_link": "rgba(99, 102, 241, 0.15)",
            "business_supplier_quote": "rgba(16, 185, 129, 0.15)",
            "business_customer_complaint": "rgba(239, 68, 68, 0.15)",
            "task_reminder": "rgba(245, 158, 11, 0.15)",
            "idea": "rgba(168, 85, 247, 0.15)",
            "contact_info": "rgba(6, 182, 212, 0.15)",
            "random_thought": "rgba(236, 72, 153, 0.15)",
            "other": "rgba(148, 163, 184, 0.15)",
            "business_order": "rgba(148, 163, 184, 0.15)",
            "business_inventory_note": "rgba(148, 163, 184, 0.15)",
            "document": "rgba(59, 130, 246, 0.15)"
        };
        return colors[cat] || "rgba(148, 163, 184, 0.15)";
    }
    
    function getCategoryTextColor(cat) {
        const colors = {
            "shopping_link": "#a5b4fc",
            "business_supplier_quote": "#6ee7b7",
            "business_customer_complaint": "#fca5a5",
            "task_reminder": "#fde047",
            "idea": "#d8b4fe",
            "contact_info": "#67e8f9",
            "random_thought": "#fbcfe8",
            "other": "#cbd5e1",
            "business_order": "#cbd5e1",
            "business_inventory_note": "#cbd5e1",
            "document": "#60a5fa"
        };
        return colors[cat] || "#cbd5e1";
    }

    function buildMemoryCardHtml(m, showBusinessMode) {
        const hasBeenEdited = m.entities && m.entities.updated_at;
        const formattedDate = hasBeenEdited 
            ? `Edited ${new Date(m.entities.updated_at).toLocaleString()}` 
            : new Date(m.created_at).toLocaleString();
        
        let entitiesHtml = '';
        if (m.entities) {
            if (m.entities.prices && m.entities.prices.length > 0) {
                entitiesHtml += m.entities.prices.map(p => `<span class="entity-badge price"><i class="fa-solid fa-tag"></i> ${p}</span>`).join(' ');
            }
            if (m.entities.phone_numbers && m.entities.phone_numbers.length > 0) {
                entitiesHtml += m.entities.phone_numbers.map(p => `<span class="entity-badge phone"><i class="fa-solid fa-phone"></i> ${p}</span>`).join(' ');
            }
            if (m.entities.urls && m.entities.urls.length > 0) {
                entitiesHtml += m.entities.urls.map(u => `<span class="entity-badge url"><i class="fa-solid fa-link"></i> ${u.substring(0, 20)}...</span>`).join(' ');
            }
        }
        
        if (m.due_date) {
            const dueDateObj = new Date(m.due_date);
            const isOverdue = dueDateObj <= new Date() && m.reminder_status === 'pending';
            const statusIcon = m.reminder_status === 'pending' ? 'fa-clock' : (m.reminder_status === 'done' ? 'fa-circle-check' : 'fa-circle-xmark');
            const badgeColor = isOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(251, 191, 36, 0.1)';
            const borderColor = isOverdue ? 'rgba(239, 68, 68, 0.3)' : 'rgba(251, 191, 36, 0.25)';
            const textColor = isOverdue ? '#f87171' : '#fbbf24';
            
            entitiesHtml += `
                <span class="entity-badge" style="background: ${badgeColor}; border: 1px solid ${borderColor}; color: ${textColor}; padding: 0.15rem 0.45rem; border-radius: 6px; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 0.25rem;">
                    <i class="fa-solid ${statusIcon}"></i> Due: ${dueDateObj.toLocaleString()} (${m.reminder_status})
                </span>
            `;
        }
        
        const categoryName = formatCategoryName(m.category);
        const bizClass = m.is_business_related ? 'business' : 'personal';
        const urgLabel = m.urgency && m.urgency !== 'none' ? `<span class="urgency-badge ${m.urgency}">${m.urgency.toUpperCase()}</span>` : '';
        const folderBadge = (m.category === 'document' && m.document_folder) ? `<span class="entity-badge folder" style="margin-left: 0.25rem; font-size: 0.65rem; padding: 0.15rem 0.45rem; border-radius: 6px;"><i class="fa-solid fa-folder"></i> ${escapeHtml(m.document_folder)}</span>` : '';
        
        const attachment = parseAttachment(m.content);
        let visualHtml = '';
        if (attachment && attachment.type === 'image') {
            visualHtml = `
                <div class="card-left-visual">
                    <img src="${attachment.data}" style="width: 100%; height: 100%; object-fit: cover; cursor: zoom-in;" onclick="window.openImageFullScreen('${attachment.data}')">
                </div>
            `;
        } else {
            const iconClass = getCategoryIcon(m.category);
            const bg = getCategoryColor(m.category);
            const textCol = getCategoryTextColor(m.category);
            visualHtml = `
                <div class="card-left-visual" style="background-color: ${bg}; color: ${textCol};">
                    <i class="fa-solid ${iconClass}"></i>
                </div>
            `;
        }
        
        const bodyContentHtml = attachment 
            ? renderAttachment(attachment) 
            : `<p>${m.content}</p>`;
        
        return `
            <div class="memory-card" data-category="${m.category}">
                ${visualHtml}
                
                <div class="card-middle-content">
                    <div class="card-meta-row">
                        <div class="card-meta-left">
                            <span class="card-type-badge ${bizClass} cat-${m.category}">${categoryName}</span>
                            ${folderBadge}
                            ${urgLabel}
                            ${m.language && m.language !== 'en' ? `<span class="language-badge" style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.25); color: #c084fc; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; padding: 0.15rem 0.45rem; border-radius: 6px; letter-spacing: 0.05em; display: inline-flex; align-items: center; justify-content: center; height: 20px; margin-left: 0.25rem;">${({"ta":"Tamil","hi":"Hindi","ml":"Malayalam","te":"Telugu","kn":"Kannada"}[m.language.toLowerCase()] || m.language.toUpperCase())}</span>` : ''}
                        </div>
                        <div class="card-meta-right">
                            <span>${formattedDate}</span>
                        </div>
                    </div>
                    
                    <div class="card-body-text">
                        ${bodyContentHtml}
                    </div>
                    
                    <div class="card-tags-row">
                        ${entitiesHtml}
                        ${(m.tags || []).map(t => `<span class="tag-badge">#${t}</span>`).join(' ')}
                    </div>
                </div>
                
                <div class="card-right-actions" style="display: flex; flex-direction: row; gap: 0.4rem; align-items: center;">
                    <button class="ghost-action-btn edit-btn" onclick="openEditModal('${m.id}')" title="Edit memory">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="ghost-action-btn delete-btn" onclick="deleteMemory('${m.id}')" title="Delete memory">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    async function renderMemories() {
        const showBusinessMode = modeToggle.checked;
        
        // Handle specialized grouping for Documents filter category tab
        if (currentCategoryFilter === 'document') {
            try {
                const response = await fetch(`/api/vault/documents?user_phone=${encodeURIComponent(currentUserPhone || 'anonymous')}&is_business=${showBusinessMode}`);
                const data = await response.json();
                const groupedDocs = data.documents || {};
                
                let totalCount = 0;
                Object.values(groupedDocs).forEach(list => {
                    totalCount += list.length;
                });
                
                memoryCountEl.innerText = `${totalCount} saved`;
                
                if (totalCount === 0) {
                    const modeName = showBusinessMode ? "Business" : "Personal";
                    memoriesContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fa-solid fa-folder-open"></i>
                            <p>No saved documents found for ${modeName} Mode.</p>
                        </div>
                    `;
                    return;
                }
                
                let html = '';
                const foldersOrder = ["Government & Legal", "Business & Finance", "Academic & Coursework", "Personal"];
                
                foldersOrder.forEach(folder => {
                    const docsList = groupedDocs[folder] || [];
                    if (docsList.length > 0) {
                        html += `
                            <div class="document-folder-section">
                                <div class="document-folder-header">
                                    <i class="fa-solid fa-folder-open" style="color: #60a5fa;"></i>
                                    ${folder}
                                    <span class="count-badge">${docsList.length}</span>
                                </div>
                                <div class="vault-cards-grid" style="display: grid; grid-template-columns: 1fr; gap: 1rem; width: 100%;">
                        `;
                        
                        html += docsList.map(m => {
                            return buildMemoryCardHtml(m, showBusinessMode);
                        }).join('');
                        
                        html += `
                                </div>
                            </div>
                        `;
                    }
                });
                
                memoriesContainer.innerHTML = html;
                return;
            } catch (err) {
                console.error("Error loading vault documents:", err);
            }
        }
        
        // Default category handling
        let filtered = [];
        if (currentCategoryFilter === 'due_today') {
            try {
                const response = await fetch(`/api/reminders/due?user_phone=${encodeURIComponent(currentUserPhone || 'anonymous')}`);
                const data = await response.json();
                filtered = data.reminders || [];
            } catch (err) {
                console.error("Error loading due today memories:", err);
                filtered = [];
            }
        } else {
            filtered = currentCategoryFilter === 'All' 
                ? allMemories 
                : allMemories.filter(m => m.category === currentCategoryFilter);
                
            filtered = filtered.filter(m => m.is_business_related === showBusinessMode);
        }
            
        memoryCountEl.innerText = `${filtered.length} saved`;
        
        if (filtered.length === 0) {
            const modeName = showBusinessMode ? "Business" : "Personal";
            memoriesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-folder-open"></i>
                    <p>No saved memories found in "${formatCategoryName(currentCategoryFilter)}" for ${modeName} Mode.</p>
                </div>
            `;
            return;
        }
        
        memoriesContainer.innerHTML = filtered.map(m => buildMemoryCardHtml(m, showBusinessMode)).join('');
    }

    /**
     * Handles manual search submission inside the Vault.
     */
    async function handleVaultSearch() {
        const query = vaultSearchInput.value.trim();
        if (!query) {
            loadMemories();
            return;
        }
        
        memoriesContainer.innerHTML = `
            <div class="loading-state">
                <i class="fa-solid fa-spinner fa-spin"></i> Searching memories semantically...
            </div>
        `;
        
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&user_phone=${encodeURIComponent(currentUserPhone || 'anonymous')}`);
            const data = await response.json();
            
            let results = data.results || [];
            
            // Sync search results into edit cache
            results.forEach(m => {
                memoryCache[m.id] = m;
            });
            
            // Apply business/personal filter to search results
            const showBusinessMode = modeToggle.checked;
            results = results.filter(m => m.is_business_related === showBusinessMode);
            
            memoryCountEl.innerText = `${results.length} matches`;
            
            if (results.length === 0) {
                const modeName = showBusinessMode ? "Business" : "Personal";
                memoriesContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-circle-question"></i>
                        <p>No matches found for "${query}" in ${modeName} Mode.</p>
                    </div>
                `;
                return;
            }
            
            memoriesContainer.innerHTML = results.map(m => {
                const hasBeenEdited = m.entities && m.entities.updated_at;
                const formattedDate = hasBeenEdited 
                    ? `Edited ${new Date(m.entities.updated_at).toLocaleString()}` 
                    : new Date(m.created_at).toLocaleString();
                const score = m.similarity ? Math.round(m.similarity * 100) : 0;
                
                let entitiesHtml = '';
                if (m.entities) {
                    if (m.entities.prices && m.entities.prices.length > 0) {
                        entitiesHtml += m.entities.prices.map(p => `<span class="entity-badge price"><i class="fa-solid fa-tag"></i> ${p}</span>`).join(' ');
                    }
                    if (m.entities.phone_numbers && m.entities.phone_numbers.length > 0) {
                        entitiesHtml += m.entities.phone_numbers.map(p => `<span class="entity-badge phone"><i class="fa-solid fa-phone"></i> ${p}</span>`).join(' ');
                    }
                }
                
                const categoryName = formatCategoryName(m.category);
                const bizClass = m.is_business_related ? 'business' : 'personal';
                const urgLabel = m.urgency && m.urgency !== 'none' ? `<span class="urgency-badge ${m.urgency}">${m.urgency.toUpperCase()}</span>` : '';
                
                return `
                    <div class="memory-card" data-category="${m.category}">
                        <div class="card-header">
                            <div class="card-title">
                                <span class="card-type-badge ${bizClass} cat-${m.category}">${categoryName}</span>
                                ${m.language && m.language !== 'en' ? `<span class="language-badge" style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.25); color: #c084fc; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; padding: 0.15rem 0.45rem; border-radius: 6px; letter-spacing: 0.05em; display: inline-flex; align-items: center; justify-content: center; height: 20px; margin-left: 0.25rem;">${({"ta":"Tamil","hi":"Hindi","ml":"Malayalam","te":"Telugu","kn":"Kannada"}[m.language.toLowerCase()] || m.language.toUpperCase())}</span>` : ''}
                            </div>
                            <div class="card-meta">
                                <span class="badge" style="background: rgba(255, 255, 255, 0.08); color: var(--accent-color); padding: 2px 6px; font-weight: 700; border-radius: 4px; font-size: 0.62rem;">${score}% Match</span>
                                ${urgLabel}
                                <span>${formattedDate}</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <p>${m.content}</p>
                        </div>
                        <div class="card-footer">
                            <div class="card-entities-tags">
                                ${entitiesHtml}
                                ${(m.tags || []).map(t => `<span class="tag-badge">#${t}</span>`).join(' ')}
                            </div>
                            <div class="card-actions">
                                <button class="card-action-btn edit-btn" onclick="openEditModal('${m.id}')">
                                    <i class="fa-solid fa-pen-to-square"></i> Edit
                                </button>
                                <button class="card-action-btn delete-btn" onclick="deleteMemory('${m.id}')">
                                    <i class="fa-solid fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Search error:', error);
            memoriesContainer.innerHTML = `<div class="empty-state text-danger"><p>Search operation failed.</p></div>`;
        }
    }

    /**
     * Centralized Chat Renderer
     * Renders chat bubbles from the `chatMessages` array.
     */
    /**
     * Centralized Chat Renderer
     * Renders chat bubbles from the `chatMessages` array.
     */
    function renderChat() {
        chatMessagesThread.innerHTML = '';
        
        if (chatMessages.length === 0) {
            const welcome = document.createElement('div');
            welcome.className = 'welcome-container';
            welcome.style = "display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; margin: auto; max-width: 480px; padding: 1.5rem 1rem; gap: 1rem; overflow: visible;";
            welcome.innerHTML = `
                <div class="welcome-logo" style="width: 56px; height: 56px; background-color: #ffffff; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: #111318; box-shadow: 0 8px 24px rgba(0,0,0,0.15); flex-shrink: 0;">
                    <i class="fa-solid fa-brain"></i>
                </div>
                <div class="welcome-greeting" style="font-size: 0.88rem; font-weight: 600; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.5rem;">Hi, Leharin</div>
                <h1 class="welcome-headline" style="font-family: 'League Spartan', sans-serif; font-size: 2.2rem; font-weight: 800; color: #ffffff; line-height: 1.1; margin: 0;">What are you dropping in today?</h1>
                <p class="welcome-subtext" style="font-size: 0.88rem; color: #8B8F9C; line-height: 1.5; margin: 0;">MemoDrop auto-categorizes your unorganized text, links, and documents instantly.</p>
                
                <!-- Quick Demo Scenario Pills -->
                <div class="welcome-scenarios" style="display: flex; flex-direction: column; gap: 0.6rem; width: 100%; margin-top: 1.25rem; align-items: center;">
                    <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Try these examples:</span>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; max-width: 440px;">
                        <button type="button" class="pill-btn" data-text="Fabric Supplier offered cotton roll at Rs 120 per meter. Contact: 9876543210." style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 0.45rem 0.85rem; font-size: 0.75rem; color: var(--text-secondary); cursor: pointer; transition: all 0.15s; font-family: inherit; font-weight: 500;">
                            <i class="fa-solid fa-cloud-arrow-up" style="color: #6ee7b7; margin-right: 0.35rem;"></i> Save cotton roll quote
                        </button>
                        <button type="button" class="pill-btn" data-text="Verify Ramesh Fabrics quote" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 0.45rem 0.85rem; font-size: 0.75rem; color: var(--text-secondary); cursor: pointer; transition: all 0.15s; font-family: inherit; font-weight: 500;">
                            <i class="fa-solid fa-magnifying-glass" style="color: #60a5fa; margin-right: 0.35rem;"></i> Verify Ramesh Fabrics quote
                        </button>
                        <button type="button" class="pill-btn" data-text="what was the cotton roll quote?" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 0.45rem 0.85rem; font-size: 0.75rem; color: var(--text-secondary); cursor: pointer; transition: all 0.15s; font-family: inherit; font-weight: 500;">
                            <i class="fa-solid fa-magnifying-glass" style="color: #fde047; margin-right: 0.35rem;"></i> Find cotton roll quote
                        </button>
                    </div>
                </div>
            `;
            chatMessagesThread.appendChild(welcome);

            // Bind click events to dynamically generated scenario buttons
            welcome.querySelectorAll('.pill-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const text = btn.getAttribute('data-text');
                    chatInput.value = text;
                    chatInput.dispatchEvent(new Event('input'));
                    handleSendMessage();
                });
            });
            return;
        }
        
        // Day Divider
        const divider = document.createElement('div');
        divider.className = 'day-divider';
        divider.innerText = 'Today';
        chatMessagesThread.appendChild(divider);
        
        chatMessages.forEach(msg => {
            const bubble = document.createElement('div');
            const isUser = msg.role === 'user';
            bubble.className = `chat-bubble ${isUser ? 'user-msg' : 'bot-reply'}`;
            bubble.setAttribute('data-id', msg.id);
            
            // Inline textarea layout if currently editing
            if (isUser && msg.isEditing) {
                bubble.innerHTML = `
                    <div class="inline-edit-container" style="width: 100%; display: flex; flex-direction: column; margin-top: 0.2rem;">
                        <textarea class="edit-msg-textarea" style="width: 100%; min-height: 70px; border: 1.5px solid #ffffff; border-radius: 6px; padding: 0.5rem; font-family: inherit; font-size: 0.88rem; outline: none; resize: vertical; background: rgba(255, 255, 255, 0.15); color: #ffffff; margin-bottom: 0.5rem; line-height: 1.4;">${msg.content}</textarea>
                        <div class="inline-edit-actions" style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                            <button class="inline-btn inline-cancel-btn" onclick="window.cancelInlineEdit('${msg.id}')" style="background: transparent; border: 1.5px solid #ffffff; color: #ffffff; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.72rem; cursor: pointer; font-weight: 700; transition: background 0.1s;">Cancel</button>
                            <button class="inline-btn inline-submit-btn" onclick="window.submitInlineEdit('${msg.id}')" style="background: #ffffff; color: var(--border-dark); border: none; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.72rem; cursor: pointer; font-weight: 700; transition: transform 0.1s;">Save & Submit</button>
                        </div>
                    </div>
                `;
                chatMessagesThread.appendChild(bubble);
                return;
            }
            
            if (msg.role === 'bot') {
                let headerHtml = '';
                let bodyHtml = '';
                
                const isDump = msg.category;
                
                if (isDump) {
                    const categoryName = formatCategoryName(msg.category);
                    const bizClass = msg.is_business_related ? 'business' : 'personal';
                    const urgLabel = msg.urgency && msg.urgency !== 'none' ? `<span class="urgency-badge ${msg.urgency}">${msg.urgency.toUpperCase()}</span>` : '';
                    headerHtml = `
                        <div class="bot-header" style="margin: 0; padding: 0; display: flex; align-items: center; gap: 0.5rem;">
                            <span class="card-type-badge ${bizClass} cat-${msg.category}">${categoryName}</span>
                            ${urgLabel}
                        </div>
                    `;
                    bodyHtml = `<p>${formatMessageMarkdown(msg.content)}</p>`;
                } else if (msg.search_results && msg.search_results.length > 0) {
                    // Query search header
                    headerHtml = `
                        <div class="recall-header" style="display: flex; align-items: flex-start; gap: 0.5rem; margin: 0; padding: 0;">
                            <div class="recall-icon" style="color: #64748b; margin-top: 0.15rem; display: flex; align-items: center; justify-content: center;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            <div class="recall-title-container" style="display: flex; flex-direction: column; gap: 0.05rem;">
                                <span class="recall-eyebrow" style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; line-height: 1;">Recall Result</span>
                                <span class="recall-subtext" style="font-size: 0.75rem; color: #94a3b8; line-height: 1.2;">Found ${msg.search_results.length} matching memor${msg.search_results.length === 1 ? 'y' : 'ies'}</span>
                            </div>
                        </div>
                    `;
                    bodyHtml = ''; // Replaced by custom header & embeds
                } else if (msg.search_results) {
                    // Query search empty state
                    headerHtml = `
                        <div class="recall-header" style="display: flex; align-items: flex-start; gap: 0.5rem; margin: 0; padding: 0;">
                            <div class="recall-icon" style="color: #ef4444; margin-top: 0.15rem; display: flex; align-items: center; justify-content: center;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            <div class="recall-title-container" style="display: flex; flex-direction: column; gap: 0.05rem;">
                                <span class="recall-eyebrow" style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #ef4444; line-height: 1;">Recall Result</span>
                                <span class="recall-subtext" style="font-size: 0.75rem; color: #ef4444; line-height: 1.2;">No matching memories found</span>
                            </div>
                        </div>
                    `;
                    bodyHtml = `<p>${formatMessageMarkdown(msg.content)}</p>`;
                } else {
                    bodyHtml = `<p>${formatMessageMarkdown(msg.content)}</p>`;
                }
                
                // Render embedded cards
                if (msg.search_results && msg.search_results.length > 0) {
                    msg.search_results.forEach(match => {
                        const matchCategory = formatCategoryName(match.category);
                        const bestBizClass = match.is_business_related ? 'business' : 'personal';
                        const bestTime = new Date(match.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const isEditedMatch = match.entities && match.entities.updated_at;
                        const displayTime = isEditedMatch ? `Edited ${bestTime}` : bestTime;
                        
                        let cleanContent = match.content;
                        if (cleanContent.startsWith('"') && cleanContent.endsWith('"')) {
                            cleanContent = cleanContent.slice(1, -1);
                        }
                        
                        bodyHtml += `
                            <div class="chat-embedded-card" data-id="${match.id}" style="position: relative; padding: 1.15rem; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; background: var(--bg-card); box-shadow: 0 4px 16px rgba(0,0,0,0.15); margin-top: 0.85rem; display: flex; flex-direction: column; gap: 0.6rem;">
                                <div class="emb-card-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%; border: none; padding: 0; margin-bottom: 0.1rem; position: relative;">
                                    <div>
                                        <span class="card-type-badge ${bestBizClass} cat-${match.category}">${matchCategory}</span>
                                        ${match.language && match.language !== 'en' ? `<span class="language-badge" style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.25); color: #c084fc; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; padding: 0.15rem 0.45rem; border-radius: 6px; letter-spacing: 0.05em; display: inline-flex; align-items: center; justify-content: center; height: 20px; margin-left: 0.25rem;">${({"ta":"Tamil","hi":"Hindi","ml":"Malayalam","te":"Telugu","kn":"Kannada"}[match.language.toLowerCase()] || match.language.toUpperCase())}</span>` : ''}
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                                        <span class="emb-time" style="font-size: 0.65rem; color: #94a3b8; font-weight: 500;">${displayTime}</span>
                                        <div class="card-hover-actions" style="display: flex; gap: 0.2rem;">
                                            <button class="ghost-action-btn edit-btn" onclick="window.openEditModal('${match.id}')" title="Edit memory">
                                                <i class="fa-solid fa-pen-to-square"></i>
                                            </button>
                                            <button class="ghost-action-btn delete-btn" onclick="window.deleteMemory('${match.id}')" title="Delete memory">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="emb-body" style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.45; font-style: normal; margin: 0; padding: 0;">
                                    ${(() => {
                                        const attachment = parseAttachment(cleanContent);
                                        if (attachment) {
                                            return renderAttachment(attachment);
                                        } else {
                                            return `<p>${formatMessageMarkdown(cleanContent)}</p>`;
                                        }
                                    })()}
                                </div>
                            </div>
                        `;
                    });
                }
                
                // Append Convert to Folder action if we have multiple search results
                if (msg.search_results && msg.search_results.length > 1) {
                    const matchedIds = msg.search_results.map(r => r.id).join(',');
                    bodyHtml += `
                        <div style="margin-top: 0.85rem; display: flex; justify-content: flex-end;">
                            <button class="primary-btn" onclick="window.convertResultsToFolder('${matchedIds}')" style="padding: 0.4rem 0.85rem; font-size: 0.75rem; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; background-color: var(--primary-color); border: none; color: #fff; transition: opacity 0.15s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
                                <i class="fa-solid fa-folder-plus"></i> Convert to Folder
                            </button>
                        </div>
                    `;
                }
                
                // Edit metadata button inside bot replies
                let editActionHtml = '';
                if (isDump) {
                    editActionHtml = `
                        <button class="ghost-action-btn edit-btn" onclick="window.openEditModal('${msg.id}')" title="Edit metadata">
                            <i class="fa-regular fa-pen-to-square"></i>
                        </button>
                    `;
                }
                
                let comparisonTableHtml = '';
                if (msg.comparison_table && msg.comparison_table.length > 0) {
                    let minPriceVal = Infinity;
                    let cheapestIndex = -1;
                    msg.comparison_table.forEach((row, idx) => {
                        const digits = String(row.price || '').match(/\d+/);
                        if (digits) {
                            const val = parseFloat(digits[0]);
                            if (val < minPriceVal) {
                                minPriceVal = val;
                                cheapestIndex = idx;
                            }
                        }
                    });

                    const rowsHtml = msg.comparison_table.map((row, idx) => {
                        const isCheapest = idx === cheapestIndex;
                        const highlightClass = isCheapest ? 'class="cheapest-highlight"' : '';
                        const checkIcon = isCheapest ? '<i class="fa-solid fa-circle-check" style="margin-right: 0.25rem;"></i> ' : '';
                        
                        return `
                            <tr>
                                <td class="supplier-cell">${escapeHtml(String(row.supplier || ''))}</td>
                                <td>${escapeHtml(String(row.item || ''))}</td>
                                <td ${highlightClass}>${checkIcon}${escapeHtml(String(row.price || ''))}</td>
                                <td>${escapeHtml(String(row.date || ''))}</td>
                            </tr>
                        `;
                    }).join('');

                    comparisonTableHtml = `
                        <div class="comparison-table-wrapper">
                            <table class="comparison-table">
                                <thead>
                                    <tr>
                                        <th>Supplier</th>
                                        <th>Item</th>
                                        <th>Price</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rowsHtml}
                                </tbody>
                            </table>
                        </div>
                    `;
                }
                
                bubble.innerHTML = `
                    <div style="position: relative; width: 100%; display: flex; flex-direction: column; gap: 0.65rem;">
                        <div class="bot-bubble-top-row" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <div>
                                ${headerHtml}
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.65rem; flex-shrink: 0; margin-left: 1.5rem;">
                                <span class="msg-time" style="font-size: 0.65rem; color: #94a3b8; font-weight: 500; margin: 0;">${msg.timestamp}</span>
                                <div class="bubble-hover-actions" style="display: flex; gap: 0.2rem;">
                                    <button class="ghost-action-btn copy-btn" onclick="window.copyMessage(this)" title="Copy text">
                                        <i class="fa-regular fa-copy"></i>
                                    </button>
                                    ${editActionHtml}
                                    <button class="ghost-action-btn delete-btn" onclick="window.deleteChatMessage('${msg.id}')" title="Delete message">
                                        <i class="fa-regular fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="bot-body-content" style="font-size: 0.88rem; color: var(--text-primary); line-height: 1.5;">
                            ${bodyHtml}
                            ${comparisonTableHtml}
                        </div>
                    </div>
                `;
            } else {
                // User bubble
                let bodyHtml = '';
                const attachment = parseAttachment(msg.content);
                if (attachment) {
                    bodyHtml = renderAttachment(attachment);
                } else {
                    bodyHtml = `<p>${formatMessageMarkdown(msg.content)}</p>`;
                }
                const actionsHtml = `
                    <div class="msg-footer">
                        <span class="msg-time">${msg.timestamp}</span>
                        <div class="msg-actions">
                            <button class="msg-action-btn copy-btn" onclick="window.copyMessage(this)" title="Copy text">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                            <button class="msg-action-btn edit-btn" onclick="window.editMessage('${msg.id}')" title="Edit message">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button class="msg-action-btn delete-btn" onclick="window.deleteChatMessage('${msg.id}')" title="Delete message">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                `;
                bubble.innerHTML = `${bodyHtml}${actionsHtml}`;
            }
            
            chatMessagesThread.appendChild(bubble);
        });
        
        chatMessagesThread.scrollTop = chatMessagesThread.scrollHeight;
    }

    /**
     * Sends a message to the FastAPI simulation endpoint and processes response.
     */
    async function handleSendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        
        const isDump = currentComposerMode !== 'ask' || text.startsWith('[Document Attachment]') || text.startsWith('[Image Attachment]') || text.startsWith('[Location Attachment]') || text.startsWith('[Contact Attachment]');
        if (isDump && currentStorageUsagePercent >= 100) {
            showCustomAlert("Storage Full", "⚠️ Your storage space is 100% full! Please upgrade your plan or delete some memories to continue saving new ones.");
            if (billingModal) {
                updateStorageUsage();
                billingModal.style.display = 'flex';
            }
            return;
        }
        
        chatInput.value = '';
        
        const userMsgId = `user-msg-${Date.now()}`;
        const botReplyId = `bot-reply-${Date.now()}`;
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Push user message to state
        const userMsg = {
            id: userMsgId,
            role: 'user',
            content: text,
            timestamp: timeNow,
            linkedReplyId: botReplyId
        };
        chatMessages.push(userMsg);
        
        // Push loading bot reply placeholder
        const botReply = {
            id: botReplyId,
            role: 'bot',
            content: "Thinking...",
            timestamp: timeNow
        };
        chatMessages.push(botReply);
        
        renderChat();
        
        try {
            let response;
            let isCompare = false;
            let data;
            
            if (currentComposerMode === 'ask' && modeToggle.checked) {
                try {
                    const compResponse = await fetch('/api/quotes/compare', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            query: text,
                            user_phone: currentUserPhone
                        })
                    });
                    if (compResponse.ok) {
                        const compData = await compResponse.json();
                        if (compData.status === 'success' && compData.table_data && compData.table_data.length > 0) {
                            isCompare = true;
                            data = compData;
                        }
                    }
                } catch (compErr) {
                    console.warn("Quote comparison first-attempt error:", compErr);
                }
            }
            
            if (!isCompare) {
                response = await fetch('/api/send-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: text,
                        media_type: "text",
                        intent: currentComposerMode === 'ask' ? 'query' : 'dump',
                        is_business_related: modeToggle.checked,
                        user_phone: currentUserPhone
                    })
                });
                data = await response.json();
                
                if (data.status === 'duplicate_detected') {
                    // Remove the bot loading reply from chat messages thread temporarily
                    chatMessages = chatMessages.filter(m => m.id !== botReplyId);
                    renderChat();
                    
                    // Open duplicate resolution modal
                    const choice = await showDuplicateModal(data.existing_memory.summary);
                    
                    if (choice === 'replace') {
                        botReply.content = "Overwriting existing memory...";
                        chatMessages.push(botReply);
                        renderChat();
                        
                        const updateRes = await fetch(`/api/memories/${data.existing_memory.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                content: data.new_memory_data.content,
                                summary: data.new_memory_data.summary,
                                category: data.new_memory_data.category,
                                urgency: data.new_memory_data.urgency,
                                is_business_related: data.new_memory_data.is_business_related,
                                tags: data.new_memory_data.tags,
                                language: data.new_memory_data.language,
                                due_date: data.new_memory_data.due_date,
                                reminder_status: data.new_memory_data.reminder_status
                            })
                        });
                        const updateData = await updateRes.json();
                        if (updateRes.ok) {
                            botReply.content = `🔄 *Replaced existing memory!* Modified **'${data.existing_memory.summary}'** with new contents.`;
                            memoryCache[data.existing_memory.id] = {
                                ...data.new_memory_data,
                                id: data.existing_memory.id,
                                created_at: new Date().toISOString()
                            };
                            refreshAllViews();
                        } else {
                            botReply.content = `⚠️ Failed to replace memory: ${updateData.message || 'Unknown error'}`;
                        }
                    } else if (choice === 'separate') {
                        botReply.content = "Saving as separate entry...";
                        chatMessages.push(botReply);
                        renderChat();
                        
                        const resaveRes = await fetch('/api/send-message', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                message: text,
                                media_type: "text",
                                intent: 'dump',
                                is_business_related: modeToggle.checked,
                                user_phone: currentUserPhone,
                                force_save: true
                            })
                        });
                        data = await resaveRes.json();
                        
                        let finalId = userMsgId;
                        if (data.intent === 'dump' && data.extracted && data.extracted.id) {
                            finalId = data.extracted.id;
                            userMsg.id = finalId;
                            userMsg.linkedReplyId = finalId;
                            
                            memoryCache[finalId] = {
                                id: finalId,
                                content: text,
                                summary: data.extracted.summary,
                                category: data.extracted.category,
                                urgency: data.extracted.urgency,
                                is_business_related: data.extracted.is_business_related,
                                tags: data.extracted.tags,
                                created_at: new Date().toISOString()
                            };
                        }
                        botReply.content = data.response;
                        botReply.id = finalId;
                        botReply.category = data.extracted.category;
                        botReply.summary = data.extracted.summary;
                        botReply.urgency = data.extracted.urgency;
                        botReply.tags = data.extracted.tags;
                        botReply.is_business_related = data.extracted.is_business_related;
                        refreshAllViews();
                    } else {
                        botReply.content = "❌ Discarded duplicate save operation.";
                        chatMessages.push(botReply);
                    }
                    
                    renderChat();
                    isManualModeOverride = false;
                    return; // Stop further execution
                }
            }
            
            if (isCompare) {
                botReply.content = data.comparison_summary || "No comparison summary generated.";
                botReply.comparison_table = data.table_data || [];
                botReply.id = botReplyId;
                botReply.search_results = [];
                setComposerMode('ask');
            } else {
                // If it was a dump, link generated database ID
                let finalId = userMsgId;
                if (data.intent === 'dump' && data.extracted && data.extracted.id) {
                    finalId = data.extracted.id;
                    userMsg.id = finalId;
                    userMsg.linkedReplyId = finalId;
                    
                    // Cache locally
                    memoryCache[finalId] = {
                        id: finalId,
                        content: text,
                        summary: data.extracted.summary,
                        category: data.extracted.category,
                        urgency: data.extracted.urgency,
                        is_business_related: data.extracted.is_business_related,
                        tags: data.extracted.tags,
                        created_at: new Date().toISOString()
                    };
                }
                
                // Update bot reply state in-place
                botReply.content = data.response;
                if (data.intent === 'dump') {
                    const ext = data.extracted;
                    botReply.id = finalId;
                    botReply.category = ext.category;
                    botReply.summary = ext.summary;
                    botReply.urgency = ext.urgency;
                    botReply.tags = ext.tags;
                    botReply.is_business_related = ext.is_business_related;
                    setComposerMode('save');
                } else {
                    botReply.id = botReplyId; // Keep dynamic ID for query replies
                    botReply.search_results = data.search_results || [];
                    setComposerMode('ask');
                }
            }
            
            renderChat();
            loadMemories(); // Refresh memory list
            isManualModeOverride = false;
            
        } catch (error) {
            console.error('Error sending message:', error);
            botReply.content = "⚠️ Sorry, the MemoDrop service encountered an error processing your request.";
            renderChat();
            isManualModeOverride = false;
        }
    }

    /**
     * Updates any matching chat bubbles in the state array
     * when a memory is edited.
     */
    function updateChatBubblesForMemory(memory) {
        if (!memory) return;
        
        let updatedAny = false;
        const timeEdit = `Edited ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
        chatMessages.forEach(msg => {
            // Update bot confirmation bubble fields
            if (msg.id === memory.id && msg.role === 'bot') {
                msg.category = memory.category;
                msg.summary = memory.summary;
                msg.urgency = memory.urgency;
                msg.tags = memory.tags;
                msg.is_business_related = memory.is_business_related;
                msg.content = `📥 *Saved to MemoDrop!*\n\n*Summary:* ${memory.summary}\n*Tags:* ${(memory.tags || []).map(t => `#${t}`).join(' ')}`;
                msg.timestamp = timeEdit;
                updatedAny = true;
            }
            // Update user bubble if matched
            else if (msg.id === memory.id && msg.role === 'user') {
                msg.content = memory.content;
                updatedAny = true;
            }
            // Update embedded match card inside bot search reply
            else if (msg.role === 'bot' && msg.search_results && msg.search_results.length > 0) {
                msg.search_results.forEach(match => {
                    if (match.id === memory.id) {
                        match.category = memory.category;
                        match.content = memory.content;
                        match.is_business_related = memory.is_business_related;
                        // Inject modification time
                        match.entities = match.entities || {};
                        match.entities.updated_at = new Date().toISOString();
                        updatedAny = true;
                    }
                });
            }
        });
        
        if (updatedAny) {
            renderChat();
        }
    }

    /**
     * Helper to parse bold, italics, links, and newlines.
     */
    function formatMessageMarkdown(text) {
        let html = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
            
        html = html.replace(/\\n/g, '\n');
        html = html.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
        html = html.replace(/\n/g, '<br>');
        
        const urlRegex = /(https?:\/\/[^\s<]+)/g;
        html = html.replace(urlRegex, '<a href="$1" target="_blank" class="link-chip"><i class="fa-solid fa-link" style="font-size: 0.7rem; margin-right: 0.3rem;"></i>$1</a>');
        
        return html;
    }

    // --- Global Window Bindings for Inline onclick Attributes ---

    /**
     * Open the Edit Modal when clicking on any memory card in the Vault
     */
    window.openEditModal = function(memoryId) {
        const memory = memoryCache[memoryId];
        if (!memory) return;
        
        document.getElementById('edit-memory-id').value = memory.id;
        document.getElementById('edit-content').value = memory.content;
        document.getElementById('edit-summary').value = memory.summary || '';
        document.getElementById('edit-category').value = memory.category;
        document.getElementById('edit-urgency').value = memory.urgency || 'none';
        document.getElementById('edit-business-toggle').checked = memory.is_business_related;
        document.getElementById('edit-tags').value = (memory.tags || []).join(', ');
        
        // Display flex to center the card
        document.getElementById('edit-modal').style.display = 'flex';
    };

    /**
     * Delete a memory permanently from the Vault grid.
     */
    window.deleteMemory = function(memoryId) {
        showCustomConfirm({
            title: 'Delete Memory?',
            message: 'Are you sure you want to delete this memory permanently?',
            confirmText: 'Delete',
            isDanger: true,
            onConfirm: async () => {
                try {
                    const response = await fetch(`/api/memories/${memoryId}`, {
                        method: 'DELETE'
                    });
                    const data = await response.json();
                    
                    if (data.status === 'success') {
                        delete memoryCache[memoryId];
                        
                        // Remove corresponding user & bot messages from chat thread state array
                        const userMsg = chatMessages.find(m => m.id === memoryId);
                        const linkedId = userMsg ? userMsg.linkedReplyId : null;
                        chatMessages = chatMessages.filter(m => m.id !== memoryId && m.id !== linkedId);
                        
                        renderChat();
                        refreshAllViews();
                    } else {
                        showCustomAlert('Delete Failed', 'Failed to delete memory: ' + data.message);
                    }
                } catch (error) {
                    console.error('Error deleting memory:', error);
                    showCustomAlert('Database Error', 'Error connecting to database to delete memory.');
                }
            }
        });
    };

    /**
     * Copy message text to clipboard.
     */
    window.copyMessage = function(btn) {
        const bubble = btn.closest('.chat-bubble');
        const p = bubble.querySelector('p');
        if (!p) return;
        
        navigator.clipboard.writeText(p.innerText).then(() => {
            // Swap icon temporarily to checkmark for visual feedback
            const icon = btn.querySelector('i');
            icon.className = 'fa-solid fa-check';
            setTimeout(() => {
                icon.className = 'fa-regular fa-copy';
            }, 1500);
        });
    };

    /**
     * Edit user message bubble inline (ChatGPT/Claude/Gemini style)
     */
    window.editMessage = function(id) {
        const msg = chatMessages.find(m => m.id === id);
        if (!msg) return;
        
        // Set editing state and re-render
        msg.isEditing = true;
        renderChat();
        
        // Focus the editor
        const ta = document.querySelector(`.chat-bubble[data-id="${id}"] .edit-msg-textarea`);
        if (ta) {
            ta.focus();
            ta.setSelectionRange(ta.value.length, ta.value.length);
        }
    };

    /**
     * Cancel the inline edit and restore original bubble contents
     */
    window.cancelInlineEdit = function(id) {
        const msg = chatMessages.find(m => m.id === id);
        if (msg) {
            msg.isEditing = false;
            renderChat();
        }
    };

    /**
     * Submit inline edits to re-process and regenerate bot response in-place
     */
    window.submitInlineEdit = function(id) {
        const userMsgIndex = chatMessages.findIndex(m => m.id === id);
        if (userMsgIndex === -1) return;
        
        const userMsg = chatMessages[userMsgIndex];
        const ta = document.querySelector(`.chat-bubble[data-id="${id}"] .edit-msg-textarea`);
        if (!ta) return;
        
        const newText = ta.value.trim();
        if (!newText) return;
        
        // 1. Update user message content and close editor
        userMsg.content = newText;
        userMsg.isEditing = false;
        
        // 2. Find linked bot reply
        let botReply = chatMessages.find(m => m.id === userMsg.linkedReplyId);
        
        if (botReply) {
            // Update bot reply in state to loading
            botReply.content = "Regenerating reply...";
            botReply.category = null;
            botReply.urgency = null;
            botReply.tags = null;
            botReply.summary = null;
            botReply.is_business_related = false;
            botReply.search_results = null;
        } else {
            // Create loading placeholder if missing
            const botReplyId = userMsg.linkedReplyId || `bot-reply-${Date.now()}`;
            userMsg.linkedReplyId = botReplyId;
            botReply = {
                id: botReplyId,
                role: 'bot',
                content: "Regenerating reply...",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            chatMessages.splice(userMsgIndex + 1, 0, botReply);
        }
        
        // 3. Discard all subsequent messages in array state
        const botReplyIndex = chatMessages.findIndex(m => m.id === userMsg.linkedReplyId);
        chatMessages = chatMessages.slice(0, botReplyIndex + 1);
        
        // Re-render immediate layout change
        renderChat();
        
        // Check if this was a database memory (e.g. Saree Link mock, Supplier Quote mock, or regular UUID)
        const isDbMemory = (id.startsWith('1111') || id.startsWith('2222') || id.startsWith('3333') || (!id.includes('-user') && !id.includes('query')));
        const updateMemoryId = isDbMemory ? id : null;
        
        // 4. Hit API simulator
        fetch('/api/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: newText,
                media_type: "text",
                update_memory_id: updateMemoryId,
                is_business_related: modeToggle.checked,
                user_phone: currentUserPhone
            })
        })
        .then(r => r.json())
        .then(data => {
            let finalId = id;
            
            // If re-classification outputs a dump, update cache and ID references
            if (data.intent === 'dump' && data.extracted && data.extracted.id) {
                finalId = data.extracted.id;
                userMsg.id = finalId;
                userMsg.linkedReplyId = finalId;
                botReply.id = finalId;
                
                memoryCache[finalId] = {
                    id: finalId,
                    content: newText,
                    summary: data.extracted.summary,
                    category: data.extracted.category,
                    urgency: data.extracted.urgency,
                    is_business_related: data.extracted.is_business_related,
                    tags: data.extracted.tags,
                    created_at: new Date().toISOString()
                };
            } else {
                botReply.id = `bot-reply-${Date.now()}`;
                userMsg.linkedReplyId = botReply.id;
            }
            
            // 5. Update the bot reply object in place
            botReply.content = data.response;
            botReply.timestamp = `Edited ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            
            if (data.intent === 'dump') {
                const ext = data.extracted;
                botReply.category = ext.category;
                botReply.summary = ext.summary;
                botReply.urgency = ext.urgency;
                botReply.tags = ext.tags;
                botReply.is_business_related = ext.is_business_related;
            } else {
                botReply.category = null;
                botReply.summary = null;
                botReply.urgency = null;
                botReply.tags = null;
                botReply.is_business_related = false;
                botReply.search_results = data.search_results || [];
            }
            
            // Re-render final states
            renderChat();
            loadMemories();
        })
        .catch(error => {
            console.error('Error submitting inline edit:', error);
            botReply.content = "⚠️ Error regenerating reply. Please try again.";
            renderChat();
        });
    };

    /**
     * Deletes a chat message bubble from state and database (if it has a database ID)
     */
    window.deleteChatMessage = function(id) {
        const msg = chatMessages.find(m => m.id === id);
        if (!msg) return;
        
        const isDbMemory = (id.startsWith('1111') || id.startsWith('2222') || id.startsWith('3333') || (!id.includes('-user') && !id.includes('query')));
        
        const performDelete = async () => {
            if (isDbMemory) {
                try {
                    const response = await fetch(`/api/memories/${id}`, {
                        method: 'DELETE'
                    });
                    const data = await response.json();
                    if (data.status === 'success') {
                        delete memoryCache[id];
                    } else {
                        showCustomAlert('Delete Failed', 'Failed to delete memory: ' + data.message);
                        return;
                    }
                } catch (error) {
                    console.error('Error deleting memory:', error);
                    showCustomAlert('Database Error', 'Error connecting to database to delete memory.');
                    return;
                }
            }
            
            // Remove both the user message and its linked reply from state array
            const linkedId = msg.linkedReplyId || (chatMessages.find(m => m.linkedReplyId === id)?.id);
            chatMessages = chatMessages.filter(m => m.id !== id && m.id !== linkedId);
            
            renderChat();
            refreshAllViews();
        };

        if (isDbMemory) {
            showCustomConfirm({
                title: 'Delete Memory?',
                message: 'Are you sure you want to delete this memory permanently from the database?',
                confirmText: 'Delete',
                isDanger: true,
                onConfirm: performDelete
            });
        } else {
            performDelete();
        }
    };

    // --- Seeding Pre-populated Chat History in State ---
    chatMessages = [];
    
    // Draw initial seed state to DOM
    renderChat();
    
    // Initialize Login and Privacy Filter
    initLoginSystem();

    function renderHeaderUserSection() {
        const topbarRight = document.querySelector('.topbar-right');
        if (!topbarRight) return;
        
        // Ensure parent topbar-right is flex centered
        topbarRight.style.cssText = 'display: flex; align-items: center; gap: 0.75rem;';
        
        // Remove existing user section if any
        const existing = document.getElementById('topbar-user-section');
        if (existing) existing.remove();
        
        const userSection = document.createElement('div');
        userSection.id = 'topbar-user-section';
        userSection.style.cssText = 'display: flex; align-items: center; gap: 0.75rem; margin-right: 0.25rem;';
        
        userSection.innerHTML = `
            <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); padding: 0.45rem 0.9rem; border-radius: 20px; display: flex; align-items: center; gap: 0.45rem;">
                <i class="fa-solid fa-phone" style="font-size: 0.7rem; color: var(--accent-color);"></i>
                <span>${currentUserPhone}</span>
            </span>
            <button id="logout-btn" style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 20px; padding: 0.45rem 0.9rem; color: #ef4444; font-size: 0.75rem; font-weight: 700; font-family: 'League Spartan', sans-serif; text-transform: uppercase; cursor: pointer; transition: background 0.15s, transform 0.1s;">Logout</button>
        `;
        
        topbarRight.insertBefore(userSection, topbarRight.firstChild);
        
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('currentUserPhone');
            currentUserPhone = null;
            chatMessages = [];
            renderChat();
            location.reload();
        });
    }

    function showLoginModal() {
        // Remove existing login overlay if any
        const existing = document.getElementById('login-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'login-overlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at top, #1e2129 0%, #0e1014 100%); display: flex; align-items: center; justify-content: center; z-index: 99999;';
        
        const card = document.createElement('div');
        card.style.cssText = 'background: rgba(30, 41, 59, 0.45); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); padding: 2.5rem; border-radius: 24px; width: 100%; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; gap: 1.5rem;';
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        
        let enteredPhone = "";
        
        function renderPhoneScreen() {
            card.innerHTML = `
                <div style="width: 64px; height: 64px; background: #ffffff; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #111318; box-shadow: 0 8px 24px rgba(0,0,0,0.25);">
                    <i class="fa-solid fa-brain"></i>
                </div>
                <div style="text-align: center;">
                    <h2 style="font-family: 'League Spartan', sans-serif; font-size: 1.8rem; font-weight: 800; color: #ffffff; margin: 0 0 0.5rem 0;">Welcome to MemoDrop</h2>
                    <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">Enter your phone number to access your private memory vault.</p>
                </div>
                <div style="width: 100%; display: flex; flex-direction: column; gap: 0.5rem;">
                    <label style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Phone Number</label>
                    <div style="position: relative; width: 100%;">
                        <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.9rem;"><i class="fa-solid fa-phone"></i></span>
                        <input id="login-phone-input" type="text" placeholder="e.g. 9876543210" style="width: 100%; padding: 0.8rem 1rem 0.8rem 2.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #fff; font-size: 0.95rem; outline: none; transition: border 0.2s;" value="${enteredPhone}">
                    </div>
                </div>
                <button id="login-submit-btn" style="width: 100%; padding: 0.85rem; border-radius: 12px; border: none; background: var(--accent-color); color: #ffffff; font-family: 'League Spartan', sans-serif; font-size: 1rem; font-weight: 700; text-transform: uppercase; cursor: pointer; transition: transform 0.15s, filter 0.15s;">Send OTP</button>
            `;
            
            const input = document.getElementById('login-phone-input');
            const submitBtn = document.getElementById('login-submit-btn');
            
            input.focus();
            
            input.addEventListener('focus', () => { input.style.borderColor = 'var(--accent-color)'; });
            input.addEventListener('blur', () => { input.style.borderColor = 'rgba(255,255,255,0.08)'; });
            submitBtn.addEventListener('mouseover', () => { submitBtn.style.filter = 'brightness(1.15)'; });
            submitBtn.addEventListener('mouseout', () => { submitBtn.style.filter = 'none'; });
            submitBtn.addEventListener('mousedown', () => { submitBtn.style.transform = 'scale(0.98)'; });
            submitBtn.addEventListener('mouseup', () => { submitBtn.style.transform = 'scale(1)'; });
            
            function handlePhoneSubmit() {
                const val = input.value.trim();
                if (!val || val.length < 10) {
                    alert("Please enter a valid phone number (at least 10 digits).");
                    return;
                }
                enteredPhone = val;
                renderOtpScreen();
            }
            
            submitBtn.addEventListener('click', handlePhoneSubmit);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handlePhoneSubmit();
            });
        }
        
        function renderOtpScreen() {
            card.innerHTML = `
                <div style="width: 64px; height: 64px; background: #ffffff; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #111318; box-shadow: 0 8px 24px rgba(0,0,0,0.25);">
                    <i class="fa-solid fa-shield-halved" style="color: var(--accent-color);"></i>
                </div>
                <div style="text-align: center;">
                    <h2 style="font-family: 'League Spartan', sans-serif; font-size: 1.8rem; font-weight: 800; color: #ffffff; margin: 0 0 0.5rem 0;">Verify OTP</h2>
                    <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">We simulated sending an OTP to <strong>${enteredPhone}</strong>.<br><span style="color: var(--accent-color); font-weight: 700; font-size: 0.85rem;">Demo verification code: 123456</span></p>
                </div>
                <div style="width: 100%; display: flex; flex-direction: column; gap: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">OTP Code</label>
                        <a id="login-back-btn" style="font-size: 0.72rem; color: var(--text-muted); cursor: pointer; text-decoration: underline; font-weight: 600;">← Change Phone</a>
                    </div>
                    <div style="position: relative; width: 100%;">
                        <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.9rem;"><i class="fa-solid fa-key"></i></span>
                        <input id="login-otp-input" type="text" placeholder="Enter 123456" style="width: 100%; padding: 0.8rem 1rem 0.8rem 2.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #fff; font-size: 0.95rem; outline: none; transition: border 0.2s; letter-spacing: 0.1em; text-align: center;">
                    </div>
                </div>
                <button id="login-otp-verify-btn" style="width: 100%; padding: 0.85rem; border-radius: 12px; border: none; background: var(--accent-color); color: #ffffff; font-family: 'League Spartan', sans-serif; font-size: 1rem; font-weight: 700; text-transform: uppercase; cursor: pointer; transition: transform 0.15s, filter 0.15s;">Verify & Enter</button>
            `;
            
            const otpInput = document.getElementById('login-otp-input');
            const verifyBtn = document.getElementById('login-otp-verify-btn');
            const backBtn = document.getElementById('login-back-btn');
            
            otpInput.focus();
            
            otpInput.addEventListener('focus', () => { otpInput.style.borderColor = 'var(--accent-color)'; });
            otpInput.addEventListener('blur', () => { otpInput.style.borderColor = 'rgba(255,255,255,0.08)'; });
            verifyBtn.addEventListener('mouseover', () => { verifyBtn.style.filter = 'brightness(1.15)'; });
            verifyBtn.addEventListener('mouseout', () => { verifyBtn.style.filter = 'none'; });
            verifyBtn.addEventListener('mousedown', () => { verifyBtn.style.transform = 'scale(0.98)'; });
            verifyBtn.addEventListener('mouseup', () => { verifyBtn.style.transform = 'scale(1)'; });
            
            function handleOtpSubmit() {
                const otpVal = otpInput.value.trim();
                if (otpVal === "123456") {
                    localStorage.setItem('currentUserPhone', enteredPhone);
                    currentUserPhone = enteredPhone;
                    overlay.remove();
                    renderHeaderUserSection();
                    loadMemories();
                } else {
                    showCustomAlert("Invalid OTP", "The code you entered is incorrect. Please use code 123456 for this demo.");
                }
            }
            
            verifyBtn.addEventListener('click', handleOtpSubmit);
            otpInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleOtpSubmit();
            });
            backBtn.addEventListener('click', renderPhoneScreen);
        }
        
        renderPhoneScreen();
    }

    // --- Due Reminders Banner Logic ---
    let isDueBannerExpanded = false;

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async function checkDueReminders() {
        if (!currentUserPhone) return;
        
        try {
            const response = await fetch(`/api/reminders/due?user_phone=${encodeURIComponent(currentUserPhone)}`);
            const data = await response.json();
            const reminders = data.reminders || [];
            
            const container = document.getElementById('due-reminders-banner-container');
            if (!container) return;
            
            if (reminders.length === 0) {
                container.style.display = 'none';
                container.innerHTML = '';
                return;
            }
            
            if (isDueBannerExpanded) {
                renderExpandedDueBanner(reminders, container);
            } else {
                renderCollapsedDueBanner(reminders, container);
            }
        } catch (err) {
            console.error("Error checking due reminders:", err);
        }
    }

    function renderCollapsedDueBanner(reminders, container) {
        container.style.display = 'block';
        container.innerHTML = `
            <div class="due-banner-collapsed" id="due-banner-toggle">
                <div class="banner-left">
                    <i class="fa-solid fa-bell fa-bounce" style="--fa-bounce-jump-height: 4px;"></i>
                    <span>You have <strong>${reminders.length}</strong> reminder${reminders.length > 1 ? 's' : ''} due today</span>
                </div>
                <div class="banner-right">
                    <span>Review</span>
                    <i class="fa-solid fa-chevron-down"></i>
                </div>
            </div>
        `;
        
        document.getElementById('due-banner-toggle').addEventListener('click', () => {
            isDueBannerExpanded = true;
            renderExpandedDueBanner(reminders, container);
        });
    }

    function renderExpandedDueBanner(reminders, container) {
        container.style.display = 'block';
        
        const listHtml = reminders.map(r => {
            const dueDateStr = new Date(r.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="due-reminder-item">
                    <div class="item-details">
                        <span class="item-text">${escapeHtml(r.summary || r.content)}</span>
                        <span class="item-due"><i class="fa-regular fa-clock"></i> Due at ${dueDateStr}</span>
                    </div>
                    <div class="item-actions">
                        <button class="due-action-btn done" data-id="${r.id}"><i class="fa-solid fa-circle-check"></i> Done</button>
                        <button class="due-action-btn snooze" data-id="${r.id}"><i class="fa-solid fa-hourglass-half"></i> Snooze</button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = `
            <div class="due-banner-expanded">
                <div class="banner-header">
                    <div class="banner-title">
                        <i class="fa-solid fa-bell"></i>
                        <span>Due Reminders (${reminders.length})</span>
                    </div>
                    <button class="banner-close-btn" id="due-banner-collapse-btn">
                        <i class="fa-solid fa-chevron-up"></i>
                    </button>
                </div>
                <div class="due-reminders-list">
                    ${listHtml}
                </div>
            </div>
        `;
        
        document.getElementById('due-banner-collapse-btn').addEventListener('click', () => {
            isDueBannerExpanded = false;
            renderCollapsedDueBanner(reminders, container);
        });
        
        container.querySelectorAll('.due-action-btn.done').forEach(btn => {
            btn.addEventListener('click', () => handleReminderAction(btn.getAttribute('data-id'), 'done'));
        });
        
        container.querySelectorAll('.due-action-btn.snooze').forEach(btn => {
            btn.addEventListener('click', () => handleReminderAction(btn.getAttribute('data-id'), 'snooze', '1d'));
        });
    }

    async function handleReminderAction(id, action, duration = '1d') {
        try {
            const bodyPayload = { action: action };
            if (action === 'snooze') {
                bodyPayload.duration = duration;
            }
            
            const response = await fetch(`/api/reminders/${id}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const resData = await response.json();
            if (resData.status === 'success') {
                checkDueReminders();
                loadMemories();
            } else {
                showCustomAlert("Action Failed", "Error performing action: " + (resData.message || 'unknown error'));
            }
        } catch (err) {
            console.error(`Error performing ${action} action on reminder ${id}:`, err);
            showCustomAlert("Action Failed", `Error connecting to database to perform ${action}: ${err.message}`);
        }
    }

    async function loadVaultInsights() {
        if (!currentUserPhone) return;
        
        const container = document.getElementById('vault-insights-container');
        if (!container) return;
        
        try {
            const isBusiness = modeToggle.checked;
            const url = `/api/vault/insights?user_phone=${encodeURIComponent(currentUserPhone)}&is_business=${isBusiness}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status !== 'success') {
                container.innerHTML = '';
                return;
            }
            
            if (data.total_this_month === 0) {
                container.innerHTML = `
                    <div class="vault-insights-card">
                        <div class="vault-insights-left">
                            <i class="fa-solid fa-chart-line"></i>
                        </div>
                        <div class="vault-insights-content">
                            <div class="vault-insights-title">This Month</div>
                            <div class="vault-insights-stats">No memories saved yet this month. Start typing to save!</div>
                        </div>
                    </div>
                `;
                return;
            }
            
            let maxCat = 'N/A';
            let maxCount = 0;
            Object.entries(data.categories || {}).forEach(([cat, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    maxCat = cat;
                }
            });
            
            const categoryName = maxCat !== 'N/A' ? formatCategoryName(maxCat) : 'N/A';
            
            let statsText = `<strong>${data.total_this_month}</strong> memories saved`;
            if (maxCount > 0) {
                statsText += ` · Most common: <strong>${categoryName} (${maxCount})</strong>`;
            }
            if (data.top_tag) {
                statsText += ` · Top tag: <span class="tag-highlight">#${data.top_tag}</span>`;
            }
            if (data.top_complaint_tag) {
                statsText += ` · Top complaint tag: <span class="tag-highlight">#${data.top_complaint_tag}</span>`;
            }
            
            container.innerHTML = `
                <div class="vault-insights-card">
                    <div class="vault-insights-left">
                        <i class="fa-solid fa-chart-line"></i>
                    </div>
                    <div class="vault-insights-content">
                        <div class="vault-insights-title">This Month</div>
                        <div class="vault-insights-stats">${statsText}</div>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error("Error loading vault insights:", err);
            container.innerHTML = '';
        }
    }

    function formatCategoryName(cat) {
        const names = {
            "business_supplier_quote": "Quotes",
            "business_customer_complaint": "Complaints",
            "business_order": "Orders",
            "business_inventory_note": "Inventory Notes",
            "shopping_link": "Links",
            "task_reminder": "Reminders",
            "random_thought": "Notes",
            "idea": "Ideas",
            "contact_info": "Contacts",
            "other": "Notes"
        };
        return names[cat] || cat;
    }

    // Expose due reminders checker to other parts
    window.checkDueReminders = checkDueReminders;

    function initLoginSystem() {
        if (!currentUserPhone) {
            showLoginModal();
        } else {
            renderHeaderUserSection();
            loadMemories();
            updateStorageUsage();
        }
    }
});
