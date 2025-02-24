// ==UserScript==
// @name         幻觉（Illusion）
// @icon         https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/resources/icons/illusion.png
// @namespace    https://github.com/cattail-mutt
// @version      1.3
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
// @homepage     https://greasyfork.org/zh-CN/scripts/527451-%E5%B9%BB%E8%A7%89-illusion
// @downloadURL https://update.greasyfork.org/scripts/527451/%E5%B9%BB%E8%A7%89%EF%BC%88Illusion%EF%BC%89.user.js
// @updateURL https://update.greasyfork.org/scripts/527451/%E5%B9%BB%E8%A7%89%EF%BC%88Illusion%EF%BC%89.meta.js
// ==/UserScript==