# Illusion
Illusion 是一个精简的跨平台提示词管理工具，支持在 Google AI Studio、OpenAI ChatGPT、Anthropic Claude, DeepSeek Chat 和 Grok 等 AI 平台上使用。
它帮助用户高效管理和复用提示词，替代手动输入或平台内置的自定义指令功能。

## 目录
- [Illusion](#illusion)
  - [目录](#目录)
  - [使用场景](#使用场景)
  - [支持的平台](#支持的平台)
  - [安装说明](#安装说明)
  - [使用指南](#使用指南)
    - [基本操作](#基本操作)
  - [常见问题](#常见问题)
- [Illusion Mini](#illusion-mini)

## 使用场景
1. **取代机械输入、提升效率**
> 我习惯一次发送带有多个代码文件或组成部分的提示词，但来回手动敲 XML标签、注释符号，或 "请以中文为主要主要组织回复" 真的很累。

2. **替代 Project/Customized Instruction**
> 我有复用率很高的提示词和 ChatGPT 订阅，可是我发现 ChatGPT Project 的非推理模型对项目的指令服从性比较差。
>
> 暂且不谈它的检索效果，光是遗忘指令这一条，就让它的整体表现远不如 Claude Project。所以，我正在寻找一个替代的解决方案。
> 
> 我使用的是 DeepSeek Chat 网页，这儿没有 Project, 常用的提示词的利用有些不方便。而且我想像 DeepSeek 官方所推荐的那样，用将复用的指令和输入构成的复杂的提示词，发送给模型，从而在某些模型身上得到比自定义指令、系统提示词下的对话更加令人满意的结果。

## 支持的平台
- Google AI Studio
- OpenAI ChatGPT
- Anthropic Claude
- DeepSeek Chat
- Grok

## 安装说明
1. 安装用户脚本管理器（如 Tampermonkey 或脚本猫）。
2. 访问 Greasy Fork 上的 [Illusion](https://greasyfork.org/zh-CN/scripts/527451-%E5%B9%BB%E8%A7%89-illusion) 脚本页面。
3. 点击“安装”按钮并确认启用脚本。

## 使用指南
### 基本操作
1. **访问支持的平台**  
   打开任一支持的 AI 平台，页面右下角会出现 Illusion 图标。

2. **打开控制面板**  
   点击图标，弹出包含提示词搜索、选择和管理功能的面板。

3. **快速输入提示词**  
   在搜索框中输入或选择提示词，选中的提示词会自动插入到平台的输入框中。

4. **记录新提示词**  
   点击“New”按钮，填写 Prompt ID 和内容后保存。

5. **管理提示词**  
   点击“Manage”按钮，可查看、编辑或删除已保存的提示词。

## 常见问题
### 1. 脚本不工作怎么办？
- 确认已安装用户脚本管理器并启用脚本。
- 刷新页面，打开开发者工具（右键 → 检查 → 控制台），查看错误信息。
- 如需帮助，可提交 [GitHub Issue](https://github.com/cattail-mutt/Illusion/issues) 或 [Greasy Fork 反馈](https://greasyfork.org/zh-CN/scripts/527451-%E5%B9%BB%E8%A7%89-illusion/feedback)。
### 2. 提示词数据会丢失吗？
- 数据存储在本地，通常不会丢失，除非存储空间满或脚本被删除。
- 如果您的提示词"数据体量"较大，或是投入了大量心血，建议不定期导出备份，以防万一。

### 3. 如何反馈问题或建议？
- 提出 [GitHub Issues](https://github.com/cattail-mutt/Illusion/issues)
- 通过 [Greasy Fork 反馈](https://greasyfork.org/zh-CN/scripts/527451-%E5%B9%BB%E8%A7%89-illusion/feedback) 

## 界面预览
![aistudio.google.com](https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/image/example/aistudio.png)
![chatgpt.com](https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/image/example/chatgpt.png)
![claude.ai](https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/image/example/claude.png)
![chat.deepseek.com](https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/image/example/deepseek.png)
![grok.com](https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/image/example/grok.png)

# Illusion Mini
Illusion Mini 是 Illusion 的轻量版，支持相同平台，但更适合偏好自定义配置的用户。

> Illusion Mini 提供与 Illusion 相同的平台支持，但其功能设计更为精简。
> 
> 目前，用户需要根据自身的提示词列表手动创建并维护 JSON 文件，以实现个性化配置。
>
> Illusion Mini 的核心特性是 **提示词候选** 功能。通过键入触发字符（默认为 '￥'），用户可以激活提示词建议列表，从而简化操作、快速搜索和选择提示词。
>
> Illusion Mini 去除了 UI 组件并对 CSS 样式进行了简化，还在 TextArea 和 富文本编辑器 的基础上新增了将内容复制到剪贴板的回退机制，自定义配置更加灵活和方便。
