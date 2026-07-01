# 王舒龙该记单词了！

一个基于 React + Vite 的小学英语单词记忆系统，帮助你高效学习和记忆英语单词。

## ✨ 功能特点

### 📝 四种题型
- **中文选英文**：根据中文释义选择正确的英文单词
- **英文选中文**：根据英文单词选择正确的中文释义
- **填空补全**：根据提示补全单词中缺失的字母
- **听音拼写**：听单词发音后拼写完整单词

### 📚 错题本机制
- 智能追踪特定错题类型
- 错题复测场景支持
- 四题全对才算完全掌握
- 错题本未清空时提醒复习

### 🔊 单词发音
- 使用 Web Speech API 实现单词发音
- 发音按钮位于单词右侧，方便随时听读

### 📊 进度追踪
- 每日计划进度条
- 总体单词进度条
- 基于已掌握单词数量计算进度
- LocalStorage 持久化存储今日进度
- 每日自动重置学习进度

### 🎉 学习分享
- 使用 Canvas API 生成学习成果图片
- 分享今日学习成就

### 🎨 界面设计
- 计划选择页面随机显示 emoji 图片
- 响应式设计，适配不同屏幕尺寸
- 黑色黑体标题："王舒龙该记单词了！"

## 🛠️ 技术栈

- **React 18** - 前端框架
- **Vite 5** - 构建工具
- **Web Speech API** - 语音合成
- **Canvas API** - 图片生成
- **LocalStorage** - 数据持久化
- **Cloudflare Pages** - 部署平台

## 📁 项目结构

```
english-quiz/
├── public/
│   ├── audio/          # 音频文件
│   ├── emoji/          # 表情图片
│   ├── images/         # 图片资源
│   └── favicon.ico     # 网站图标
├── src/
│   ├── components/     # React 组件
│   │   ├── ProgressBar.jsx    # 进度条组件
│   │   ├── QuizCard.jsx       # 答题卡片组件
│   │   └── RewardModal.jsx    # 奖励弹窗组件
│   ├── data/           # 数据文件
│   │   └── words.json  # 单词数据
│   ├── App.jsx         # 主应用组件
│   ├── main.jsx        # 应用入口
│   ├── index.css       # 全局样式
│   └── useQuizLogic.js # 答题逻辑 Hook
├── .gitignore          # Git 忽略文件
├── index.html          # HTML 模板
├── package.json        # 项目配置
├── vite.config.js      # Vite 配置
├── wrangler.jsonc      # Cloudflare 部署配置
└── README.md           # 项目说明
```

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:5173/ 查看应用。

### 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist/` 目录。

### 预览生产版本

```bash
npm run preview
```

## ⚠️ PowerShell 执行策略问题

如果在 Windows PowerShell 中运行 `npm run dev` 时报错：

> 无法加载文件 xxx\npm.ps1，因为在此系统上禁止运行脚本。

请执行以下命令修改执行策略：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

然后重新运行 `npm run dev`。

## 🚢 部署

项目已配置 Cloudflare Pages 部署，推送代码到 GitHub 仓库即可自动触发部署。

### 使用 Wrangler 部署

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
wrangler pages deploy dist
```

## 📖 使用指南

1. **选择每日计划**：在计划页面选择每日学习单词数量（默认 5 个）
2. **开始学习**：点击"开始学习"按钮进入学习模式
3. **答题**：根据不同题型回答问题，点击发音按钮可听单词发音
4. **查看进度**：通过进度条了解学习进度
5. **分享成果**：学习完成后可生成并分享学习成果图片
6. **错题复习**：系统会自动追踪错题，确保完全掌握

## 📝 单词数据格式

`src/data/words.json` 中的单词数据格式如下：

```json
[
  {
    "word": "name",
    "meaning": "名字;名称"
  },
  {
    "word": "hello",
    "meaning": "你好;喂"
  }
]
```

## 📄 许可证

MIT License
