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

from config import settings
from typing import List

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

    llm = ChatGoogleGenerativeAI(model="models/gemini-1.5-flash", google_api_key=settings.google_api_key)
   
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