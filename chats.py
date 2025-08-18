from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from limiter import limiter
from database import get_session
from models import User, ChatSession, ChatMessage
from dependencies import get_current_active_user
from chatbot_service import get_chatbot_response
from slowapi import Limiter
from langchain_core.messages import HumanMessage, AIMessage

CHAT_RATE_LIMIT = "30/minute"
router = APIRouter(
    prefix="/chats",
    tags=["Chats"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

# --- Pydantic Models (No changes) ---
class ChatMessageResponse(BaseModel):
    id: int
    content: str
    role: str

class ChatSessionResponse(BaseModel):
    id: int
    title: str

class ChatHistoryResponse(BaseModel):
    id: int
    title: str
    messages: List[ChatMessageResponse]

class NewChatMessageRequest(BaseModel):
    prompt: str
    session_id: Optional[int] = None

class RenameChatRequest(BaseModel):
    new_title: str

# # *** FIX: The function signature is corrected to accept chat_session_id (an int) ***
# async def stream_and_save_response(prompt: str, chat_session_id: int, chat_history: list, db: Session):
#     """
#     Streams the chatbot response and saves the full message.
#     Now accepts chat_session_id directly.
#     """
#     # *** FIX: Use the chat_session_id directly in the debug print statement ***
#     print(f"--- DEBUG: Starting stream for session {chat_session_id} ---")
    
#     # Pass the complete history to the chatbot service.
#     response_generator = get_chatbot_response(prompt, chat_history)
    
#     full_bot_response = ""
#     for chunk in response_generator:
#         full_bot_response += chunk
#         yield chunk
        
#     print(f"--- DEBUG: Finished streaming. Full response: '{full_bot_response}'")
    
#     bot_message_to_save = ChatMessage(
#         content=full_bot_response, 
#         role="model", 
#         # *** FIX: Use the chat_session_id directly when saving the message ***
#         session_id=chat_session_id
#     )
#     db.add(bot_message_to_save)
#     db.commit()
    
#     print(f"--- DEBUG: Saved bot response to DB for session {chat_session_id} ---")

# @router.post("/", summary="Post a new message and get a streaming response")
# def post_new_message(
#     *,
#     limiter: Limiter = Depends(lambda: limiter.limit(CHAT_RATE_LIMIT)),
#     request_data: NewChatMessageRequest,
#     session: Session = Depends(get_session),
#     current_user: User = Depends(get_current_active_user),
# ):
#     chat_session = None
#     if request_data.session_id:
#         chat_session = session.get(ChatSession, request_data.session_id)
#         if not chat_session or chat_session.user_id != current_user.id:
#             raise HTTPException(status_code=404, detail="Chat session not found")
#     else:
#         title = request_data.prompt[:100]
#         chat_session = ChatSession(title=title, user_id=current_user.id)
#         session.add(chat_session)
#         session.commit()
#         session.refresh(chat_session)

#     # *** FIX: Corrected History Assembly Logic ***
    
#     # 1. Fetch previous messages from the database.
#     statement = (
#         select(ChatMessage)
#         .where(ChatMessage.session_id == chat_session.id)
#         .order_by(ChatMessage.created_at)
#         .limit(10)
#     )
#     db_messages = session.exec(statement).all()

#     # 2. Format the fetched history for LangChain.
#     chat_history_for_chain = []
#     for msg in db_messages:
#         if msg.role == "user":
#             chat_history_for_chain.append(HumanMessage(content=msg.content))
#         elif msg.role == "model":
#             chat_history_for_chain.append(AIMessage(content=msg.content))

#     # 3. Save the NEW user message to the database.
#     user_message = ChatMessage(content=request_data.prompt, role="user", session_id=chat_session.id)
#     session.add(user_message)
#     session.commit()
#     print(f"--- DEBUG: User message '{request_data.prompt}' saved for session {chat_session.id}")

#     # *** FIX: Manually add the new user message to the history list AFTER saving it. ***
#     # This ensures the AI gets the absolute latest context.
#     chat_history_for_chain.append(HumanMessage(content=request_data.prompt))

#     # 4. Pass the prompt, session ID, and the correctly assembled history to the streaming function.
#     return StreamingResponse(
#         stream_and_save_response(request_data.prompt, chat_session.id, chat_history_for_chain, session),
#         media_type="text/plain; charset=utf-8"
#     )
# *** CHANGE: Modified to return session ID in response headers ***
def stream_and_save_response_with_headers(prompt: str, chat_session_id: int, chat_history: list, db_session: Session):
    """
    Streams the chatbot response and saves the full message.
    Now yields both content and session metadata.
    """
    print(f"--- DEBUG: Starting stream for session {chat_session_id} ---")
    print(f"--- DEBUG: Chat history length being passed: {len(chat_history)} ---")
   
    response_generator = get_chatbot_response(prompt, chat_history)
   
    full_bot_response = ""
    for chunk in response_generator:
        full_bot_response += chunk
        yield chunk
       
    print(f"--- DEBUG: Finished streaming. Full response: '{full_bot_response[:100]}...' ---")
   
    bot_message_to_save = ChatMessage(
        content=full_bot_response,
        role="model",
        session_id=chat_session_id
    )
    db_session.add(bot_message_to_save)
    
    try:
        db_session.commit()
        print(f"--- DEBUG: Successfully saved bot response to DB for session {chat_session_id} ---")
    except Exception as e:
        print(f"--- DEBUG: Error saving bot response to DB: {e} ---")
        db_session.rollback()
        raise


@router.post("/", summary="Post a new message and get a streaming response")
def post_new_message(
    *,
    limiter: Limiter = Depends(lambda: limiter.limit(CHAT_RATE_LIMIT)),
    request_data: NewChatMessageRequest,
    db_session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    chat_session = None
    # *** CHANGE: Track if we created a new session ***
    session_was_created = False
    
    if request_data.session_id:
        # *** ENHANCED DEBUG: Log the session ID being requested ***
        print(f"--- DEBUG: Looking for existing session ID: {request_data.session_id} ---")
        chat_session = db_session.get(ChatSession, request_data.session_id)
        if not chat_session or chat_session.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Chat session not found")
        print(f"--- DEBUG: Using existing session {chat_session.id} ---")
    else:
        # *** ENHANCED DEBUG: Log new session creation ***
        print(f"--- DEBUG: No session_id provided, creating new session ---")
        title = request_data.prompt[:100] if len(request_data.prompt) > 100 else request_data.prompt
        chat_session = ChatSession(title=title, user_id=current_user.id)
        db_session.add(chat_session)
        
        try:
            db_session.commit()
            db_session.refresh(chat_session)
            session_was_created = True  # *** CHANGE: Mark that we created a new session ***
            print(f"--- DEBUG: Created NEW chat session with ID: {chat_session.id} ---")
        except Exception as e:
            print(f"--- DEBUG: Error creating chat session: {e} ---")
            db_session.rollback()
            raise HTTPException(status_code=500, detail="Failed to create chat session")

    # Save the user message
    user_message = ChatMessage(
        content=request_data.prompt, 
        role="user", 
        session_id=chat_session.id
    )
    db_session.add(user_message)
    
    try:
        db_session.commit()
        print(f"--- DEBUG: User message saved for session {chat_session.id} ---")
    except Exception as e:
        print(f"--- DEBUG: Error saving user message: {e} ---")
        db_session.rollback()
        raise HTTPException(status_code=500, detail="Failed to save user message")

    # Fetch chat history (excluding current message)
    statement = (
        select(ChatMessage)
        .where(ChatMessage.session_id == chat_session.id)
        .order_by(ChatMessage.created_at)
        .limit(20)
    )
    db_messages = db_session.exec(statement).all()
    print(f"--- DEBUG: Fetched {len(db_messages)} messages from DB for session {chat_session.id} ---")

    # Format history for LangChain (excluding the current user message)
    chat_history_for_chain = []
    for msg in db_messages[:-1]:
        if msg.role == "user":
            chat_history_for_chain.append(HumanMessage(content=msg.content))
        elif msg.role == "model":
            chat_history_for_chain.append(AIMessage(content=msg.content))
    
    print(f"--- DEBUG: Formatted {len(chat_history_for_chain)} messages for LangChain ---")

    # *** CHANGE: Create StreamingResponse with custom headers that include session ID ***
    response = StreamingResponse(
        stream_and_save_response_with_headers(
            request_data.prompt, 
            chat_session.id, 
            chat_history_for_chain, 
            db_session
        ),
        media_type="text/plain; charset=utf-8"
    )
    
    # *** CHANGE: Add session ID to response headers so frontend can capture it ***
    response.headers["X-Session-ID"] = str(chat_session.id)
    # *** CHANGE: Add flag to indicate if this was a new session ***
    response.headers["X-Session-Created"] = str(session_was_created).lower()
    
    print(f"--- DEBUG: Returning response with session ID {chat_session.id} in headers ---")
    return response

# --- Other Endpoints (No changes) ---
@router.get("/", response_model=List[ChatSessionResponse], summary="Get all chat sessions for the current user")
def get_user_chat_sessions(
    *, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_active_user)
):
    return current_user.sessions

@router.get("/{session_id}", response_model=ChatHistoryResponse, summary="Get the history of a specific chat session")
def get_chat_history(
    *, 
    session_id: int, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_active_user)
):
    chat_session = session.get(ChatSession, session_id)
    if not chat_session or chat_session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
    return chat_session

@router.put("/{session_id}", response_model=ChatSessionResponse, summary="Rename a chat session")
def rename_chat_session(
    session_id: int,
    request_data: RenameChatRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    chat_session = session.get(ChatSession, session_id)
    if not chat_session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
    if chat_session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to rename this chat session")
    chat_session.title = request_data.new_title
    session.add(chat_session)
    session.commit()
    session.refresh(chat_session)
    return chat_session

@router.delete("/{session_id}", status_code=status.HTTP_200_OK, summary="Delete a chat session")
def delete_chat_session(
    *,
    session_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    chat_session = session.get(ChatSession, session_id)
    if not chat_session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
    if chat_session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this chat session")
    session.delete(chat_session)
    session.commit()
    return {"message": "Chat session deleted successfully"}
