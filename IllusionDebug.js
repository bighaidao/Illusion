// ==UserScript==
// @name         Illusion Debug
// @namespace    LINUX_DO_Scripts
// @version      1.0
// @description  Illusion - 快速输入你常用的 Prompt，支持 Gemini, Claude, ChatGPT 和 Deepseek。
// @author       Mukai
// @match        https://aistudio.google.com/*
// @match        https://chatgpt.com/*
// @match        https://claude.ai/*
// @match        https://chat.deepseek.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';
    
    // 添加全局错误处理
    window.onerror = function(msg, url, line, col, error) {
        console.error('[Illusion Error]', {msg, url, line, col, error});
        return false;
    };

    // 重试与调试
    const debug = {
        enabled: true,
        log: (...args) => debug.enabled && console.log('[Illusion]', ...args),
        error: (...args) => console.error('[Illusion]', ...args),
        warn: (...args) => console.warn('[Illusion]', ...args),
        trace: (...args) => debug.enabled && console.trace('[Illusion]', ...args)
    };
    const CONFIG = {
        maxRetries: 3,
        retryDelay: 1000,
        initTimeout: 10000,
        debug: true,
        eventDelay: 50,
        eventTimeout: 1000
    };

    // 站点
    const SITES = {
        GEMINI: 'gemini',
        CHATGPT: 'chatgpt', 
        CLAUDE: 'claude',
        DEEPSEEK: 'deepseek'
    };

    // 默认提示词，请注意部分 prompt 沿用了 Google AI Studio 的 Markdown 而非标准 Markdown ，用于他系模型时最好稍作修改。 
    const DEFAULT_INITIAL_PROMPTS = {
        "DEFAULT": `默认用中文回答，详细解释你的推理过程。\n\n## 说话风格\n*   直言不讳、偶尔赞美，但主要用犀利幽默回应，可适当嘲讽提问者\n*   不刻意强调你的性格，只需要照做即可，可使用表情符号\n*   关注细节，思考有深度\n*   必要时可从下列几种工具中挑选来辅助描述：\n    1. Markdown表格（常用于信息整理或对比）\n    2. Latex公式（仅限数学问题）\n    3. Mermaid（例如 Sequence Diagram, Mindmap, Flowchart等等）\n\n## 工具注意事项：\n1. 直接使用Markdown语法，无需 \`\`\` 反引号\n2. 单个Latex代码使用 $  包裹\n3. 根据情境选择适合的Mermaid的图表类型，以便更好地表达和呈现信息`,// 来自 LINUX DO 佬友 @fl0w1nd
        "轻思考": `请按如下方式进行回复：\n\n在**回答之前**或是**反思之后**，输出完整的Chain-of-Thought，也就是透过一步步的思考、推导最后得到答案。Chain-of-Thought开头请先以Markdown三级标题输出"Chain-of-Thought"，然后Chain-of-Thought的每一行请都以Markdown引用符号">"开头。\n\n当产生初步答案后，则输出完整的反思过程，你将扮演冷酷客观的第三者来一步一步地审核、反思之前的答案，并思考有无其他可能或改进之处，反思开头请先以Markdown三级标题输出"Rethink"，然后反思过程每一行都要用markdown引用符号">>"开头。\n\n反思过程结束后，启动下一轮的Chain-of-Thought->产出答案->反思过程，一直到产出答案没有问题为止。\n\n所有""涉及数据的引用**绝对禁止凭记忆回答或是随机杜撰，都必须先上网查寻，确认并附上引用来源资料。\n\n为了便于编写，这段提示采用中文写作。如果用户使用其他语言提问，请仍然遵循用户的语言。`, // 来自 Youtuber @尹相志 
        "通用开发型提示词": `By default, all responses must be in Chinese.\n\n# AI Full-Stack Development Assistant Guide\n\n## Core Thinking Patterns\nYou must engage in multi-dimensional deep thinking before and during responses:\n\n### Fundamental Thinking Modes\n- Systems Thinking: Three-dimensional thinking from overall architecture to specific implementation\n- Dialectical Thinking: Weighing pros and cons of multiple solutions  \n- Creative Thinking: Breaking through conventional thinking patterns to find innovative solutions\n- Critical Thinking: Multi-angle validation and optimization of solutions\n\n### Thinking Balance\n- Balance between analysis and intuition\n- Balance between detailed inspection and global perspective  \n- Balance between theoretical understanding and practical application\n- Balance between deep thinking and forward momentum\n- Balance between complexity and clarity\n\n### Analysis Depth Control  \n- Conduct in-depth analysis for complex problems\n- Keep simple issues concise and efficient\n- Ensure analysis depth matches problem importance\n- Find balance between rigor and practicality\n\n### Goal Focus\n- Maintain clear connection with original requirements\n- Guide divergent thinking back to the main topic timely\n- Ensure related explorations serve the core objective\n- Balance between open exploration and goal orientation\n\nAll thinking processes must:\n0. Presented in the form of a block of code + the title of the point of view, please note that the format is strictly adhered to and that it must include a beginning and an end.\n1. Unfold in an original, organic, stream-of-consciousness manner\n2. Establish organic connections between different levels of thinking\n3. Flow naturally between elements, ideas, and knowledge\n4. Each thought process must maintain contextual records, keeping contextual associations and connections\n\n## Technical Capabilities\n\n### Core Competencies\n- Systematic technical analysis thinking\n- Strong logical analysis and reasoning abilities  \n- Strict answer verification mechanism\n- Comprehensive full-stack development experience\n\n### Adaptive Analysis Framework\nAdjust analysis depth based on:\n- Technical complexity\n- Technology stack scope\n- Time constraints  \n- Existing technical information\n- User's specific needs\n\n### Solution Process\n1. Initial Understanding\n- Restate technical requirements\n- Identify key technical points\n- Consider broader context\n- Map known/unknown elements\n\n2. Problem Analysis  \n- Break down tasks into components\n- Determine requirements\n- Consider constraints\n- Define success criteria\n\n3. Solution Design\n- Consider multiple implementation paths\n- Evaluate architectural approaches\n- Maintain open-minded thinking\n- Progressively refine details\n\n4. Implementation Verification\n- Test assumptions\n- Verify conclusions\n- Validate feasibility\n- Ensure completeness\n\n## Output Requirements\n\n### Code Quality Standards\n- Always show complete code context for better understanding and maintainability.\n- Code accuracy and timeliness\n- Complete functionality\n- Security mechanisms\n- Excellent readability\n- Use markdown formatting\n- Specify language and path in code blocks\n- Show only necessary code modifications\n#### Code Handling Guidelines\n1. When editing code:\n   - Show only necessary modifications\n   - Include file paths and language identifiers\n   - Provide context with comments\n   - Format: \`\`\`language:path/to/file\n\n2. Code block structure:   \`\`\`language:file/path\n   // ... existing code ...\n   {{ modifications }}\n   // ... existing code ...   \`\`\`\n\n\n### Technical Specifications\n- Complete dependency management\n- Standardized naming conventions\n- Thorough testing\n- Detailed documentation\n\n### Communication Guidelines\n- Clear and concise expression\n- Handle uncertainties honestly\n- Acknowledge knowledge boundaries\n- Avoid speculation\n- Maintain technical sensitivity\n- Track latest developments\n- Optimize solutions\n- Improve knowledge\n\n### Prohibited Practices\n- Using unverified dependencies\n- Leaving incomplete functionality\n- Including untested code\n- Using outdated solutions\n\n## Important Notes\n- Maintain systematic thinking for solution completeness\n- Focus on feasibility and maintainability\n- Continuously optimize interaction experience\n- Keep open learning attitude and updated knowledge\n- Disable the output of emoji unless specifically requested\n- By default, all responses must be in Chinese.\n`,// 来自 LINUX DO 佬友 @yuaotian
        "探究-引导式学习": `请你将我视作“小白”，结合探究式学习、建构主义学习、苏格拉底式教学法的理念，个性化地帮助我掌握知识和解决问题的方法。\n\n## “小白”\n“小白”对目标领域的一无所知，希望通过不断地探索、思考，以及回答相关问题来主动地学习知识。\n\n## 工作流程\n小白向你提出想要了解的问题 → 基础知识对齐 → 解答与检验\n\n## 基础知识对齐环节\n1. 针对小白提出的问题，逐步思考(think step-by-step)：\n    2.1. 首先，思考如果要想解释清楚这个问题，小白需要掌握哪些前置知识或基础知识\n    2.2. 其次，思考应该向小白提出什么问题，以便了解其缺少哪些前置、基础知识\n    2.3. 再者，思考如何确保你的问题能够满足“具体、易于理解、对小白而言不致回答困难”\n2. 根据小白的回答情况，逐步思考：\n    3.1. 思考什么样的讲解适合小白， 确保其能够理解你的解释\n    3.1. 思考如何向小白解释清楚其缺少、未能掌握的知识\n\n## 解答与检验环节\n当完成基础知识对齐环节后，进行逐步思考：\n1. 首先，思考如何回答、解决小白的问题；\n2. 然后，思考应当提出哪些必要的问题来检验小白对知识的掌握程度\n3. 再者，思考如何确保你的问题能够满足“具体、易于理解、对小白而言不致回答困难”\n4. 最后，思考小白是否已经能够独立自主的解决目标问题\n    4.1 如果判断为“是”，则结束对话\n    4.2 如果判断为“否”，则回退至基础知识对齐环节\n\n请在<thinking>中进行思考，在<output>中进行实际输出。`,// 修改自 LINUX DO 佬友 @Dhudean 的"学习助手"
    };

    // 站点主题配置
    const themeConfigs = {
        [SITES.GEMINI]: {
            primary: 'rgb(26, 28, 30)',
            secondary: 'rgb(32, 34, 37)', 
            hover: 'rgb(45, 47, 50)',
            text: 'rgb(198, 198, 201)',
            border: 'rgba(255, 255, 255, 0.1)',
            button: {
                bg: 'rgb(26, 28, 30)',
                hover: 'rgb(36, 38, 40)'
            },
            panel: {
                bg: 'rgb(26, 28, 30)',
                buttonBg: 'rgb(32, 34, 37)',
                buttonHover: 'rgb(45, 47, 50)'
            }
        },
        [SITES.CLAUDE]: {
            primary: 'rgb(217, 119, 87)',
            secondary: 'rgb(230, 228, 219)',
            hover: 'rgb(220, 218, 209)', 
            text: 'rgb(83, 81, 70)',
            border: 'rgba(217, 119, 87, 0.2)',
            button: {
                bg: 'rgb(240, 238, 229)',
                hover: 'rgb(230, 228, 219)'
            },
            panel: {
                bg: 'rgb(240, 238, 229)',
                buttonBg: 'rgb(230, 228, 219)',
                buttonHover: 'rgb(220, 218, 209)'
            }
        },
        [SITES.CHATGPT]: {
            primary: '#ffffff',
            secondary: '#f7f7f8',
            hover: '#ececf1',
            text: '#000000', 
            border: 'rgba(0, 0, 0, 0.1)',
            button: {
                bg: '#ffffff',
                hover: '#f7f7f8'
            },
            panel: {
                bg: '#ffffff',
                buttonBg: '#f7f7f8',
                buttonHover: '#ececf1'
            }
        },
        [SITES.DEEPSEEK]: {
            primary: 'rgb(249, 251, 255)',
            secondary: 'rgb(249, 251, 255)',
            hover: 'rgb(249, 251, 255)',
            text: 'rgb(50, 50, 50)',
            border: 'rgba(77, 107, 254, 0.2)',
            button: {
                bg: 'rgb(219, 234, 254)',
                hover: 'rgb(249, 251, 255)'
            },
            panel: {
                bg: 'rgb(255, 255, 255)',
                buttonBg: 'rgb(249, 251, 255)',
                buttonHover: 'rgb(77, 107, 254)'
            }
        }
    };

    // 站点按钮图标、输入方法配置
    const siteConfigs = {
        [SITES.GEMINI]: {
            icon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
            buttonSize: '48px',
            setPrompt: (prompt) => {
                return new Promise(async (resolve) => {
                    try {
                        const textarea = await waitForElement('textarea[aria-label="System instructions"]', CONFIG.initTimeout);
                        if(textarea) {
                            textarea.focus();
                            textarea.value = prompt;
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                            textarea.dispatchEvent(new Event('change', { bubbles: true }));
                            debug.log('Gemini prompt set successfully');
                            resolve(true);
                        } else {
                            debug.error('Gemini textarea not found');
                            resolve(false);
                        }
                    } catch(err) {
                        debug.error('Error setting Gemini prompt:', err);
                        resolve(false);
                    }
                });
            },
            debug: {
                logDOM: () => {
                    debug.log('Gemini textarea:', document.querySelector('textarea[aria-label="System instructions"]'));
                }
            }
        },
        [SITES.CHATGPT]: {
            icon: `<svg width="41" height="41" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-2/3 w-2/3" role="img"><text x="-9999" y="-9999">ChatGPT</text><path d="M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3934 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.500197C16.1708 0.495044 14.0893 1.16803 12.3614 2.42214C10.6335 3.67624 9.34853 5.44666 8.6917 7.47815C7.30085 7.76286 5.98686 8.3414 4.8377 9.17505C3.68854 10.0087 2.73073 11.0782 2.02839 12.312C0.956464 14.1591 0.498905 16.2988 0.721698 18.4228C0.944492 20.5467 1.83612 22.5449 3.268 24.1293C2.81966 25.4759 2.66413 26.9026 2.81182 28.3141C2.95951 29.7256 3.40701 31.0892 4.12437 32.3138C5.18791 34.1659 6.8123 35.6322 8.76321 36.5013C10.7141 37.3704 12.8907 37.5973 14.9789 37.1492C15.9208 38.2107 17.0786 39.0587 18.3747 39.6366C19.6709 40.2144 21.0755 40.5087 22.4946 40.4998C24.6307 40.5054 26.7133 39.8321 28.4418 38.5772C30.1704 37.3223 31.4556 35.5506 32.1119 33.5179C33.5027 33.2332 34.8167 32.6547 35.9659 31.821C37.115 30.9874 38.0728 29.9178 38.7752 28.684C39.8458 26.8371 40.3023 24.6979 40.0789 22.5748C39.8556 20.4517 38.9639 18.4544 37.5324 16.8707ZM22.4978 37.8849C20.7443 37.8874 19.0459 37.2733 17.6994 36.1501C17.7601 36.117 17.8666 36.0586 17.936 36.0161L25.9004 31.4156C26.1003 31.3019 26.2663 31.137 26.3813 30.9378C26.4964 30.7386 26.5563 30.5124 26.5549 30.2825V19.0542L29.9213 20.998C29.9389 21.0068 29.9541 21.0198 29.9656 21.0359C29.977 21.052 29.9842 21.0707 29.9867 21.0902V30.3889C29.9842 32.375 29.1946 34.2791 27.7909 35.6841C26.3872 37.0892 24.4838 37.8806 22.4978 37.8849ZM6.39227 31.0064C5.51397 29.4888 5.19742 27.7107 5.49804 25.9832C5.55718 26.0187 5.66048 26.0818 5.73461 26.1244L13.699 30.7248C13.8975 30.8408 14.1233 30.902 14.3532 30.902C14.583 30.902 14.8088 30.8408 15.0073 30.7248L24.731 25.1103V28.9979C24.7321 29.0177 24.7283 29.0376 24.7199 29.0556C24.7115 29.0736 24.6988 29.0893 24.6829 29.1012L16.6317 33.7497C14.9096 34.7416 12.8643 35.0097 10.9447 34.4954C9.02506 33.9811 7.38785 32.7263 6.39227 31.0064ZM4.29707 13.6194C5.17156 12.0998 6.55279 10.9364 8.19885 10.3327C8.19885 10.4013 8.19491 10.5228 8.19491 10.6071V19.808C8.19351 20.0378 8.25334 20.2638 8.36823 20.4629C8.48312 20.6619 8.64893 20.8267 8.84863 20.9404L18.5723 26.5542L15.206 28.4979C15.1894 28.5089 15.1703 28.5155 15.1505 28.5173C15.1307 28.5191 15.1107 28.516 15.0924 28.5082L7.04046 23.8557C5.32135 22.8601 4.06716 21.2235 3.55289 19.3046C3.03862 17.3858 3.30624 15.3413 4.29707 13.6194ZM31.955 20.0556L22.2312 14.4411L25.5976 12.4981C25.6142 12.4872 25.6333 12.4805 25.6531 12.4787C25.6729 12.4769 25.6928 12.4801 25.7111 12.4879L33.7631 17.1364C34.9967 17.849 36.0017 18.8982 36.6606 20.1613C37.3194 21.4244 37.6047 22.849 37.4832 24.2684C37.3617 25.6878 36.8382 27.0432 35.9743 28.1759C35.1103 29.3086 33.9415 30.1717 32.6047 30.6641C32.6047 30.5947 32.6047 30.4733 32.6047 30.3889V21.188C32.6066 20.9586 32.5474 20.7328 32.4332 20.5338C32.319 20.3348 32.154 20.1698 31.955 20.0556ZM35.3055 15.0128C35.2464 14.9765 35.1431 14.9142 35.069 14.8717L27.1045 10.2712C26.906 10.1554 26.6803 10.0943 26.4504 10.0943C26.2206 10.0943 25.9948 10.1554 25.7963 10.2712L16.0726 15.8858V11.9982C16.0715 11.9783 16.0753 11.9585 16.0837 11.9405C16.0921 11.9225 16.1048 11.9068 16.1207 11.8949L24.1719 7.25025C25.4053 6.53903 26.8158 6.19376 28.2383 6.25482C29.6608 6.31589 31.0364 6.78077 32.2044 7.59508C33.3723 8.40939 34.2842 9.53945 34.8334 10.8531C35.3826 12.1667 35.5464 13.6095 35.3055 15.0128ZM14.2424 21.9419L10.8752 19.9981C10.8576 19.9893 10.8423 19.9763 10.8309 19.9602C10.8195 19.9441 10.8122 19.9254 10.8098 19.9058V10.6071C10.8107 9.18295 11.2173 7.78848 11.9819 6.58696C12.7466 5.38544 13.8377 4.42659 15.1275 3.82264C16.4173 3.21869 17.8524 2.99464 19.2649 3.1767C20.6775 3.35876 22.0089 3.93941 23.1034 4.85067C23.0427 4.88379 22.937 4.94215 22.8668 4.98473L14.9024 9.58517C14.7025 9.69878 14.5366 9.86356 14.4215 10.0626C14.3065 10.2616 14.2466 10.4877 14.2479 10.7175L14.2424 21.9419ZM16.071 17.9991L20.4018 15.4978L24.7325 17.9975V22.9985L20.4018 25.4983L16.071 22.9985V17.9991Z" fill="#000000"></path></svg>`,
            buttonSize: '48px',
            setPrompt: (prompt) => {
                return new Promise(async (resolve) => {
                    try {
                        const textarea = document.getElementById('prompt-textarea');
                        if(!textarea) {
                            debug.error('ChatGPT textarea not found');
                            resolve(false);
                            return;
                        }
                        
                        const setValue = () => {
                            try {
                                textarea.value = prompt;
                                textarea.innerHTML = prompt.split('\n').map(line =>
                                    `<p>${line || '<br>'}</p>`
                                ).join('');
                                setTimeout(() => {
                                    try {
                                        textarea.dispatchEvent(new Event('focus', { bubbles: true }));
                                        setTimeout(() => {
                                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                                            setTimeout(() => {
                                                textarea.dispatchEvent(new Event('change', { bubbles: true }));
                                                resolve(true);
                                            }, 10);
                                        }, 10);
                                    } catch(e) {
                                        debug.error('Error dispatching events:', e);
                                        resolve(false);
                                    }
                                }, 10);
                            } catch(e) {
                                debug.error('Error in setValue:', e);
                                resolve(false);
                            }
                        };
                        requestAnimationFrame(setValue);
                    } catch(err) {
                        debug.error('Error in setPrompt:', err);
                        resolve(false);
                    }
                });
            },
            debug: {
                logDOM: () => {
                    debug.log('ChatGPT textarea:', document.getElementById('prompt-textarea'));
                }
            }
        },
        [SITES.CLAUDE]: {
            icon: `<svg fill='#d97757' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z"></path></svg>`,
            buttonSize: '48px',
            setPrompt: (prompt) => {
                return new Promise(async (resolve) => {
                    try {
                        const editor = await waitForElement('div.ProseMirror[contenteditable=true]', CONFIG.initTimeout);
                        if(editor) {
                            editor.focus();

                            const escapedPrompt = prompt.replace(/[<>]/g, char => ({
                                '<': '&lt;',
                                '>': '&gt;'
                            })[char]);

                            editor.innerHTML = escapedPrompt.split('\n').map(line => 
                                `<p>${line || '<br>'}</p>`
                            ).join('');
                            
                            const events = [
                                new InputEvent('input', { bubbles: true, cancelable: true }),
                                new Event('change', { bubbles: true }),
                                new Event('compositionend', { bubbles: true })
                            ];
                            events.forEach(event => editor.dispatchEvent(event));

                            debug.log('Claude prompt set successfully');
                            resolve(true);
                        } else {
                            debug.error('Claude editor not found');
                            resolve(false);
                        }
                    } catch(err) {
                        debug.error('Error setting Claude prompt:', err);
                        resolve(false);
                    }
                });
            },
            debug: {
                logDOM: () => {
                    debug.log('Claude editor:', document.querySelector('div.ProseMirror[contenteditable=true]'));
                }
            }
        },
        [SITES.DEEPSEEK]: {
            icon: `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path id="path" d="M27.501 8.46875C27.249 8.3457 27.1406 8.58008 26.9932 8.69922C26.9434 8.73828 26.9004 8.78906 26.8584 8.83398C26.4902 9.22852 26.0605 9.48633 25.5 9.45508C24.6787 9.41016 23.9785 9.66797 23.3594 10.2969C23.2275 9.52148 22.79 9.05859 22.125 8.76172C21.7764 8.60742 21.4238 8.45312 21.1807 8.11719C21.0098 7.87891 20.9639 7.61328 20.8779 7.35156C20.8242 7.19336 20.7695 7.03125 20.5879 7.00391C20.3906 6.97266 20.3135 7.13867 20.2363 7.27734C19.9258 7.84375 19.8066 8.46875 19.8174 9.10156C19.8447 10.5234 20.4453 11.6562 21.6367 12.4629C21.7725 12.5547 21.8076 12.6484 21.7646 12.7832C21.6836 13.0605 21.5869 13.3301 21.501 13.6074C21.4473 13.7852 21.3662 13.8242 21.1768 13.7461C20.5225 13.4727 19.957 13.0684 19.458 12.5781C18.6104 11.7578 17.8438 10.8516 16.8877 10.1426C16.6631 9.97656 16.4395 9.82227 16.207 9.67578C15.2314 8.72656 16.335 7.94727 16.5898 7.85547C16.8574 7.75977 16.6826 7.42773 15.8193 7.43164C14.957 7.43555 14.167 7.72461 13.1611 8.10938C13.0137 8.16797 12.8594 8.21094 12.7002 8.24414C11.7871 8.07227 10.8389 8.0332 9.84766 8.14453C7.98242 8.35352 6.49219 9.23633 5.39648 10.7441C4.08105 12.5547 3.77148 14.6133 4.15039 16.7617C4.54883 19.0234 5.70215 20.8984 7.47559 22.3633C9.31348 23.8809 11.4307 24.625 13.8457 24.4824C15.3125 24.3984 16.9463 24.2012 18.7881 22.6406C19.2529 22.8711 19.7402 22.9629 20.5498 23.0332C21.1729 23.0918 21.7725 23.002 22.2373 22.9062C22.9648 22.752 22.9141 22.0781 22.6514 21.9531C20.5186 20.959 20.9863 21.3633 20.5605 21.0371C21.6445 19.752 23.2783 18.418 23.917 14.0977C23.9668 13.7539 23.9238 13.5391 23.917 13.2598C23.9131 13.0918 23.9512 13.0254 24.1445 13.0059C24.6787 12.9453 25.1973 12.7988 25.6738 12.5352C27.0557 11.7793 27.6123 10.5391 27.7441 9.05078C27.7637 8.82422 27.7402 8.58789 27.501 8.46875ZM15.46 21.8613C13.3926 20.2344 12.3906 19.6992 11.9766 19.7227C11.5898 19.7441 11.6592 20.1875 11.7441 20.4766C11.833 20.7617 11.9492 20.959 12.1123 21.209C12.2246 21.375 12.3018 21.623 12 21.8066C11.334 22.2207 10.1768 21.668 10.1221 21.6406C8.77539 20.8477 7.64941 19.7988 6.85547 18.3652C6.08984 16.9844 5.64453 15.5039 5.57129 13.9238C5.55176 13.541 5.66406 13.4062 6.04297 13.3379C6.54199 13.2461 7.05762 13.2266 7.55664 13.2988C9.66602 13.6074 11.4619 14.5527 12.9668 16.0469C13.8262 16.9004 14.4766 17.918 15.1465 18.9121C15.8584 19.9688 16.625 20.9746 17.6006 21.7988C17.9443 22.0879 18.2197 22.3086 18.4824 22.4707C17.6895 22.5586 16.3652 22.5781 15.46 21.8613ZM16.4502 15.4805C16.4502 15.3105 16.5859 15.1758 16.7568 15.1758C16.7949 15.1758 16.8301 15.1836 16.8613 15.1953C16.9033 15.2109 16.9424 15.2344 16.9727 15.2695C17.0273 15.3223 17.0586 15.4004 17.0586 15.4805C17.0586 15.6504 16.9229 15.7852 16.7529 15.7852C16.582 15.7852 16.4502 15.6504 16.4502 15.4805ZM19.5273 17.0625C19.3301 17.1426 19.1328 17.2129 18.9434 17.2207C18.6494 17.2344 18.3281 17.1152 18.1533 16.9688C17.8828 16.7422 17.6895 16.6152 17.6074 16.2168C17.5732 16.0469 17.5928 15.7852 17.623 15.6348C17.6934 15.3105 17.6152 15.1035 17.3877 14.9141C17.2012 14.7598 16.9658 14.7188 16.7061 14.7188C16.6094 14.7188 16.5205 14.6758 16.4541 14.6406C16.3457 14.5859 16.2568 14.4512 16.3418 14.2852C16.3691 14.2324 16.501 14.1016 16.5322 14.0781C16.8838 13.877 17.29 13.9434 17.666 14.0938C18.0146 14.2363 18.2773 14.498 18.6562 14.8672C19.0439 15.3145 19.1133 15.4395 19.334 15.7734C19.5078 16.0371 19.667 16.3066 19.7754 16.6152C19.8408 16.8066 19.7559 16.9648 19.5273 17.0625Z" fill-rule="nonzero" fill="#4D6BFE"></path></svg>`,
            buttonSize: '48px',
            setPrompt: (prompt) => {
                return new Promise(async (resolve) => {
                    try {
                        const inputElement = document.getElementById('chat-input');
                        if(inputElement) {

                            inputElement.focus();
                            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                                window.HTMLTextAreaElement.prototype,
                                "value"
                            ).set;
                            nativeInputValueSetter.call(inputElement, prompt);
                            
                            [ 'focus', 'input', 'change' ].forEach(eventName => {
                                const event = eventName === 'input' 
                                    ? new InputEvent(eventName, {
                                        bubbles: true,
                                        cancelable: true,
                                        composed: true
                                    })
                                    : new Event(eventName, { bubbles: true });
                                inputElement.dispatchEvent(event);
                            });

                            debug.log('Deepseek prompt set successfully');
                            resolve(true);
                        } else {
                            debug.error('Deepseek textarea not found');
                            resolve(false);
                        }
                    } catch(err) {
                        debug.error('Error setting Deepseek prompt:', err);
                        resolve(false);
                    }
                });
            },
            debug: {
                logDOM: () => {
                    debug.log('Deepseek input:', document.getElementById('chat-input'));
                }
            }
        }
    };

    let modalRef = null;
    let overlayRef = null;
    let DEFAULT_PROMPTS = {};  // 默认 Prompt 列表 (GM_Value)

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

    // 站点判断
    function getCurrentSite() {
        const url = window.location.href;
        if(url.includes('aistudio.google.com')) return SITES.GEMINI;
        if(url.includes('chatgpt.com')) return SITES.CHATGPT;
        if(url.includes('claude.ai')) return SITES.CLAUDE;
        if(url.includes('chat.deepseek.com')) return SITES.DEEPSEEK;

        // return null;
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
        const savedPrompts = GM_getValue('prompts');
        if (!savedPrompts) {
            GM_setValue('prompts', DEFAULT_INITIAL_PROMPTS);
            return DEFAULT_INITIAL_PROMPTS;
        }
        return savedPrompts;
    }

    // 保存新提示词、更新列表
    function saveNewPrompt(id, content) {
        DEFAULT_PROMPTS[id] = content;
        GM_setValue('prompts', DEFAULT_PROMPTS);
        updatePromptSelect();
        debug.log('New prompt saved:', id);
    }

    // 网页 Prompt 设置（含重试机制）
    function setPromptWithRetry(site, prompt, maxRetries = CONFIG.maxRetries) {
        return new Promise(async (resolve, reject) => {
            let attempts = 0;
            
            const trySetPrompt = async () => {
                try {
                    const config = siteConfigs[site];
                    if(!config || !config.setPrompt) {
                        return reject(new Error(`No prompt setter configured for site: ${site}`));
                    }
                    
                    const success = await config.setPrompt(prompt);
                    if (success) {
                        resolve(true);
                    } else if (attempts < maxRetries) {
                        attempts++;
                        debug.log(`Retrying prompt set, attempt ${attempts}`);
                        setTimeout(trySetPrompt, CONFIG.retryDelay);
                    } else {
                        reject(new Error('Failed to set prompt after max retries'));
                    }
                } catch (err) {
                    if (attempts < maxRetries) {
                        attempts++;
                        debug.log(`Error setting prompt, retrying: ${err}`);
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
    function createStyles() {
        const style = document.createElement('style');
        const currentSite = getCurrentSite();
        const theme = themeConfigs[currentSite];

        style.textContent = `
            .illusion-button {
                position: fixed;
                width: ${siteConfigs[currentSite].buttonSize};
                height: ${siteConfigs[currentSite].buttonSize};
                border-radius: 12px;
                background: ${theme.button.bg};
                border: 1px solid ${theme.border};
                cursor: move;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                z-index: 10000;
                transition: opacity 0.3s;
                user-select: none;
                touch-action: none;
                transition: left 0.1s linear, top 0.1s linear;
            }

            .illusion-button.docked {
                opacity: 0.5;
            }

            .illusion-button:hover {
                opacity: 1;
                background: ${theme.button.hover};
            }

            .illusion-button.dragging:active {
                background: ${theme.button.hover};
                box-shadow: 0 6px 12px rgba(0,0,0,0.4);
            }

            .illusion-panel {
                position: fixed;
                right: 80px;
                top: 50%;
                transform: translateY(-50%);
                width: 320px;
                background: ${theme.panel.bg};
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                display: none;
                z-index: 10000;
                font-family: system-ui, -apple-system, sans-serif;
                padding: 16px;
                color: ${theme.text};
                border: 1px solid ${theme.border};
            }

            .illusion-panel.visible {
                display: block;
            }

            .panel-title {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 16px;
                color: ${theme.text};
            }

            .prompt-select {
                width: 100%;
                padding: 8px;
                margin-bottom: 16px;
                border: 1px solid ${theme.border};
                border-radius: 6px;
                background: ${theme.secondary};
                color: ${theme.text};
            }

            .prompt-select option {
                background: ${theme.secondary};
                color: ${theme.text};
            }

            .button-group {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
            }

            .panel-button {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                background: ${theme.panel.buttonBg};
                color: ${theme.text};
                font-size: 14px;
                cursor: pointer;
                transition: background-color 0.2s;
                border: 1px solid ${theme.border};
            }

            .panel-button:hover {
                background: ${theme.panel.buttonHover};
            }

            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                display: none;
                z-index: 10000;
            }

            .modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: ${theme.panel.bg};
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                display: none;
                z-index: 10001;
                min-width: 400px;
                max-width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                border: 1px solid ${theme.border};
                color: ${theme.text};
            }

            .modal.visible,
            .modal-overlay.visible {
                display: block;
            }

            .modal-header {
                padding: 16px;
                border-bottom: 1px solid ${theme.border};
                font-weight: 600;
            }

            .modal-content {
                padding: 16px;
            }

            .modal-footer {
                padding: 16px;
                border-top: 1px solid ${theme.border};
                display: flex;
                justify-content: flex-end;
                gap: 8px;
            }

            .form-group {
                margin-bottom: 16px;
            }

            .form-label {
                display: block;
                margin-bottom: 8px;
                color: ${theme.text};
            }

            .form-input,
            .form-textarea {
                width: 100%;
                padding: 8px;
                border: 1px solid ${theme.border};
                border-radius: 6px;
                margin-bottom: 8px;
                background: ${theme.secondary};
                color: ${theme.text};
            }

            .form-textarea {
                min-height: 200px;
                resize: vertical;
                font-family: monospace;
                line-height: 1.5;
                padding: 12px;
            }

            .form-textarea:focus {
                outline: none;
                border-color: ${theme.text};
                box-shadow: 0 0 0 2px ${theme.border};
            }
        `;
        document.head.appendChild(style);
        debug.log('Styles added successfully');
    }

    function createButton() {
        const button = createElement('div', {
            className: 'illusion-button',
            'data-tooltip': 'Illusion',
            'data-tooltip-position': 'left',
            'aria-label': 'Illusion'
        });
        
        const currentSite = getCurrentSite();
        const config = siteConfigs[currentSite];
        
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
        
        const select = createElement('select', {
            className: 'prompt-select'
        });
        
        const defaultOption = createElement('option', {
            value: '',
            textContent: '选择 Prompt'
        });
        select.appendChild(defaultOption);
        
        Object.keys(DEFAULT_PROMPTS).forEach(id => {
            const option = createElement('option', {
                value: id,
                textContent: id
            });
            select.appendChild(option);
        });
        panel.appendChild(select);
        
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

    // 拖拽功能
    function makeDraggable(button) {
        let isDragging = false;
        let startX;
        let startY;
        let initialX;
        let initialY;
        let lastValidX;
        let lastValidY;
        let dragThrottle;

        function setButtonPosition(x, y) {
            button.style.left = x + 'px';
            button.style.top = y + 'px';
            GM_setValue('buttonPosition', { x, y });
        }

        function dragStart(e) {
            if (e.type === "touchstart") {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            } else {
                startX = e.clientX;
                startY = e.clientY;
            }
            
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

            let currentX, currentY;
            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX;
                currentY = e.touches[0].clientY;
            } else {
                currentX = e.clientX;
                currentY = e.clientY;
            }

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
        if(savedPosition) {
            setButtonPosition(savedPosition.x, savedPosition.y);
        } else {
            setButtonPosition(
                window.innerWidth - button.offsetWidth - 20, 
                window.innerHeight / 2 - button.offsetHeight / 2
            );
        }
    }

    // Modals
    function showNewPromptModal(modal, overlay) {
        try {
            debug.log('Opening new prompt modal...');
            
            const container = createElement('div');
            const header = createElement('div', {
                className: 'modal-header',
                textContent: 'New Prompt'
            });
            container.appendChild(header);

            const content = createElement('div', {
                className: 'modal-content'
            });
            const idGroup = createElement('div', {
                className: 'form-group'
            });
            const idLabel = createElement('label', {
                className: 'form-label',
                textContent: 'Prompt ID'
            });
            const idInput = createElement('input', {
                className: 'form-input',
                type: 'text',
                id: 'promptId',
                placeholder: '输入Prompt的标识名称',
                required: true
            });
            idGroup.appendChild(idLabel);
            idGroup.appendChild(idInput);
            content.appendChild(idGroup);

            const contentGroup = createElement('div', {
                className: 'form-group'
            });
            const contentLabel = createElement('label', {
                className: 'form-label',
                textContent: 'Prompt Content'
            });
            const contentInput = createElement('textarea', {
                className: 'form-textarea',
                id: 'promptContent',
                placeholder: '输入Prompt内容',
                required: true
            });
            contentGroup.appendChild(contentLabel);
            contentGroup.appendChild(contentInput);
            content.appendChild(contentGroup);

            container.appendChild(content);

            const footer = createElement('div', {
                className: 'modal-footer'
            });
            const cancelButton = createElement('button', {
                className: 'panel-button',
                textContent: 'Cancel',
                onclick: () => {
                    debug.log('Cancel button clicked');
                    modal.classList.remove('visible');
                    overlay.classList.remove('visible');
                }
            });

            const saveButton = createElement('button', {
                className: 'panel-button',
                textContent: 'Save',
                onclick: () => {
                    debug.log('Save button clicked');
                    const id = idInput.value.trim();
                    const contentVal = contentInput.value.trim();
                    
                    if (id && contentVal) {
                        try {
                            saveNewPrompt(id, contentVal);
                            debug.log('New prompt saved successfully:', id);
                            modal.classList.remove('visible');
                            overlay.classList.remove('visible');
                        } catch (err) {
                            debug.error('Error saving new prompt:', err);
                            alert('保存失败，请重试');
                        }
                    } else {
                        debug.warn('Missing required fields');
                        alert('请填写所有必填字段');
                    }
                }
            });

            footer.appendChild(cancelButton);
            footer.appendChild(saveButton);
            container.appendChild(footer);

            modal.textContent = '';
            modal.appendChild(container);
            
            modal.classList.add('visible');
            overlay.classList.add('visible');

            setTimeout(() => idInput.focus(), 100);
            
            debug.log('Modal opened successfully');
        } catch (error) {
            debug.error('Error showing new prompt modal:', error);
            alert('打开编辑器失败，请重试');
        }
    }

    function showEditPromptModal(modal, overlay, id, content) {
        debug.log('Opening edit modal for prompt:', id);
        const container = createElement('div');

        const header = createElement('div', {
            className: 'modal-header',
            textContent: 'Edit Prompt'
        });
        container.appendChild(header);

        const modalContent = createElement('div', {
            className: 'modal-content'
        });

        const idGroup = createElement('div', {
            className: 'form-group'
        });
        const idLabel = createElement('label', {
            className: 'form-label',
            textContent: 'Prompt ID'
        });
        const idInput = createElement('input', {
            className: 'form-input',
            type: 'text',
            value: id,
            disabled: true
        });
        idGroup.appendChild(idLabel);
        idGroup.appendChild(idInput);
        modalContent.appendChild(idGroup);

        const contentGroup = createElement('div', {
            className: 'form-group'
        });
        const contentLabel = createElement('label', {
            className: 'form-label',
            textContent: 'Prompt Content'
        });
        
        const textarea = createElement('textarea', {
            className: 'form-textarea',
            textContent: content
        });
        
        contentGroup.appendChild(contentLabel);
        contentGroup.appendChild(textarea);
        modalContent.appendChild(contentGroup);

        container.appendChild(modalContent);

        const footer = createElement('div', {
            className: 'modal-footer'
        });
        
        const cancelButton = createElement('button', {
            className: 'panel-button',
            textContent: 'Cancel',
            onclick: () => {
                modal.classList.remove('visible');
                overlay.classList.remove('visible');
            }
        });

        const updateButton = createElement('button', {
            className: 'panel-button',
            textContent: 'Update',
            onclick: () => {
                const newContent = textarea.value.trim();
                if (newContent) {
                    debug.log('Updating prompt:', id);
                    DEFAULT_PROMPTS[id] = newContent;
                    GM_setValue('prompts', DEFAULT_PROMPTS);
                    modal.classList.remove('visible');
                    overlay.classList.remove('visible');
                    showManagePromptsModal(modal, overlay);
                    updatePromptSelect();
                } else {
                    alert('Prompt内容不能为空');
                }
            }
        });

        footer.appendChild(cancelButton);
        footer.appendChild(updateButton);
        container.appendChild(footer);

        modal.textContent = '';
        modal.appendChild(container);
        modal.classList.add('visible');
        overlay.classList.add('visible');

        setTimeout(() => textarea.focus(), 100);
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

        Object.entries(DEFAULT_PROMPTS).forEach(([id, promptContent]) => {
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
                        delete DEFAULT_PROMPTS[id];
                        GM_setValue('prompts', DEFAULT_PROMPTS);
                        promptGroup.remove();
                        updatePromptSelect();
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
                modal.classList.remove('visible');
                overlay.classList.remove('visible');
            }
        });

        footer.appendChild(closeButton);
        container.appendChild(footer);

        modal.textContent = '';
        modal.appendChild(container);
        modal.classList.add('visible');
        overlay.classList.add('visible');
    }

    // Prompt选择器
    function updatePromptSelect() {
        const select = document.querySelector('.prompt-select');
        if (select) {
            select.textContent = '';
            
            const defaultOption = createElement('option', {
                value: '',
                textContent: '选择 Prompt'
            });
            select.appendChild(defaultOption);

            Object.keys(DEFAULT_PROMPTS).forEach(id => {
                const option = createElement('option', {
                    value: id,
                    textContent: id
                });
                select.appendChild(option);
            });
        }
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

        const promptSelect = panel.querySelector('.prompt-select');
        promptSelect.addEventListener('change', async (e) => {
            const selectedValue = e.target.value;
            const promptContent = DEFAULT_PROMPTS[selectedValue];
            
            if (promptContent) {
                debug.log('Setting prompt:', selectedValue);
                try {
                    const site = getCurrentSite();
                    const success = await setPromptWithRetry(site, promptContent);
                    if (success) {
                        debug.log('Prompt set successfully');
                    } else {
                        debug.error('Failed to set prompt');
                        alert('Failed to set prompt. Please try again.');
                    }
                } catch(err) {
                    debug.error('Error setting prompt:', err);
                    alert('Error setting prompt: ' + err.message);
                }
            }
        });

        const newPromptButton = panel.querySelector('button[data-action="new"]');
        newPromptButton.addEventListener('click', () => {
            debug.log('New prompt button clicked');
            showNewPromptModal(modal, overlay);
        });

        const manageButton = panel.querySelector('button[data-action="manage"]');
        manageButton.addEventListener('click', () => {
            debug.log('Manage button clicked');
            showManagePromptsModal(modal, overlay);
        });

        overlay.addEventListener('click', () => {
            modal.classList.remove('visible');
            overlay.classList.remove('visible');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('visible')) {
                modal.classList.remove('visible');
                overlay.classList.remove('visible');
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

            DEFAULT_PROMPTS = loadPrompts();

            // 针对不同站点，等待编辑器元素
            let editorSelector;
            if (currentSite === SITES.CLAUDE) {
                editorSelector = 'div.ProseMirror[contenteditable=true]';
            } else if (currentSite === SITES.DEEPSEEK) {
                editorSelector = '#chat-input';
            } else {
                // Gemini, ChatGPT 默认选择 textarea[placeholder]
                editorSelector = 'textarea[placeholder]';
            }
            
            try {
                await waitForElement(editorSelector);
                debug.log('Editor element found');
            } catch(err) {
                debug.error('Editor element not found:', err);
                return;
            }

            createStyles();
            const button = createButton();
            const panel = createPanel();
            const { modal, overlay } = createModal();

            setupEventListeners(button, panel, modal, overlay);
            
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
