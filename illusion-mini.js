// ==UserScript==
// @name         Illusion mini
// @icon         https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/image/icons/illusion.png
// @namespace    https://github.com/cattail-mutt
// @version      mini
// @description  Illusion（幻觉）是一个跨平台 Prompts 管理工具，支持在以下平台使用：Google AI Studio, ChatGPT, Claude, Grok 和 DeepSeek
// @author       Mukai
// @license      MIT
// @match        https://aistudio.google.com/*
// @match        https://chatgpt.com/*
// @match        https://claude.ai/*
// @match        https://chat.deepseek.com/*
// @match        https://grok.com/*
// @match        https://gemini.google.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceText
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/*
    * 【注意事项】Illusion mini 需要用户自己维护列表文件，比如利用 GitHub 仓库存档，并通过 @grant GM_xmlhttpRequest 引用
        - 可以借助仓库中的脚本辅助提示词文件的维护 generatePromptsJSON.py ，避免 AI 生成或手动输入可能引入的错误
        - 因为脚本有丢失的可能，所以建议养成数据存档的习惯

    * 【画饼时间】出于对脚本篇幅控制的考虑，暂缓提示词的添加和管理功能，后续可能会：
        - 添加插件菜单用以：
            1. 添加/更新/删除提示词
            2. 存储用户的 GitHub PAT (Personal Access Token)
            3. 通过 GitHub API 同步更改
        - 上述功能预计会通过 @require 引用仓库内的外部脚本实现
        
    * 【自定义站点】
        - 修改站点判断函数，请查找 `function getCurrentSite() {`
            仿造前例添加即可

        - 在全局配置中新增站点配置，请查找 `const CONFIG = {`
            1. id: 站点标记，与键名一致即可
            2. selector: "输入框"的选择器，如果您不熟悉，可以：
                - 请在编辑器内输入 `${用户输入}`，然后 右键-检查 打开开发者工具，在其中向上移动，并对照页面，直到遮罩覆盖整个编辑器
                - 右键元素，以 HTML 格式修改，复制所有内容，交付给 AI，让它帮你确定选择器
            3. setPrompt: 向"输入框"输入文本的方法，如果您不熟悉，可以：
                - 尝试现有的方法，并观察控制台日志，积极询问代码业务能力比较强大的 AI，寻找解决方案
                - 选择 copyToClipboard，复制到剪贴板，手动粘贴提示词

        - （可选）修改主题
            1. 关键样式
                background-color                            背景色
                color                                       字体颜色
                border-radius                               圆角边框（数值越大，越圆润）
                .illusion-suggestion-list.gemini            gemini 处，应该填写之前设定的站点标记
                .illusion-suggestion-item.active            通过键盘选中选项
                .illusion-suggestion-item:hover             鼠标悬浮于选项上
            2. 辅助工具
                您可以借助 Chrome Color Picker 等浏览器插件辅助确定页面的颜色

    * 【其他自定义配置】
        - 修改激活热键，请查找 `triggerChar: '￥',`
        - 修改 datalist 的键盘操作，请查找 `function onKeyInput(event) {`
*/

