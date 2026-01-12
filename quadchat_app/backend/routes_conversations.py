"""
Conversation API routes for QuadChat (no auth - local use)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

from database import query_one, execute_returning, execute, get_db

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


# Request/Response Models
class CreateConversationRequest(BaseModel):
    title: str
    system_prompt: Optional[str] = ""
    documents: Optional[List[dict]] = []


class RenameConversationRequest(BaseModel):
    title: str


class UpdateConversationRequest(BaseModel):
    title: Optional[str] = None
    system_prompt: Optional[str] = None
    documents: Optional[List[dict]] = None
    provider_settings: Optional[dict] = None


class ConversationSummary(BaseModel):
    id: int
    title: str
    created_at: str
    updated_at: str


class Message(BaseModel):
    id: int
    role: str
    content: str
    model: Optional[str]
    timestamp: str


class ConversationDetail(BaseModel):
    id: int
    title: str
    created_at: str
    updated_at: str
    messages: List[Message]


def parse_timestamp(ts):
    """Parse timestamp to ISO format string"""
    if ts is None:
        return None
    if isinstance(ts, str):
        return ts
    return ts.isoformat()


def parse_json_field(value, default):
    """Parse a JSON field that might be a string or already parsed"""
    if value is None:
        return default
    if isinstance(value, str):
        try:
            return json.loads(value)
        except:
            return default
    return value


@router.get("")
async def list_conversations():
    """List all conversations"""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, title, created_at, updated_at
            FROM conversations
            ORDER BY updated_at DESC
            """
        )
        conversations = cur.fetchall()

    return {
        "conversations": [
            {
                "id": c["id"],
                "title": c["title"],
                "created_at": parse_timestamp(c["created_at"]),
                "updated_at": parse_timestamp(c["updated_at"])
            }
            for c in conversations
        ]
    }


@router.post("")
async def create_conversation(request: CreateConversationRequest):
    """Create a new conversation"""
    if not request.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")

    conversation = execute_returning(
        """
        INSERT INTO conversations (title, system_prompt, documents)
        VALUES (%s, %s, %s)
        RETURNING id, title, system_prompt, documents, created_at, updated_at
        """,
        (request.title.strip(), request.system_prompt or "", json.dumps(request.documents or []))
    )

    return {
        "id": conversation["id"],
        "title": conversation["title"],
        "system_prompt": conversation["system_prompt"] or "",
        "documents": parse_json_field(conversation["documents"], []),
        "created_at": parse_timestamp(conversation["created_at"]),
        "updated_at": parse_timestamp(conversation["updated_at"])
    }


@router.get("/{conversation_id}")
async def get_conversation(conversation_id: int):
    """Get a single conversation with all messages"""
    with get_db() as conn:
        cur = conn.cursor()

        # Get conversation
        cur.execute(
            """
            SELECT id, title, system_prompt, documents, provider_settings, created_at, updated_at
            FROM conversations
            WHERE id = ?
            """,
            (conversation_id,)
        )
        conversation = cur.fetchone()

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Get messages (order by id to ensure user messages come before their responses)
        cur.execute(
            """
            SELECT id, role, content, model, timestamp
            FROM messages
            WHERE conversation_id = ?
            ORDER BY id ASC
            """,
            (conversation_id,)
        )
        messages = cur.fetchall()

    return {
        "id": conversation["id"],
        "title": conversation["title"],
        "system_prompt": conversation["system_prompt"] or "",
        "documents": parse_json_field(conversation["documents"], []),
        "provider_settings": parse_json_field(conversation["provider_settings"], {}),
        "created_at": parse_timestamp(conversation["created_at"]),
        "updated_at": parse_timestamp(conversation["updated_at"]),
        "messages": [
            {
                "id": m["id"],
                "role": m["role"],
                "content": m["content"],
                "model": m["model"],
                "timestamp": parse_timestamp(m["timestamp"])
            }
            for m in messages
        ]
    }


@router.patch("/{conversation_id}")
async def update_conversation(
    conversation_id: int,
    request: UpdateConversationRequest
):
    """Update a conversation (title, system_prompt, documents)"""
    # Check if conversation exists
    conversation = query_one(
        "SELECT id FROM conversations WHERE id = %s",
        (conversation_id,)
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Build dynamic update query
    updates = []
    params = []

    if request.title is not None:
        if not request.title.strip():
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        updates.append("title = ?")
        params.append(request.title.strip())

    if request.system_prompt is not None:
        updates.append("system_prompt = ?")
        params.append(request.system_prompt)

    if request.documents is not None:
        updates.append("documents = ?")
        params.append(json.dumps(request.documents))

    if request.provider_settings is not None:
        updates.append("provider_settings = ?")
        params.append(json.dumps(request.provider_settings))

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.append(conversation_id)

    updated = execute_returning(
        f"""
        UPDATE conversations
        SET {', '.join(updates)}
        WHERE id = ?
        RETURNING id, title, system_prompt, documents, provider_settings, created_at, updated_at
        """,
        tuple(params)
    )

    return {
        "id": updated["id"],
        "title": updated["title"],
        "system_prompt": updated["system_prompt"] or "",
        "documents": parse_json_field(updated["documents"], []),
        "provider_settings": parse_json_field(updated["provider_settings"], {}),
        "created_at": parse_timestamp(updated["created_at"]),
        "updated_at": parse_timestamp(updated["updated_at"])
    }


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: int):
    """Delete a conversation and all its messages"""
    # Check if exists
    conversation = query_one(
        "SELECT id, title FROM conversations WHERE id = %s",
        (conversation_id,)
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Delete messages first (SQLite foreign keys need explicit enable)
    execute("DELETE FROM messages WHERE conversation_id = %s", (conversation_id,))
    execute("DELETE FROM conversations WHERE id = %s", (conversation_id,))

    return {
        "success": True,
        "message": f"Conversation '{conversation['title']}' deleted"
    }
