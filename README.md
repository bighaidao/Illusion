# Illusion
幻觉（Illusion）是一个精简的跨平台 Prompts 管理工具，支持在以下 AI 平台使用：Google AI Studio, OpenAI ChatGPT, Anthropic Claude 和 DeepSeek Chat。

## 使用场景
1. **长文本结构化**
> 我习惯一次发送带有多个代码文件或组成部分的提示词，但不喜欢手动敲反引号、XML标签或换行。

2. **缺少自定义指令的对话窗口**
> 我使用的是 DeepSeek Chat 网页，这儿没有 Project, 常用的提示词的利用有些不方便。
> 又或者像 DeepSeek 官方所推荐的，我想用 提示词模板 + 模板变量 构成的复杂提示词来获得更加令人满意的响应。

3. **替代 ChatGPT Project Instructions**
> 我有经常重复使用的 Prompt 和 ChatGPT 订阅。ChatGPT Project 非推理模型对项目的指令服从性很差。
> 暂且不谈它的检索效果，光是遗忘指令这一条，就让它的整体表现远不如 Claude Project。所以，我正在寻找一个替代的解决方案。

## 功能概述
幻觉（Illusion）是一个精简的跨平台 Prompts 管理工具，支持在以下平台使用：
- Google AI Studio
- OpenAI ChatGPT
- Anthropic Claude
- DeepSeek Chat

主要功能包括：
1. **Prompts 管理**
   - 创建、编辑、删除自定义 Prompts
   - 快速查找和使用（输入）已保存的 Prompts

2. **跨平台支持**
   - 自动识别当前使用的 AI 平台
   - 统一的操作界面和体验
   - 适配多个平台的 Prompts 输入方式


## 安装说明
1. 确保已安装用户脚本管理器（如 Tampermonkey 或脚本猫）
2. 访问 Greasy Fork 上的 Illusion 脚本页面（本页面）
3. 点击 "安装" 按钮
4. 确认安装并启用脚本

## 使用指南
### 基本操作
1. **访问支持的平台**
   - 打开任一支持的平台（AI Studio、ChatGPT、Claude 或 DeepSeek Chat）
   - 页面右下份会出现 Illusion 的图标

2. **打开控制面板**
   - 点击图标打开控制面板
   - 面板包含以下主要功能：
     - Prompts 搜索
     - Prompts 新建与管理

3. **使用 Prompts**
   - 在搜索框中输入或选择 Prompt
   - 选中的 Prompt 会自动插入到当前平台的输入框中

4. **记录新的 Prompt**
   - 点击 "New Prompt" 按钮
   - 填写 Prompt ID 和内容
   - 保存后即可使用

5. **管理 Prompts**
   - 点击 "Manage" 按钮
   - 查看所有已保存的 Prompts
   - 支持编辑和删除操作

6. **自定义主题**
   - 支持通过修改脚本中的 Github 直链及其对应的 THEMES.json 文件自定义样式
   - 支持自定义以下元素：按钮颜色、面板背景、文字颜色、边框样式等


## 常见问题
### 1. 脚本不工作怎么办？
   - 检查是否安装了用户脚本管理器
   - 确认脚本已启用
   - 刷新页面后重试

### 2. Prompts 数据会丢失吗？
   - 数据存储在本地，除非本地存储空间已满，否则不会自动清除
   - 如果您的 prompts 库数量庞大或是投入了大量心血，建议不定期导出备份

### 3. 如何反馈问题或建议？
   - 通过 Greasy Fork 的反馈页面
   - 提交 [issue](https://github.com/cattail-mutt/Illusion/issues)

## 界面预览
- 适配 Claude, ChatGPT, DeepSeek 的浅色主题
- 适配 Google AI Studio 的深色主题
  
![claude.ai](https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/resources/images/claude.png)
![chatgpt.com](https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/resources/images/chatgpt.png)
![aistudio.google.com](https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/resources/images/aistudio.png)
![chat.deepseek.com](https://raw.githubusercontent.com/cattail-mutt/Illusion/refs/heads/main/resources/images/deepseek.png)