(function() {
    'use strict';

    // --- 配置日志 ---
    const debug = {
        enabled: true,
		log: (...args) => debug.enabled && console.log('> Illusion 日志:', ...args),
        error: (...args) => console.error('> Illusion 错误:', ...args)
    };

    // --- 初始化变量 ---
    let savedPrompts = {};
    let suggestionListEl = null;
    let activeEditorEl = null;
    let isTriggerActive = false;
    let isSuggestionListVisible = false;

    // --- 配置常量 ---
    const CUSTOM_PROMPTS_URL_KEY = 'promptsUrl';
    const DEFAULT_PROMPTS_URL = 'https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/prompt/prompts.json';

    // --- 加载提示词 ---
    function fetchLatestPrompts(url) {
        return new Promise((resolve, reject) => {
            if (!url || typeof url !== 'string' || !(url.startsWith('http://') || url.startsWith('https://'))) {
                return reject(new Error(`无效的提示词 URL: ${url}`));
            }
            debug.log(`从 ${url} 获取提示词...`);
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: 10000,
                onload: function(response) {
                    if (response.status >= 200 && response.status < 300) {
                        try {
                            const prompts = JSON.parse(response.responseText);
                            const promptsObject = (prompts || []).reduce((acc, item) => {
                                if (item?.id && item?.value) {
                                    acc[item.id] = item.value;
                                }
                                return acc;
                            }, {});
                            resolve(promptsObject);
                        } catch (e) {
                            reject(new Error('解析 JSON 失败: ' + e.message));
                        }
                    } else {
                        reject(new Error(`HTTP 错误: ${response.status} ${response.statusText}`));
                    }
                },
                onerror: function(error) {
                    reject(new Error('网络请求错误: ' + error.error));
                },
                ontimeout: function() {
                    reject(new Error('请求超时'));
                }
            });
        });
    }

    // --- 定义向编辑器输入提示词的方法 ---
    function createParagraph(line) {
        const p = document.createElement('p');
        if (line.trim()) {
            p.textContent = line;
        } else {
            p.innerHTML = '<br>';
        }
        return p;
    }

    const updateProseMirror = (editor, newContent, mode = 'append', triggerChar = '￥') => {
        try {
            if (!editor || !(editor instanceof Element)) {
                console.error('editor 不是一个有效的 DOM 元素');
                return;
            }

            const paragraphs = Array.from(editor.querySelectorAll('p'));
            let currentContent = '';
            paragraphs.forEach((p, index) => {
                currentContent += p.textContent;
                if (index < paragraphs.length - 1) {
                    currentContent += '\n';
                }
            });

            let finalContent;
            if (mode === 'replace') {
                const triggerPos = currentContent.lastIndexOf(triggerChar);
                if (triggerPos !== -1) {
                    const beforeTrigger = currentContent.substring(0, triggerPos);
                    finalContent = beforeTrigger ? beforeTrigger + newContent : newContent;
                } else {
                    finalContent = newContent;
                }
            } else {
                finalContent = currentContent.trim() ? currentContent + '\n\n' + newContent : newContent;
            }

            editor.innerHTML = '';
            const lines = finalContent.split('\n');
            lines.forEach(line => {
                editor.appendChild(createParagraph(line));
            });

            const range = document.createRange();
            const sel = window.getSelection();
            if (editor.lastChild) {
                let nodeToSetCursorAfter = editor.lastChild;
                if (nodeToSetCursorAfter.childNodes.length === 1 && nodeToSetCursorAfter.firstChild.nodeName === 'BR') {
                    range.setStart(nodeToSetCursorAfter, 0);
                } else {
                    range.setStartAfter(nodeToSetCursorAfter);
                }
            } else {
                range.setStart(editor, 0);
            }
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            editor.focus();

            setTimeout(() => {
                dispatchEvents(editor, ['input', 'change']);
            }, 50);
        } catch (error) {
            debug.error('updateProseMirror 中发生错误:', error);
        }
    };

    const updateTextArea = (textarea, newContent, mode = 'append', triggerChar = '￥') => {
        const currentContent = textarea.value;
        let finalContent;

        if (mode === 'replace') {
            const triggerPos = currentContent.lastIndexOf(triggerChar);
            if (triggerPos !== -1) {
                finalContent = currentContent.substring(0, triggerPos) + newContent;
            } else {
                finalContent = newContent;
            }
        } else {
            finalContent = currentContent === ''
                ? newContent
                : currentContent + "\n" + newContent;
        }

        const setter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            "value"
        ).set;
        setter.call(textarea, finalContent);
        dispatchEvents(textarea, ['focus', 'input', 'change']);
        textarea.selectionStart = textarea.selectionEnd = finalContent.length;
        textarea.focus();
        textarea.scrollTop = textarea.scrollHeight;
    };

    const copyToClipboard = async (editor, promptContent) => {
        try {
            await navigator.clipboard.writeText(promptContent);
            // alert('提示词已复制到剪贴板，请手动粘贴。');
        } catch (error) {
            debug.error('复制到剪贴板失败:', error);
        }
    };

    // --- 全局配置 ---
    const CONFIG = {
        debugEnabled: true,
        eventDelay: 50,
        triggerChar: '￥',  // 您可以在此设置提示词建议列表的激活热键
        sites: {
            chatgpt: {
                id: 'chatgpt',
                selector: 'div.ProseMirror[contenteditable=true], #prompt-textarea',
                setPrompt: (editor, prompt, mode, trigger) => {
                    if (editor.matches('div.ProseMirror')) {
                        updateProseMirror(editor, prompt, mode, trigger);
                    } else if (editor.matches('#prompt-textarea')) {
                        updateTextArea(editor, prompt, mode, trigger);
                    } else {
                         debug.error("未知的 ChatGPT 编辑器类型:", editor);
                    }
                }
            },
            claude: {
                id: 'claude',
                selector: 'div.ProseMirror[contenteditable=true]',
                setPrompt: updateProseMirror
            },
            deepseek: {
                id: 'deepseek',
                selector: 'textarea[id="chat-input"]',
                setPrompt: updateTextArea
            },
            gemini: {
                id: 'gemini',
                selector: 'md-input-chips > div[contenteditable="true"], ms-autosize-textarea textarea',
                setPrompt: (editor, prompt, mode, trigger) => {
                    if (editor.matches('ms-autosize-textarea textarea')) {
                        updateTextArea(editor, prompt, mode, trigger);
                    } else if (editor.matches('md-input-chips > div[contenteditable="true"]')) {
                        updateProseMirror(editor, prompt, mode, trigger);
                    } else {
                        debug.error("未知的 Gemini 编辑器类型:", editor);
                    }
                }
            },
            geminiApp: {
                id: 'geminiApp',
                selector: '.text-input-field_textarea-inner .ql-editor',
                setPrompt: copyToClipboard
            },
            grok: {
                id: 'grok',
                selector: 'textarea',
                setPrompt: updateTextArea
            }
        }
    };

    // --- 判断当前站点 ---
    function getCurrentSite() {
        const url = window.location.href;
        if (url.includes('chatgpt.com')) return 'chatgpt';
        if (url.includes('claude.ai')) return 'claude';
        if (url.includes('chat.deepseek.com')) return 'deepseek';
        if (url.includes('aistudio.google.com')) return 'gemini';
        if (url.includes('gemini.google.com')) return 'geminiApp';
        if (url.includes('grok.com')) return 'grok';
        return null;
    }

    // --- 在控制台中查阅提示词 ---
    function promptLibrary() {
        console.log("--- 提示词列表 ---");
        if (Object.keys(savedPrompts).length === 0) {
            alert("提示词列表为空");
        } else {
            Object.entries(savedPrompts).forEach(([id, content]) => {
                console.log(`ID: ${id}\nContent:\n${content}`);
            });
        }
        console.log("--- EOF ---");
        alert("请通过 F12 或 '右键-检查' 打开开发者工具，在控制台中查看具体内容");
    }

    function setCustomPromptsUrl() {
        const currentCustomUrl = GM_getValue(CUSTOM_PROMPTS_URL_KEY, '');
        const message = `请输入 prompts.json 对应的 URL\n留空将使用默认配置\n当前设置: ${currentCustomUrl || '无 (使用默认)'}`;
        const newUrl = prompt(message, currentCustomUrl || '');
        if (newUrl === null) {
            alert('操作已取消。');
        } else if (newUrl.trim() === '') {
            GM_setValue(CUSTOM_PROMPTS_URL_KEY, '');
            alert(`自定义 URL 已清除，将使用默认 URL\n刷新页面以加载默认提示词`);
        } else if (newUrl.startsWith('http://') || newUrl.startsWith('https://')) {
            GM_setValue(CUSTOM_PROMPTS_URL_KEY, newUrl.trim());
            alert(`自定义 URL 已更新为: ${newUrl.trim()}\n请刷新页面以加载新提示词`);
        } else {
             alert('输入的 URL 无效，请仔细检查');
        }
    }

    // --- UI 创建与管理 ---
    function injectStyles() {
        GM_addStyle(`
            .illusion-suggestion-list {
                position: absolute;
                z-index: 99999;
                background-color: #fff;
                border: 1px solid #ccc;
                border-radius: 4px;
                max-height: 200px;
                overflow-y: auto;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                min-width: 150px;
                font-family: sans-serif;
                font-size: 14px;
                scrollbar-width: thin;
            }
            .illusion-suggestion-item {
                padding: 8px 12px;
                cursor: pointer;
                color: #333;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .illusion-suggestion-item:hover {
                background-color: #eee;
            }
            .illusion-suggestion-item.active {
                background-color: #ddeeff;
            }
            .illusion-suggestion-item.no-match {
                padding: 8px 12px;
                color: #888;
                cursor: default;
            }
            .illusion-suggestion-item:hover {
                background-color: #eee;
            }
            .illusion-suggestion-list::-webkit-scrollbar-button {
                display: none !important;
            }
        
            .illusion-suggestion-list.chatgpt { 
                background-color: #FFFFFF;
                border-radius: 28px;
            }
            .illusion-suggestion-list.chatgpt .illusion-suggestion-item.active,
            .illusion-suggestion-list.chatgpt .illusion-suggestion-item:hover {
                background-color: #F9F9F9;
                color: #333;
            }

            .illusion-suggestion-list.claude { 
                background-color: #FFFFFF;
                border-radius: 1rem;
            }
            .illusion-suggestion-list.claude .illusion-suggestion-item.active { color: #333; }
            .illusion-suggestion-list.claude .illusion-suggestion-item.active,
            .illusion-suggestion-list.claude .illusion-suggestion-item:hover {
                background-color: #FAF9F5;
            }

            .illusion-suggestion-list.deepseek {
                background-color: #F3F4F6;
                border-radius: 24px;
            }
            .illusion-suggestion-list.deepseek .illusion-suggestion-item.active { color: #333; }
            .illusion-suggestion-list.deepseek .illusion-suggestion-item.active,
            .illusion-suggestion-list.deepseek .illusion-suggestion-item:hover {
                background-color: #FFFFFF;
            }

            .illusion-suggestion-list.gemini { 
                background-color: #2E2E2E;
                border-radius: 40px;
                border-color: #2E2E2E;
            }
            .illusion-suggestion-list.gemini .illusion-suggestion-item { color: #DADCE0; }
            .illusion-suggestion-list.gemini .illusion-suggestion-item.active { color: #FFF; }
            .illusion-suggestion-list.gemini .illusion-suggestion-item.active,
            .illusion-suggestion-list.gemini .illusion-suggestion-item:hover {
                background-color: #1E1E1E;
            }

            .illusion-suggestion-list.grok { 
                background-color: #FCFCFC;
                border-radius: 1.5rem;
            }
            .illusion-suggestion-list.grok .illusion-suggestion-item.active { color: #333; }
            .illusion-suggestion-list.grok .illusion-suggestion-item.active,
            .illusion-suggestion-list.grok .illusion-suggestion-item:hover {
                background-color: #F8F7F6;
            }
        `);
    }

    function showSuggestions(editorElement) {
        if (suggestionListEl) {
            return;
        }
        suggestionListEl = document.createElement('div');
        suggestionListEl.className = 'illusion-suggestion-list';
        suggestionListEl.style.position = 'absolute';
        suggestionListEl.style.visibility = 'hidden';
        suggestionListEl.style.top = '-9999px';
        suggestionListEl.style.left = '-9999px';
        const siteId = getCurrentSite();
        if (siteId) {
            suggestionListEl.classList.add(siteId);
        }
        document.body.appendChild(suggestionListEl);
        updateSuggestions('');

        let listHeight = suggestionListEl.offsetHeight;
        if (listHeight <= 0) {
            try {
                const computedStyle = window.getComputedStyle(suggestionListEl);
                const maxHeight = parseInt(computedStyle.maxHeight, 10);
                if (!isNaN(maxHeight) && maxHeight > 0) {
                    listHeight = maxHeight;
                } else {
                    listHeight = 150;
                }
            } catch (e) {
                debug.error("计算样式/高度回退时出错:", e);
                listHeight = 150;
            }
        }

        const rect = editorElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        const spaceAbove = rect.top - 5;
        const spaceBelow = viewportHeight - rect.bottom - 5;
        let top;
        const positionBelow = scrollY + rect.bottom + 5;
        const positionAbove = scrollY + rect.top - listHeight - 5;
        if (spaceAbove >= listHeight) {
            top = positionAbove;
        } else if (spaceBelow >= listHeight) {
            top = positionBelow;
        } else {
            top = spaceAbove > spaceBelow ? positionAbove : positionBelow;
        }

        suggestionListEl.style.top = `${top}px`;
        suggestionListEl.style.left = `${scrollX + rect.left}px`;
        suggestionListEl.style.minWidth = `${rect.width}px`;
        suggestionListEl.style.visibility = 'visible';

        isSuggestionListVisible = true;

        document.removeEventListener('keydown', onGlobalKeydown, true);
        document.addEventListener('keydown', onGlobalKeydown, true);
        document.removeEventListener('click', onGlobalClick, true);
        document.addEventListener('click', onGlobalClick, true);
    }

    function hideSuggestions() {
        if (!isSuggestionListVisible || !suggestionListEl) {
            return;
        }
        document.removeEventListener('keydown', onGlobalKeydown, true);
        document.removeEventListener('click', onGlobalClick, true);
        suggestionListEl.remove();
        suggestionListEl = null;
        isSuggestionListVisible = false;
        isTriggerActive = false;
    }

    function updateSuggestions(searchTerm) {
        if (!suggestionListEl) {
            return;
        }

        let emptyHTML = '';
        if (window.trustedTypes && trustedTypes.createPolicy) {
            const policy = trustedTypes.createPolicy('illusion-policy', {
                createHTML: (input) => input
            });
            emptyHTML = policy.createHTML('');
        }
        suggestionListEl.innerHTML = emptyHTML;

        const lowerSearchTerm = searchTerm.toLowerCase();
        const matchingPrompts = Object.entries(savedPrompts).filter(([id]) =>
            id.toLowerCase().includes(lowerSearchTerm)
        );

        if (matchingPrompts.length === 0) {
            const noMatchEl = document.createElement('div');
            noMatchEl.className = 'illusion-suggestion-item no-match';
            noMatchEl.textContent = '无匹配项';
            suggestionListEl.appendChild(noMatchEl);
        } else {
            matchingPrompts.forEach(([id, content]) => {
                const item = document.createElement('div');
                item.className = 'illusion-suggestion-item';
                item.textContent = id;
                item.dataset.promptId = id;
                item.removeEventListener('click', onSuggestionClick);
                item.addEventListener('click', onSuggestionClick);
                suggestionListEl.appendChild(item);
            });
            const firstItem = suggestionListEl.querySelector('.illusion-suggestion-item:not(.no-match)');
            if (firstItem) {
                firstItem.classList.add('active');
            }
        }
    }

    // --- 事件处理与交互 ---
    function dispatchEvents(element, events) {
        events.forEach(eventName => {
            const event = eventName === 'input'
                ? new InputEvent(eventName, { bubbles: true })
                : new Event(eventName, { bubbles: true });
            element.dispatchEvent(event);
        });
    }

    async function onSuggestionClick(event) {
        const promptId = event.target.dataset.promptId;
        if (promptId && activeEditorEl && document.body.contains(activeEditorEl)) {
            const promptContent = savedPrompts[promptId];
            const siteId = getCurrentSite();
            const siteConfig = CONFIG.sites[siteId];
            if (siteConfig && siteConfig.setPrompt) {
                await siteConfig.setPrompt(activeEditorEl, promptContent, 'replace', CONFIG.triggerChar);
                hideSuggestions();
            }
        } else {
            hideSuggestions();
        }
    }

    function onEditorInput(event) {
        const target = event.target;
        if (!target || !(target.isContentEditable || target.tagName === 'TEXTAREA')) {
            return;
        }
        activeEditorEl = target;

        let content, cursorPos;
        if (target.isContentEditable) {
            const fullRange = document.createRange();
            fullRange.selectNodeContents(target);
            content = fullRange.toString();
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(target);
                preCaretRange.setEnd(range.endContainer, range.endOffset);
                cursorPos = preCaretRange.toString().length;
            } else {
                cursorPos = 0;
            }
        } else {
            content = target.value;
            cursorPos = target.selectionStart;
        }

        const triggerChar = CONFIG.triggerChar;
        const triggerPos = content.lastIndexOf(triggerChar);
        let isSuggestionShown = false;
        let searchTerm = '';

        if (triggerPos !== -1) {
            const textAfterTrigger = content.substring(triggerPos + 1);
            const cursorRelativePos = cursorPos - (triggerPos + 1);

            if (cursorPos === triggerPos + 1 && !isTriggerActive) {
                isTriggerActive = true;
                isSuggestionShown = true;
            } else if (isTriggerActive && cursorPos > triggerPos && !textAfterTrigger.includes('\n')) {
                isSuggestionShown = true;
                searchTerm = content.substring(triggerPos + 1, cursorPos);
            }
        } else {
            isTriggerActive = false;
        }

        if (isSuggestionShown) {
            if (!isSuggestionListVisible) showSuggestions(activeEditorEl);
            updateSuggestions(searchTerm);
        } else if (isSuggestionListVisible) {
            hideSuggestions();
        }
    }

    function onKeyInput(event) {
        if (isSuggestionListVisible && suggestionListEl && event.target === activeEditorEl) {
            const items = suggestionListEl.querySelectorAll('.illusion-suggestion-item:not(.no-match)');
            if (items.length === 0) return;
            let activeIndex = -1;
            items.forEach((item, index) => {
                if (item.classList.contains('active')) {
                    activeIndex = index;
                }
            });
            if (['ArrowUp', 'ArrowDown', 'Escape'].includes(event.key)) {
                event.preventDefault();
                event.stopPropagation();
                if (event.key === 'Escape') {
                    hideSuggestions();
                    return;
                }
                let nextIndex = activeIndex;
                if (event.key === 'ArrowUp') {
                    nextIndex = activeIndex === -1 ? items.length - 1 : (activeIndex - 1 + items.length) % items.length;
                } else if (event.key === 'ArrowDown') {
                    nextIndex = activeIndex === -1 ? 0 : (activeIndex + 1) % items.length;
                }
                if (activeIndex !== -1) {
                    items[activeIndex].classList.remove('active');
                }
                items[nextIndex].classList.add('active');
                items[nextIndex].scrollIntoView({ block: 'nearest' });
            }
        }
    }

    function onGlobalKeydown(event) {
        if (isSuggestionListVisible && event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            hideSuggestions();
        }
    }

    function onGlobalClick(event) {
        if (isSuggestionListVisible && suggestionListEl && activeEditorEl) {
            if (!suggestionListEl.contains(event.target) && !activeEditorEl.contains(event.target)) {
                hideSuggestions();
            }
        } else if (isSuggestionListVisible && suggestionListEl && !activeEditorEl) {
            if (!suggestionListEl.contains(event.target)) {
                hideSuggestions();
            }
        }
    }

    // --- 脚本初始化 ---
    async function initSuggestions() {
        const siteId = getCurrentSite();
        if (!siteId) {
            return;
        }
        const siteConfig = CONFIG.sites[siteId];
        if (!siteConfig || !siteConfig.selector) {
            debug.error(`缺少站点 '${siteId}' 的配置或选择器。`);
            return;
        }

        const setupListenerForEditor = (editorElement) => {
            if (editorElement && editorElement.matches(siteConfig.selector) && !editorElement.dataset.illusionInitialized) {
                editorElement.dataset.illusionInitialized = 'true';
                editorElement.addEventListener('focusin', (event) => {
                    if (event.target.matches(siteConfig.selector)) {
                        activeEditorEl = event.target;
                    }
                });
                editorElement.addEventListener('input', onEditorInput);
                editorElement.addEventListener('keydown', onKeyInput, true);
            }
        };

        document.querySelectorAll(siteConfig.selector).forEach(setupListenerForEditor);

        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.matches && node.matches(siteConfig.selector)) {
                                setupListenerForEditor(node);
                            }
                            if (node.querySelectorAll) {
                                node.querySelectorAll(siteConfig.selector).forEach(setupListenerForEditor);
                            }
                        }
                    });
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true, attributes: false });
    }

    async function initialize() {
        let urlToFetch = DEFAULT_PROMPTS_URL;
        const customUrl = GM_getValue(CUSTOM_PROMPTS_URL_KEY, null);
        if (customUrl && typeof customUrl === 'string' && customUrl.trim() !== '' && (customUrl.startsWith('http://') || customUrl.startsWith('https://'))) {
            urlToFetch = customUrl.trim();
            debug.log(`检测到有效的自定义提示词 URL，将使用: ${urlToFetch}`);
        } else {
            if (customUrl && customUrl.trim() !== '') {
                debug.log(`存储的自定义 URL "${customUrl}" 无效或格式不正确，将使用默认 URL。`);
            } else {
                // debug.log('未设置或存储的自定义 URL 为空，将使用默认 URL。');
            }
            urlToFetch = DEFAULT_PROMPTS_URL;
        }
        let storedPrompts = GM_getValue('prompts') || {};
        try {
            const latestPrompts = await fetchLatestPrompts(urlToFetch);
            if (latestPrompts && Object.keys(latestPrompts).length > 0) {
                savedPrompts = latestPrompts;
                GM_setValue('prompts', savedPrompts);
                debug.log(`成功获取并更新`, Object.keys(savedPrompts).length, '条提示词');
            } else {
                debug.log(`从 ${urlToFetch} 获取到的提示词为空或无效，将继续使用本地缓存（如果存在）。`);
                savedPrompts = storedPrompts;
                 if (Object.keys(savedPrompts).length === 0) {
                     debug.log('本地缓存也为空。');
                 } else {
                     debug.log('已加载本地缓存的提示词:', Object.keys(savedPrompts).length, '条目');
                 }
            }
        } catch (error) {
            debug.error(`从 ${urlToFetch} 获取最新提示词失败:`, error);
            savedPrompts = storedPrompts;
            if (Object.keys(savedPrompts).length === 0) {
                debug.log('获取失败且本地缓存为空，提示词功能将不可用。');
            } else {
                debug.log('获取失败，已加载本地缓存的提示词:', Object.keys(savedPrompts).length, '条目');
            }
        }
        if (typeof savedPrompts !== 'object' || savedPrompts === null) {
             debug.error('savedPrompts 不是一个有效的对象，重置为空对象。');
            savedPrompts = {};
        }
        try {
            injectStyles();
            GM_registerMenuCommand("在控制台中查阅现有提示词", promptLibrary);
            GM_registerMenuCommand("修改提示词URL", setCustomPromptsUrl);
            await initSuggestions();
        } catch (error) {
            debug.error('初始化 UI 或监听器过程中发生错误：', error);
        }
    }

    // --- 脚本启动 ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initialize, 500));
    } else {
        setTimeout(initialize, 500);
    }

})();