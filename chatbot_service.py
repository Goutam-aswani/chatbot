# # chatbot_service.py

# from langchain_google_genai import ChatGoogleGenerativeAI
# # *** CHANGE: Import MessagesPlaceholder to handle a list of messages in the prompt. ***
# from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
# from langchain_core.output_parsers import StrOutputParser
# # *** CHANGE: Import message types to structure the chat history. ***
# from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

# from config import settings
# from typing import List

# # *** CHANGE: The function now accepts a 'chat_history' list as an argument. ***
# def get_chatbot_response(prompt: str, chat_history: List[BaseMessage]):
#     """
#     Initializes the chatbot model and gets a streaming response,
#     now with conversational context.
#     Args:
#         prompt: The new message from the user.
#         chat_history: A list of previous messages (HumanMessage, AIMessage)
#     Yields:
#         str: Chunks of the bot's response.
#     """
#     if not settings.google_api_key:
#         raise ValueError("GOOGLE_API_KEY is not set in the environment.")

#     llm = ChatGoogleGenerativeAI(model="models/gemini-1.5-flash", google_api_key=settings.google_api_key)
    
#     # *** CHANGE: The prompt template is updated to include a placeholder for chat history. ***
#     # This tells the AI to consider the previous messages before answering the new one.
#     prompt_template = ChatPromptTemplate.from_messages([
#         ("system", (
#             "You are a helpful assistant. You provide concise answers based on the provided context. "
#             "Format your responses using GitHub-flavored Markdown."
#         )),
#         # The placeholder will be filled with the list of previous messages.
#         MessagesPlaceholder(variable_name="chat_history"),
#         ("user", "{input}")
#     ])
    
#     output_parser = StrOutputParser()
    
#     chain = prompt_template | llm | output_parser
    
#     try:
#         # DEBUG: Print the prompt and history being sent.
#         print(f"--- DEBUG: Streaming with prompt: '{prompt}' ---")
#         print(f"--- DEBUG: Streaming with history: {chat_history} ---")

#         # *** CHANGE: The 'stream' call now includes the chat_history. ***
#         response_stream = chain.stream({
#             "input": prompt,
#             "chat_history": chat_history
#         })

#         for chunk in response_stream:
#             yield chunk

#     except Exception as e:
#         print(f"--- DEBUG: Error streaming from LangChain: {e}")
#         yield "Sorry, I encountered an error while processing your request."



# # chatbot_service.py

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.runnables import RunnablePassthrough
from rag_service import get_session_retriever
from config import settings
from typing import List
from operator import itemgetter

def get_chatbot_response(prompt: str, chat_history: List[BaseMessage]):
    """
    Initializes the chatbot model and gets a streaming response,
    now with conversational context.
    Args:
        prompt: The new message from the user.
        chat_history: A list of previous messages (HumanMessage, AIMessage)
    Yields:
        str: Chunks of the bot's response.
    """
    if not settings.google_api_key:
        raise ValueError("GOOGLE_API_KEY is not set in the environment.")

    llm = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash", google_api_key=settings.google_api_key)
   
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", (
            "You are a helpful assistant. You provide concise answers based on the provided context. "
            "Format your responses using GitHub-flavored Markdown."
        )),
        MessagesPlaceholder(variable_name="chat_history"),
        ("user", "{input}")
    ])
   
    output_parser = StrOutputParser()
    chain = prompt_template | llm | output_parser
   
    try:
        # *** ENHANCED DEBUG: More detailed logging for troubleshooting ***
        print(f"--- DEBUG: Streaming with prompt: '{prompt}' ---")
        print(f"--- DEBUG: Chat history length: {len(chat_history)} ---")
        for i, msg in enumerate(chat_history):
            print(f"--- DEBUG: History[{i}]: {type(msg).__name__} - '{msg.content[:50]}...' ---")

        response_stream = chain.stream({
            "input": prompt,
            "chat_history": chat_history
        })

        for chunk in response_stream:
            yield chunk

    except Exception as e:
        print(f"--- DEBUG: Error streaming from LangChain: {e}")
        yield "Sorry, I encountered an error while processing your request."


def get_rag_chatbot_response(prompt: str, chat_history: List[BaseMessage], session_id: int):
    """
    Generates a streaming RAG response using conversational context and retrieved documents
    filtered by the session_id.
    """
    llm = ChatGoogleGenerativeAI(model="models/gemini-1.5-flash", google_api_key=settings.google_api_key)
    retriever = get_session_retriever(session_id)

    # 1. Define the prompt template for RAG
    rag_prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are a helpful assistant. Answer the user's question based ONLY on the context provided below. "
            "Format your responses using GitHub-flavored Markdown."
            "If the context doesn't contain the answer, state that you don't have enough information from the document.\n"
            
            """You are an expert assistant for analyzing documents.
    Your task is to answer the user's question based ONLY on the provided context.

    CONTEXT:
    {context}

    INSTRUCTIONS:
    1. Carefully read the provided context to find the most direct answer to the question.
    2. Your answer MUST be concise and to the point, ideally 1-3 sentences.
    3. If the answer includes a specific number, duration, or key condition (like an exception), you MUST include it.
    4. Do not start your answer with phrases like "Based on the context..." or "The provided text states...".
    5. If the information is not present in the context, state that the answer cannot be found in the document.
    6. Be factually accurate and directly sourced from the document.
    7. Use formal language and retain any legal or technical terminology as mentioned in the policy.
    8. Follow the same order as the questions.
    9. If the question is not answerable, respond with "The answer to this question is not available in the document."
    10.Include all relevant numeric data found in the document"""
        )),
        MessagesPlaceholder(variable_name="chat_history"),
        ("user", "{input}")
    ])

    # 2. Helper function to format the retrieved documents
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    # 3. Construct the RAG chain using LangChain Expression Language (LCEL)
    print(f"--- DEBUG: Creating RAG chain for session_id: {session_id} ---")
    rag_chain = (
        {
            "context": itemgetter("input") | retriever | format_docs,
            "input": itemgetter("input"),
            "chat_history": itemgetter("chat_history"),
        }
        | rag_prompt
        | llm
        | StrOutputParser()
    )
    print(f"--- DEBUG: RAG chain created for session_id: {session_id} ---")
    return rag_chain.stream({
        "input": prompt,
        "chat_history": chat_history
    })