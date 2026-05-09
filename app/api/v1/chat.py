from fastapi import APIRouter
from app.models.schemas import ChatRequest
from fastapi.responses import StreamingResponse
from app.agents.personal_chief import search_recipes, get_messages, clear_messages
from app.common.logger import logger
import uuid

router = APIRouter()


@router.post("/chat/stream")
async def chat_endpoint(request: ChatRequest):
    """流式对话"""
    logger.info(f"收到聊天请求: message={request.message[:50]}, image_url={request.image_url}, thread_id={request.thread_id}")

    return StreamingResponse(
        search_recipes(request.message, request.image_url, request.thread_id),
        media_type="text/event-stream"
    )


@router.post("/chat/session")
async def create_session():
    """新建会话，返回新的thread_id"""
    thread_id = str(uuid.uuid4())
    logger.info(f"创建新会话: thread_id={thread_id}")
    return {"thread_id": thread_id}


@router.get("/chat/messages")
async def get_chat_messages(thread_id: str):
    """获取历史消息"""
    messages = get_messages(thread_id)
    return {"messages": messages}


@router.delete("/chat/messages")
async def clear_chat_messages(thread_id: str):
    """清空历史消息"""
    clear_messages(thread_id)
    return {"success": True}