"""
Message API routes for QuadChat (no auth - local use)
Uses API keys from .env file
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict

from database import query_one, get_db
from ai_providers import AIProviderManager

router = APIRouter(prefix="/api/conversations", tags=["messages"])


class SendMessageRequest(BaseModel):
    message: str
    provider: str
    system_prompt: str = ""
    model: Optional[str] = None
    skip_user_message: bool = False  # Skip saving user message (for batch requests)


class MessageResponse(BaseModel):
    user_message: dict
    assistant_message: dict


def parse_timestamp(ts):
    """Parse timestamp to ISO format string"""
    if ts is None:
        return None
    if isinstance(ts, str):
        return ts
    return ts.isoformat()


@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: int,
    request: SendMessageRequest
):
    """Send a message in a conversation, get AI response, save both"""

    # Check conversation exists
    conversation = query_one(
        "SELECT id FROM conversations WHERE id = %s",
        (conversation_id,)
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Get existing messages for context - filter to only this provider's messages
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT role, content, model
            FROM messages
            WHERE conversation_id = ?
            ORDER BY id ASC
            """,
            (conversation_id,)
        )
        all_messages = cur.fetchall()

    # Filter history: only include user messages that this provider responded to
    def is_provider_message(model, provider_id):
        """Check if a model string matches the provider"""
        if not model:
            return False
        model_lower = model.lower()
        # OpenAI models: gpt-*, o3, o4-mini
        if provider_id == 'openai' or provider_id.startswith('gpt') or provider_id.startswith('o3') or provider_id.startswith('o4'):
            return 'gpt' in model_lower or model_lower.startswith('o3') or model_lower.startswith('o4') or 'openai' in model_lower
        elif provider_id == 'claude' or provider_id.startswith('claude'):
            return 'claude' in model_lower
        elif provider_id == 'gemini' or provider_id.startswith('gemini'):
            return 'gemini' in model_lower
        elif provider_id == 'grok' or provider_id.startswith('grok'):
            return 'grok' in model_lower
        return False

    # Build history: only include user messages that have a response from this provider
    history = []
    current_user_msg = None
    for m in all_messages:
        if m["role"] == "user":
            current_user_msg = m["content"]
        elif m["role"] == "assistant" and is_provider_message(m["model"], request.provider):
            if current_user_msg:
                history.append({"role": "user", "content": current_user_msg})
                current_user_msg = None
            history.append({"role": "assistant", "content": m["content"]})

    # Build messages for AI
    messages = history + [{"role": "user", "content": request.message}]

    # Call AI provider (uses .env API keys automatically)
    try:
        reply = AIProviderManager.chat(
            provider_id=request.provider,
            messages=messages,
            system_prompt=request.system_prompt,
            model=request.model
        )
    except Exception as e:
        import traceback
        print(f"AI Provider Error ({request.provider}): {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI provider error: {str(e)}")

    # Save messages to database
    with get_db() as conn:
        cur = conn.cursor()
        user_msg = None

        # Only save user message if not skipping (for batch requests, first call saves it)
        if not request.skip_user_message:
            cur.execute(
                """
                INSERT INTO messages (conversation_id, role, content, model)
                VALUES (?, 'user', ?, NULL)
                """,
                (conversation_id, request.message)
            )
            user_msg_id = cur.lastrowid
            cur.execute("SELECT id, role, content, model, timestamp FROM messages WHERE id = ?", (user_msg_id,))
            user_msg = cur.fetchone()

        # Save assistant message with actual model used
        model_used = request.model if request.model else request.provider
        cur.execute(
            """
            INSERT INTO messages (conversation_id, role, content, model)
            VALUES (?, 'assistant', ?, ?)
            """,
            (conversation_id, reply, model_used)
        )
        assistant_msg_id = cur.lastrowid
        cur.execute("SELECT id, role, content, model, timestamp FROM messages WHERE id = ?", (assistant_msg_id,))
        assistant_msg = cur.fetchone()

        # Update conversation updated_at
        cur.execute(
            "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (conversation_id,)
        )

        conn.commit()

    return {
        "user_message": {
            "id": user_msg["id"] if user_msg else None,
            "role": user_msg["role"] if user_msg else "user",
            "content": user_msg["content"] if user_msg else request.message,
            "model": user_msg["model"] if user_msg else None,
            "timestamp": parse_timestamp(user_msg["timestamp"]) if user_msg else None
        } if user_msg else None,
        "assistant_message": {
            "id": assistant_msg["id"],
            "role": assistant_msg["role"],
            "content": assistant_msg["content"],
            "model": assistant_msg["model"],
            "timestamp": parse_timestamp(assistant_msg["timestamp"])
        }
    }
