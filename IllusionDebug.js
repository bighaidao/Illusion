// ==UserScript==
// @name         Illusion Debug
// @icon         https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/resources/icons/illusion.png
// @namespace    LINUX_DO
// @version      debug
// @description  幻觉（Illusion）是一个精简的跨平台 Prompts 管理工具，支持在以下 AI 平台使用：Google AI Studio, OpenAI ChatGPT, Anthropic Claude 和 DeepSeek Chat。
// @author       Mukai
// @license      MIT
// @match        https://aistudio.google.com/*
// @match        https://chatgpt.com/*
// @match        https://claude.ai/*
// @match        https://chat.deepseek.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceText
// @resource     PROMPTS https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/resources/config/prompts.yaml
// @resource     THEMES https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/resources/config/themes.json
// @resource     CSS https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/resources/styles/illusion.css
// @require      https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js
// ==/UserScript==

(function() {
    'use strict';

    let modalRef = null;
    let overlayRef = null;
    let savedPrompts = {};
    
    window.onerror = function(msg, url, line, col, error) {
        console.error('[Illusion]错误:', {msg, url, line, col, error});
        return false;
    };
    
    const debug = {
        enabled: true,
        log: (...args) => debug.enabled && console.log('[Illusion]日志:', ...args),
        error: (...args) => console.error('[Illusion]错误:', ...args),
        warn: (...args) => console.warn('[Illusion]警告:', ...args),
        trace: (...args) => debug.enabled && console.trace('[Illusion]追踪:', ...args)
    };

    const initialPrompts = jsyaml.load(GM_getResourceText('PROMPTS'));
    const THEMECONFIG = GM_getResourceText('THEMES');
    debug.log('[Illusion]日志: PROMPTS解析结果:', initialPrompts);
    debug.log('[Illusion]日志: THEMES解析结果:', THEMECONFIG);
    let themeConfigs = JSON.parse(THEMECONFIG);

    function dispatchEvents(element, events) {
        events.forEach(eventName => {
            const event = eventName === 'input' 
                ? new InputEvent(eventName, { bubbles: true }) 
                : new Event(eventName, { bubbles: true });
            element.dispatchEvent(event);
        });
    }

    // ChatGPT 和 Claude 均使用了 ProseMirror 库构建富文本编辑器
    function createParagraph(line) {
        const p = document.createElement('p');
        if (line.trim()) {
            p.textContent = line;
        } else {
            p.innerHTML = '<br>';
        }
        return p;
    }

    const updateProseMirror = (editor, prompt) => {
        const paragraphs = Array.from(editor.querySelectorAll('p'));
        let currentContent = '';
        paragraphs.forEach(p => {
            const text = p.textContent.trim();
            if (text) {
                currentContent += text + '\n';
            } else {
                currentContent += '\n';
            }
        });
        let newContent = currentContent.trim();
        if (newContent) {
            newContent += '\n';
        }
        editor.innerHTML = '';
        if (newContent) {
            newContent.split('\n').forEach(line => {
                editor.appendChild(createParagraph(line));
            });
        }
        const lines = prompt.split('\n');
        lines.forEach((line, index) => {
            editor.appendChild(createParagraph(line));
            if (index < lines.length - 1 && !line.trim()) {
                const brP = document.createElement('p');
                brP.innerHTML = '<br>';
                editor.appendChild(brP);
            }
        });
        dispatchEvents(editor, ['input', 'change']);
    };

    // Gemini 和 DeepSeek 使用的均是纯文本输入框 <textarea>
    // DeepSeek 不支持对 textarea.value 直接更新
    const updateTextArea = async (textarea, prompt) => {
        const currentContent = textarea.value;
        const newContent = currentContent === '' 
            ? prompt 
            : currentContent + "\n" + prompt;
        const setter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            "value"
        ).set;
        setter.call(textarea, newContent);
        dispatchEvents(textarea, ['focus', 'input', 'change']);
    };

    const CONFIG = {
        debugEnabled: true,
        maxRetries: 3,
        retryDelay: 1000,
        initTimeout: 10000,
        eventDelay: 50,
        eventTimeout: 1000,
        sites: {
            CHATGPT: {
                id: 'chatgpt',
                icon: 'https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/resources/icons/chatgpt.svg',
                buttonSize: '48px',
                selector: 'div.ProseMirror[contenteditable=true]',
                setPrompt: updateProseMirror
            },
            CLAUDE: {
                id: 'claude',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" style="flex:none;line-height:1" viewBox="0 0 24 24"><title>Claude</title><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill="#D97757" fill-rule="nonzero"/></svg>`,
                buttonSize: '48px',
                selector: 'div.ProseMirror[contenteditable=true]',
                setPrompt: updateProseMirror
            },
            GEMINI: {
                id: 'gemini',
                icon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
                buttonSize: '48px',
                selector: 'textarea[aria-label="Type something"]',
                setPrompt: updateTextArea
            },
            DEEPSEEK: {
                id: 'deepseek',
                icon: 'https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/resources/icons/deepseek.svg',
                buttonSize: '48px',
                selector: 'textarea[id="chat-input"]',
                setPrompt: updateTextArea
            }
        }
    };

    function loadExternalCSS() {
        const style = document.createElement('style');
        style.textContent = GM_getResourceText('CSS');
        document.head.appendChild(style);
    }

    function applyThemeVariables() {
        const currentSite = getCurrentSite();
        const theme = themeConfigs[currentSite];
        const config = Object.values(CONFIG.sites).find(s => s.id === currentSite);
        const root = document.documentElement;
        root.style.setProperty('--button-size', config.buttonSize);
        root.style.setProperty('--button-bg', theme.button.bg);
        root.style.setProperty('--border-color', theme.border);
        root.style.setProperty('--button-hover', theme.button.hover);
        root.style.setProperty('--panel-bg', theme.panel.bg);
        root.style.setProperty('--panel-button-bg', theme.panel.buttonBg);
        root.style.setProperty('--panel-button-hover', theme.panel.buttonHover);
        root.style.setProperty('--text-color', theme.text);
        root.style.setProperty('--secondary-bg', theme.secondary);
    }

    // 匹配输入框
    function waitForElement(selector, maxTimeout = CONFIG.initTimeout) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if(element) {
                return resolve(element);
            }
            
            let timeout;
            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    clearTimeout(timeout);
                    resolve(el);
                }
            });
            
            timeout = setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout waiting for ${selector}`));
            }, maxTimeout);
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    function getCurrentSite() {
        const url = window.location.href;
        if(url.includes('aistudio.google.com')) return CONFIG.sites.GEMINI.id;
        if(url.includes('chatgpt.com')) return CONFIG.sites.CHATGPT.id;
        if(url.includes('claude.ai')) return CONFIG.sites.CLAUDE.id;
        if(url.includes('chat.deepseek.com')) return CONFIG.sites.DEEPSEEK.id;
    }

    function createElement(tag, attributes = {}) {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key === 'onclick') {
                element.addEventListener('click', value);
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else if (key === 'html') {
                element.innerHTML = value;
            } else if (key === 'on' && typeof value === 'object') {
                Object.entries(value).forEach(([event, handler]) => {
                    element.addEventListener(event, handler);
                });
            } else {
                element.setAttribute(key, value);
            }
        });
        return element;
    }

    // 载入 GM_Value 中存储的提示词或预置提示词
    function loadPrompts() {
        const storedPrompts = GM_getValue('prompts');
        if (!storedPrompts) {
            savedPrompts = initialPrompts;
            GM_setValue('prompts', savedPrompts);
        } else {
            savedPrompts = storedPrompts;
        }
        return savedPrompts;
    }

    // 保存新提示词、更新列表
    function saveNewPrompt(id, content) {
        savedPrompts[id] = content;
        GM_setValue('prompts', savedPrompts);
        updateDatalist();
        debug.log('New prompt saved:', id);
    }

    // 网页 Prompt 设置（含重试机制）
    async function setPromptWithRetry(site, prompt, maxRetries = CONFIG.maxRetries) {
        return new Promise(async (resolve, reject) => {
            let attempts = 0;
            
            const trySetPrompt = async () => {
                try {
                    const config = Object.values(CONFIG.sites).find(s => s.id === site);
                    if(!config || !config.setPrompt) {
                        return reject(new Error(`No prompt setter configured for site: ${site}`));
                    }
                    
                    // 获取最新的编辑器元素
                    const editor = document.querySelector(config.selector);
                    if(!editor) {
                        throw new Error('Editor element not found');
                    }
                    
                    // 传入编辑器元素和prompt内容
                    await config.setPrompt(editor, prompt);
                    resolve(true);
                } catch (err) {
                    if (attempts < maxRetries) {
                        attempts++;
                        setTimeout(trySetPrompt, CONFIG.retryDelay);
                    } else {
                        reject(err);
                    }
                }
            };
    
            trySetPrompt();
        });
    }
    
    // UI创建
    function initializeUI() {
        loadExternalCSS();
        applyThemeVariables();
        const button = createButton();
        const panel = createPanel();
        const { modal, overlay } = createModal();
        setupEventListeners(button, panel, modal, overlay);
    }

    function createButton() {
        const button = createElement('div', {
            className: 'illusion-button',
            'data-tooltip': 'Illusion',
            'data-tooltip-position': 'left',
            'aria-label': 'Illusion'
        });
        
        const currentSite = getCurrentSite();
        const config = Object.values(CONFIG.sites).find(s => s.id === currentSite);
        
        if(config.icon.startsWith('http')) {
            const img = createElement('img', {
                src: config.icon,
                width: '24',
                height: '24',
                style: {
                    pointerEvents: 'none'
                }
            });
            button.appendChild(img);
        } else {
            button.innerHTML = config.icon;
            const svg = button.querySelector('svg');
            if(svg) {
                svg.style.width = '24px';
                svg.style.height = '24px';
                svg.style.pointerEvents = 'none';
            }
        }
        
        document.body.appendChild(button);
        makeDraggable(button);
        
        debug.log('Button created');
        return button;
    }

    function createPanel() {
        const panel = createElement('div', {
            className: 'illusion-panel'
        });
        
        const title = createElement('div', {
            className: 'panel-title',
            textContent: 'Illusion'
        });
        panel.appendChild(title);
        
        const inputGroup = createElement('div', {
            className: 'input-group'
        });
        
        const input = createElement('input', {
            className: 'prompt-input',
            type: 'text',
            list: 'prompt-options',
            placeholder: '查找 Prompt'
        });
        
        const datalist = createElement('datalist', {
            id: 'prompt-options'
        });
        
        Object.keys(savedPrompts).forEach(id => {
            const option = createElement('option', {
                value: id
            });
            datalist.appendChild(option);
        });
        
        inputGroup.appendChild(input);
        inputGroup.appendChild(datalist);
        panel.appendChild(inputGroup);
        
        const buttonGroup = createElement('div', {
            className: 'button-group'
        });
        
        const newButton = createElement('button', {
            className: 'panel-button',
            textContent: 'New Prompt',
            'data-action': 'new',
            onclick: () => {
                debug.log('New prompt button clicked');
                const modal = document.querySelector('.modal');
                const overlay = document.querySelector('.modal-overlay');
                if (modal && overlay) {
                    showNewPromptModal(modal, overlay);
                } else {
                    debug.error('Modal or overlay elements not found');
                }
            }
        });
        buttonGroup.appendChild(newButton);
        
        const manageButton = createElement('button', {
            className: 'panel-button',
            textContent: 'Manage',
            'data-action': 'manage',
            onclick: () => {
                debug.log('Manage button clicked');
                const modal = document.querySelector('.modal');
                const overlay = document.querySelector('.modal-overlay');
                if (modal && overlay) {
                    showManagePromptsModal(modal, overlay);
                } else {
                    debug.error('Modal or overlay elements not found');
                }
            }
        });
        buttonGroup.appendChild(manageButton);
        panel.appendChild(buttonGroup);
        
        document.body.appendChild(panel);
        debug.log('Panel created');
        return panel;
    }

    function createModal() {
        overlayRef = createElement('div', {
            className: 'modal-overlay'
        });
        document.body.appendChild(overlayRef);
        
        modalRef = createElement('div', {
            className: 'modal',
            role: 'dialog',
            'aria-modal': 'true'
        });
        document.body.appendChild(modalRef);
        
        return { modal: modalRef, overlay: overlayRef };
    }

    function createModalFooter(buttonConfigs, modal, overlay) {
        const footer = createElement('div', { className: 'modal-footer' });
        buttonConfigs.forEach(config => {
            const btn = createElement('button', {
                className: 'panel-button',
                textContent: config.text,
                onclick: () => {
                    // 调用配置中的 function，同时把 modal 和 overlay 传递进去（如果需要）
                    config.onClick && config.onClick(modal, overlay);
                }
            });
            footer.appendChild(btn);
        });
        return footer;
    }

    function openModal(modal, overlay, container) {
        modal.textContent = '';
        modal.appendChild(container);
        modal.classList.add('visible');
        overlay.classList.add('visible');
    }

    function hideModal(modal, overlay) {
        modal.classList.remove('visible');
        overlay.classList.remove('visible');
    }

    // 拖拽功能
    function getEventPosition(e) {
        if (e.touches && e.touches.length) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    function makeDraggable(button) {
        let isDragging = false;
        let startX, startY;
        let initialX, initialY;
        let lastValidX, lastValidY;
        let dragThrottle;

        function setButtonPosition(x, y) {
            button.style.left = x + 'px';
            button.style.top = y + 'px';
            GM_setValue('buttonPosition', { x, y });
        }

        function dragStart(e) {
            const pos = getEventPosition(e);
            startX = pos.x;
            startY = pos.y;
            
            const rect = button.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            isDragging = true;
            button.classList.remove('docked');
            button.classList.add('dragging');
        }

        function dragEnd() {
            if (!isDragging) return;
            isDragging = false;
            button.classList.remove('dragging');
    
            const rect = button.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const threshold = viewportWidth * 0.3;
    
            if (rect.left > viewportWidth - threshold) {
                setButtonPosition(viewportWidth - rect.width, rect.top);
                button.classList.add('docked');
            } else if (rect.left < threshold) {
                setButtonPosition(0, rect.top);
                button.classList.add('docked');
            }
        }

        function drag(e) {
            if (!isDragging) return;
            e.preventDefault();
    
            if (dragThrottle) return;
            dragThrottle = setTimeout(() => {
                dragThrottle = null;
            }, 16);
            
            const { x: currentX, y: currentY } = getEventPosition(e);
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            requestAnimationFrame(() => {
                setButtonPosition(initialX + deltaX, initialY + deltaY);
                lastValidX = initialX + deltaX;
                lastValidY = initialY + deltaY;
            });
        }

        // 触摸事件
        button.addEventListener('touchstart', dragStart, { passive: false });
        button.addEventListener('touchend', dragEnd, { passive: false });
        button.addEventListener('touchmove', drag, { passive: false });
        
        // 鼠标事件
        button.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        
        window.addEventListener('resize', () => {
            if (lastValidX !== undefined && lastValidY !== undefined) {
                setButtonPosition(lastValidX, lastValidY);
            }
        });
        
        // 恢复保存的位置或设置默认初始位置
        const savedPosition = GM_getValue('buttonPosition');
        if (savedPosition) {
            setButtonPosition(savedPosition.x, savedPosition.y);
        } else {
            setButtonPosition(
                window.innerWidth - button.offsetWidth - 20, 
                window.innerHeight / 2 - button.offsetHeight / 2
            );
        }
    }

    // Modals
    function createModalContainer(title, contentElement, footerElement) {
        const container = createElement('div');
        const header = createElement('div', {
            className: 'modal-header',
            textContent: title
        });
        container.appendChild(header);
        container.appendChild(contentElement);
        container.appendChild(footerElement);
        return container;
    }

    function createFormGroup(labelText, inputOptions) {
        const group = createElement('div', { className: 'form-group' });
        const label = createElement('label', {
            className: 'form-label',
            textContent: labelText
        });
        let input;
        if (inputOptions.type === 'textarea') {
            input = createElement('textarea', inputOptions);
        } else {
            input = createElement('input', inputOptions);
        }
        group.appendChild(label);
        group.appendChild(input);
        return { group, input };
    }

    function createPromptModal({ title, promptId, promptContent, isEditable, onSave, modal, overlay }) {
        const content = createElement('div', { className: 'modal-content' });

        // 创建Prompt ID输入组
        const { group: idGroup, input: idInput } = createFormGroup('Prompt ID', {
            className: 'form-input',
            type: 'text',
            value: promptId || '',
            placeholder: '输入Prompt的标识名称'
        });
        // 如果是编辑状态，则禁用输入框
        if (promptId && !isEditable) {
            idInput.disabled = true;
        }
        content.appendChild(idGroup);

        // 创建Prompt Content输入组
        const { group: contentGroup, input: contentInput } = createFormGroup('Prompt Content', {
            className: 'form-textarea',
            type: 'textarea',
            value: promptContent || '',
            placeholder: '输入Prompt内容'
        });
        content.appendChild(contentGroup);

        // 页脚按钮配置
        const footerButtons = [
            {
                text: 'Cancel',
                onClick: (modal, overlay) => {
                    hideModal(modal, overlay);
                }
            },
            {
                text: promptId ? 'Update' : 'Save',
                onClick: () => {
                    const idVal = idInput.value.trim();
                    const contentVal = contentInput.value.trim();
                    onSave(idVal, contentVal);
                }
            }
        ];
        const footer = createModalFooter(footerButtons, modal, overlay);
        const container = createModalContainer(title, content, footer);
        openModal(modal, overlay, container);
        setTimeout(() => contentInput.focus(), 100);
    }

    function showNewPromptModal(modal, overlay) {
        createPromptModal({
            title: 'New Prompt',
            promptId: '',
            promptContent: '',
            isEditable: true,
            onSave: (id, content) => {
                if (id && content) {
                    try {
                        saveNewPrompt(id, content);
                        hideModal(modal, overlay);
                    } catch (err) {
                        debug.error('Error saving new prompt:', err);
                        alert('保存失败，请重试');
                    }
                } else {
                    alert('请填写所有必填字段');
                }
            },
            modal,
            overlay
        });
    }
    
    // Editing Modal
    function showEditPromptModal(modal, overlay, id, content) {
        createPromptModal({
            title: 'Prompt Editing',
            promptId: id,
            promptContent: content,
            isEditable: false,
            onSave: (id, newContent) => {
                if (newContent) {
                    savedPrompts[id] = newContent;
                    GM_setValue('prompts', savedPrompts);
                    hideModal(modal, overlay);
                    showManagePromptsModal(modal, overlay);
                    updateDatalist();
                } else {
                    alert('内容不能为空');
                }
            },
            modal,
            overlay
        });
    }

    function showManagePromptsModal(modal, overlay) {
        const container = createElement('div');
        
        const header = createElement('div', {
            className: 'modal-header',
            textContent: 'Manage Prompts'
        });
        container.appendChild(header);
        
        const content = createElement('div', {
            className: 'modal-content'
        });
        
        Object.entries(savedPrompts).forEach(([id, promptContent]) => {
            const promptGroup = createElement('div', {
                className: 'form-group',
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px',
                    borderBottom: '1px solid #eee'
                }
            });
            
            const promptId = createElement('div', {
                className: 'form-label',
                style: { margin: '0', flex: '1' },
                textContent: id
            });
            
            const buttonGroup = createElement('div', {
                className: 'button-group',
                style: { marginLeft: '16px' }
            });
            
            const editButton = createElement('button', {
                className: 'panel-button',
                textContent: 'Edit',
                onclick: () => {
                    showEditPromptModal(modal, overlay, id, promptContent);
                }
            });
            
            const deleteButton = createElement('button', {
                className: 'panel-button',
                textContent: 'Delete',
                onclick: () => {
                    if (confirm(`确定要删除 "${id}" 吗？`)) {
                        delete savedPrompts[id];
                        GM_setValue('prompts', savedPrompts);
                        promptGroup.remove();
                        updateDatalist();
                    }
                }
            });
            
            buttonGroup.appendChild(editButton);
            buttonGroup.appendChild(deleteButton);
            promptGroup.appendChild(promptId);
            promptGroup.appendChild(buttonGroup);
            content.appendChild(promptGroup);
        });
        
        container.appendChild(content);
        
        const footer = createElement('div', {
            className: 'modal-footer'
        });
        
        const closeButton = createElement('button', {
            className: 'panel-button',
            textContent: 'Close',
            onclick: () => {
                hideModal(modal, overlay);
            }
        });
        
        footer.appendChild(closeButton);
        container.appendChild(footer);
        openModal(modal, overlay, container);
    }

    // Prompt选择器
    function updateDatalist() {
        const datalist = document.getElementById('prompt-options');
        if (!datalist) return;
        datalist.textContent = '';
        Object.keys(savedPrompts).forEach(id => {
            const option = createElement('option', { value: id });
            datalist.appendChild(option);
        });
    }

    // 事件监听
    function setupEventListeners(button, panel, modal, overlay) {
        panel.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        button.addEventListener('click', (e) => {
            if(!e.target.classList.contains('dragging')) {
                e.stopPropagation();
                debug.log('Button clicked');
                panel.classList.toggle('visible');
            }
        });

        document.addEventListener('click', () => {
            if (panel.classList.contains('visible')) {
                debug.log('Clicking outside panel, hiding panel');
                panel.classList.remove('visible');
            }
        });

        panel.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            
            const action = btn.dataset.action;
            debug.log('Panel button clicked:', action);
            
            try {
                if (action === 'new') {
                    showNewPromptModal(modalRef, overlayRef);
                } else if (action === 'manage') {
                    showManagePromptsModal(modalRef, overlayRef);
                }
            } catch (error) {
                debug.error('Error handling button click:', error);
            }
        });

        const promptInput = panel.querySelector('.prompt-input');

        promptInput.addEventListener('change', async (e) => {
            const selectedValue = e.target.value.trim();
            const promptContent = savedPrompts[selectedValue];
            
            if (promptContent) {
                debug.log('Setting prompt:', selectedValue);
                try {
                    const site = getCurrentSite();
                    const success = await setPromptWithRetry(site, promptContent);
                    if (success) {
                        debug.log('Set prompt: Done');
                    } else {
                        debug.error('Set prompt: Failed');
                        alert('Failed to set prompt. Please try again.');
                    }
                } catch(err) {
                    debug.error('Error setting prompt:', err);
                    alert('Error setting prompt: ' + err.message);
                }
            }
            e.target.value = '';
        });

        overlay.addEventListener('click', () => {
            hideModal(modal, overlay);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('visible')) {
                hideModal(modal, overlay);
            }
        });
    }

    // 初始化主函数
    async function initialize() {
        debug.log('Initializing...');
        try {
            const currentSite = getCurrentSite();
            if(!currentSite) {
                debug.error('Unsupported site');
                return;
            }
            
            savedPrompts = loadPrompts();
            
            const siteConfig = Object.values(CONFIG.sites).find(s => s.id === currentSite);
            if (!siteConfig) {
                debug.error('Site configuration not found for current site');
                return;
            }
            const editorSelector = siteConfig.selector;
            
            try {
                await waitForElement(editorSelector);
                debug.log('Editor element found');
            } catch(err) {
                debug.error('Editor element not found:', err);
                return;
            }
            
            initializeUI();
            
            debug.log('Initialization complete');
        } catch (error) {
            debug.error('Initialization failed:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();