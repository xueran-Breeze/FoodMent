# FoodMoment - AI智能私厨助手

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![LangChain](https://img.shields.io/badge/LangChain-Latest-orange.svg)](https://python.langchain.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Latest-purple.svg)](https://langchain-ai.github.io/langgraph/)

## 📖 项目简介

FoodMoment 是一款基于多模态大语言模型的AI智能私厨助手。用户只需拍摄食材照片或输入食材清单，系统即可：

- 🔍 **智能识别食材**：自动辨识图片中的食材种类和新鲜度
- 🌐 **实时搜索食谱**：调用Tavily搜索引擎获取最新菜谱
- 📊 **多维度评估**：从营养价值和制作难度量化打分
- 💬 **流式对话体验**：实时返回AI响应，无需等待
- 💾 **会话持久化**：基于SQLite的会话历史存储

## ✨ 核心功能

- ✅ 支持图片+文本多模态输入（通义千问qwen3.6-plus）
- ✅ 会话历史持久化存储（LangGraph SqliteSaver）
- ✅ 阿里云OSS图片上传（预签名URL直传）
- ✅ SSE流式响应（逐字输出）
- ✅ 完整的RESTful API
- ✅ 线程隔离的会话管理（thread_id）

## 🏗️ 技术架构

### 核心技术栈

| 组件 | 技术选型 | 版本/说明 |
|------|---------|----------|
| Web框架 | FastAPI | 0.104+ 异步Web框架 |
| AI引擎 | LangChain + LangGraph | Agent编排与状态管理 |
| 大模型 | 通义千问 qwen3.6-plus | 阿里云DashScope多模态模型 |
| 搜索引擎 | Tavily Search | 专业Web搜索API |
| 对象存储 | 阿里云OSS | 图片存储服务 |
| 数据库 | SQLite | 轻量级会话存储（LangGraph管理） |
| 日志系统 | Python logging | 结构化日志记录 |

### 架构说明

```
┌─────────────────────────────────────────────┐
│          前端界面 (Next.js静态资源)           │
└──────────────────┬──────────────────────────┘
                   │ HTTP请求
                   ▼
┌─────────────────────────────────────────────┐
│         FastAPI 应用层 (app/main.py)         │
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │ /api/v1/chat │  │  /api/v1/oss/presign │ │
│  └──────┬───────┘  └──────────┬───────────┘ │
└─────────┼────────────────────┼──────────────┘
          │                    │
          ▼                    ▼
┌──────────────────┐  ┌──────────────────────┐
│  LangGraph Agent │  │  Alibaba Cloud OSS   │
│  (prebuilt REACT)│  │  (预签名URL生成)      │
│                  │  └──────────────────────┘
│ • 多模态理解     │
│ • 工具调用       │
│ • 会话状态管理   │
└────────┬─────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌────────────────┐  ┌──────────────────┐
│ Tavily Search  │  │  SQLite Database │
│ (Web搜索工具)  │  │  (SqliteSaver)   │
└────────────────┘  └──────────────────┘
```

**关键说明**：
- 使用 LangGraph 的 `create_react_agent` 预构建Agent（非自定义工作流）
- LangGraph 的核心作用：**会话状态管理**、**持久化记忆**、**线程隔离**
- 通过 `checkpointer` 实现对话历史的自动保存和恢复

## 🚀 快速开始

### 1. 环境要求

- Python 3.10+
- pip包管理器

### 2. 安装依赖

```bash
pip install fastapi uvicorn python-dotenv
pip install langchain langchain-openai langgraph
pip install langchain-tavily
pip install alibabacloud-oss-v2
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# DashScope 千问模型
DASHSCOPE_API_KEY=your_api_key_here
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# Tavily 搜索API
TAVILY_API_KEY=your_tavily_key_here

# 阿里云OSS（可选，用于图片上传）
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
```

### 4. 启动服务

```bash
python -m app.main
```

服务将在 `http://127.0.0.1:8001` 启动

### 5. 访问应用

- **前端界面**: http://127.0.0.1:8001/
- **API文档**: http://127.0.0.1:8001/docs
- **ReDoc文档**: http://127.0.0.1:8001/redoc

## 📁 项目结构

```
FoodMoment/
├── app/
│   ├── agents/                  # AI Agent核心逻辑
│   │   └── personal_chief.py   # LangGraph ReAct Agent实现
│   ├── api/                     # API路由层
│   │   └── v1/
│   │       ├── chat.py         # 对话接口（4个端点）
│   │       └── oss.py          # OSS预签名URL接口
│   ├── common/                  # 公共模块
│   │   └── logger.py           # 日志配置
│   ├── db/                      # SQLite数据库（LangGraph管理）
│   │   └── personal_chief.db
│   ├── models/                  # 数据模型
│   │   └── schemas.py          # Pydantic请求模型
│   ├── static/                  # 前端静态资源（Next.js构建产物）
│   ├── __init__.py
│   └── main.py                  # FastAPI应用入口
├── .env                         # 环境变量配置（不提交到Git）
├── .gitignore
├── langgraph.json               # LangGraph配置文件
├── PROJECT_DESIGN.md            # 详细设计文档
├── LANGGRAPH_USAGE.md           # LangGraph使用说明
└── README.md                    # 项目说明文档
```

**代码统计**：
- 核心Agent逻辑：`app/agents/personal_chief.py` (127行)
- API路由：`app/api/v1/chat.py` (41行) + `oss.py` (66行)
- 总计约 **234行业务代码**，简洁高效

## 🔌 API接口

### 1. 创建会话

```bash
POST /api/v1/chat/session
```

**响应**:
```json
{
  "thread_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**说明**: 每次新对话前调用，获取唯一的会话ID

---

### 2. 流式对话（核心接口）

```bash
POST /api/v1/chat/stream
Content-Type: application/json

{
  "message": "这些食材能做什么菜？",
  "image_url": "https://example.com/photo.jpg",  // 可选
  "thread_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**响应**: Server-Sent Events (SSE) 流

**示例代码** (JavaScript):
```javascript
const response = await fetch('/api/v1/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '西红柿和鸡蛋能做什么？',
    thread_id: 'your-thread-id'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value);
  console.log(text); // 逐字输出
}
```

---

### 3. 获取历史消息

```bash
GET /api/v1/chat/messages?thread_id=550e8400-e29b-41d4-a716-446655440000
```

**响应**:
```json
{
  "messages": [
    {"role": "user", "content": "这些食材能做什么菜？"},
    {"role": "assistant", "content": "根据您提供的食材..."}
  ]
}
```

---

### 4. 清空会话历史

```bash
DELETE /api/v1/chat/messages?thread_id=550e8400-e29b-41d4-a716-446655440000
```

**响应**:
```json
{
  "success": true
}
```

---

### 5. 获取OSS上传URL

```bash
GET /api/v1/oss/presign?filename=photo.jpg
```

**响应**:
```json
{
  "uploadUrl": "https://bucket.oss-cn-hangzhou.aliyuncs.com/photo.jpg?signature=xxx",
  "contentType": "image/jpeg",
  "accessUrl": "https://bucket.oss-cn-hangzhou.aliyuncs.com/photo.jpg"
}
```

**使用流程**:
1. 调用此接口获取 `uploadUrl`
2. 前端直接 PUT 上传图片到 `uploadUrl`
3. 将 `accessUrl` 作为 `image_url` 参数传给对话接口

## 🛠️ 技术栈

| 组件 | 技术选型 | 说明 |
|------|---------|------|
| Web框架 | FastAPI | 高性能异步Web框架 |
| AI引擎 | LangChain + LangGraph | Agent编排与状态管理 |
| 大模型 | 通义千问 qwen3.6-plus | 阿里云DashScope多模态模型 |
| 搜索引擎 | Tavily Search | 专业Web搜索API |
| 对象存储 | 阿里云OSS | 图片存储服务 |
| 数据库 | SQLite | 轻量级会话存储（LangGraph管理） |

**依赖安装**:
```bash
pip install fastapi uvicorn python-dotenv
pip install langchain langchain-openai langgraph
pip install langchain-tavily
pip install alibabacloud-oss-v2
```

## 💡 LangGraph 使用说明

本项目使用 LangGraph 的 **预构建 ReAct Agent** (`create_react_agent`)，而非自定义工作流。

### LangGraph 的核心作用

1. **会话状态管理**: 自动维护对话历史
2. **持久化记忆**: 通过 `SqliteSaver` 将对话保存到SQLite
3. **线程隔离**: 每个 `thread_id` 独立维护会话状态
4. **流式执行**: 支持细粒度的流式输出控制

### 关键代码示例

**创建 Agent**:
```python
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.sqlite import SqliteSaver

checkpointer = SqliteSaver(sqlite3.connect("./db/personal_chief.db"))
agent = create_react_agent(
    model=model,
    tools=[web_search],
    checkpointer=checkpointer,
    state_modifier=system_prompt
)
```

**流式调用**:
```python
for chunk, metadata in agent.stream(
    {"messages": [message]},
    {"configurable": {"thread_id": thread_id}},
    stream_mode="messages"
):
    yield chunk.content
```

**详细说明请查看**: [LANGGRAPH_USAGE.md](LANGGRAPH_USAGE.md)

## 🔒 安全注意事项

- ⚠️ **切勿将 `.env` 文件提交到Git**（已加入 `.gitignore`）
- ⚠️ 生产环境使用HTTPS
- ⚠️ 定期轮换API密钥
- ⚠️ 限制CORS允许的域名（当前为 `*`，生产环境应指定具体域名）

## ❓ 常见问题

### Q1: Agent无响应？

**检查步骤**:
1. 确认 `.env` 中 `DASHSCOPE_API_KEY` 和 `TAVILY_API_KEY` 配置正确
2. 查看控制台日志是否有错误信息
3. 验证网络是否能访问 DashScope API 和 Tavily API

**测试API连通性**:
```bash
curl -H "Authorization: Bearer $DASHSCOPE_API_KEY" \
     https://dashscope.aliyuncs.com/compatible-mode/v1/models
```

---

### Q2: 图片上传失败？

**检查步骤**:
1. 确认 OSS AccessKey 有 PutObject 权限
2. 验证 Bucket 名称和 Region 是否正确
3. 确认预签名URL未过期（有效期1小时）

**解决方案**:
重新调用 `GET /api/v1/oss/presign?filename=new_photo.jpg` 获取新的上传URL

---

### Q3: 会话历史丢失？

**检查步骤**:
1. 确认 `app/db/personal_chief.db` 文件存在
2. 验证传入的 `thread_id` 是否与创建时一致
3. 检查数据库文件权限

**手动查询数据库**:
```bash
sqlite3 app/db/personal_chief.db
SELECT * FROM checkpoints WHERE thread_id = 'your-thread-id';
```

---

### Q4: 如何添加新工具？

在 `app/agents/personal_chief.py` 中：

```python
@tool
def my_new_tool(param: str):
    """工具描述文档字符串（Agent会读取这个）"""
    logger.info("my_new_tool: %s", param)
    # 实现逻辑
    return result

# 注册到Agent（第57行）
agent = create_react_agent(
    model=model,
    tools=[web_search, my_new_tool],  # 添加工具到这里
    checkpointer=checkpointer,
    state_modifier=system_prompt
)
```

## 📄 许可证

MIT License

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📧 联系方式

- **GitHub**: [xueran-Breeze](https://github.com/xueran-Breeze)
- **邮箱**: 2015336143@qq.com
- **项目Issues**: [FoodMoment Issues](https://github.com/xueran-Breeze/FoodMent/issues)

---

**⭐ 如果这个项目对你有帮助，请给个Star！**
