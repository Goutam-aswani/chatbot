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

import os
import re
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.runnables import RunnablePassthrough
from rag_service import get_session_retriever,get_session_retriever_with_scores
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

    # llm = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash", google_api_key=settings.google_api_key)
   
    # llm = ChatOpenAI(base_url="https://openrouter.ai/api/v1",
    #     openai_api_key=settings.openai_api_key,
    #     model="deepseek/deepseek-chat-v3-0324:free",  # Use any OpenRouter model
    #     temperature=0.7,
    #     max_tokens=5000,
    #     streaming=True)

    llm = ChatGroq(
    model="llama3-70b-8192",
    temperature=0.2,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    api_key=settings.grok_api_key,  # Optional if you set GROQ_API_KEY
    streaming=True
)
    
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




def check_document_relevance(retriever, query: str, min_docs: int = 2) -> tuple[list, bool]:
    """
    Check if enough relevant documents are retrieved for the query.
    Returns: (documents_list, is_sufficient_bool)
    """
    try:
        retrieved_docs = retriever.get_relevant_documents(query)
        print(f"--- DEBUG: Retrieved {len(retrieved_docs)} documents after filtering ---")
        
        is_sufficient = len(retrieved_docs) >= min_docs
        
        if not is_sufficient:
            print(f"--- INFO: Insufficient documents ({len(retrieved_docs)}) for query, minimum required: {min_docs} ---")
            # return retrieved_docs[0], True
        print(retrieved_docs[0].page_content)
        return retrieved_docs, is_sufficient
        
    except Exception as e:
        print(f"--- ERROR: Document retrieval failed: {e} ---")
        return [], False
    


def get_rag_chatbot_response(prompt: str, chat_history: List[BaseMessage], session_id: int):
    """
    Generates a streaming RAG response using conversational context and retrieved documents
    filtered by the session_id.
    """
    model = ChatGroq(
    model="llama3-70b-8192",
    temperature=0.2,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    api_key=settings.grok_api_key,  # Optional if you set GROQ_API_KEY
    streaming=True
)
    llm = ChatGoogleGenerativeAI(model="models/gemini-2.0-flash-lite", google_api_key=settings.google_api_key)

    # retriever = get_session_retriever(session_id)
    rewrite_prompt = PromptTemplate.from_template("""
You are a query rewriter that improves vague or casual user queries for retrieval.

CRITICAL RULES:
1. If the input query is already clear, specific, and retrieval-friendly, return it EXACTLY as is without changing anything.
2. Only rewrite if the query is vague, incomplete, casual, or ambiguous.
3. Do NOT add extra information or assumptions that are not explicitly present in the user query.
4. Do NOT include any meta text like "Here is the prompt" or explanations.
5. Output must only be the final query text, nothing else.

User query: {query}

Decide: If the query is good, return it unchanged. Otherwise, rewrite it into a short, precise, and retrieval-friendly question.
""")
    parser = StrOutputParser()
    query_rewriter_chain = rewrite_prompt | model | parser
    enhanced_prompt = query_rewriter_chain.invoke({"query": prompt})
    print(f"--- DEBUG: Enhanced prompt after rewriting: '{enhanced_prompt}' ---")
    retriever = get_session_retriever_with_scores(session_id, similarity_threshold=0.95)

    retrieved_docs, has_sufficient_docs = check_document_relevance(retriever, prompt, min_docs=1)
    if not has_sufficient_docs:
        print(f"--- INFO: Rejecting query due to insufficient relevant documents ---")
    # Return a generator that yields the rejection message
        def rejection_generator():
            yield "I cannot answer this question as I don't find sufficient relevant information in the uploaded documents. Please ensure your question is related to the content of the uploaded files."
        return rejection_generator()
    
    def format_docs(docs_list):
        if not docs_list:
            return "No relevant documents found."
        return "\n\n".join(doc.page_content for doc in docs_list)
    # 1. Define the prompt template for RAG
    # rag_prompt = ChatPromptTemplate.from_messages([
    #     ("system", (
    #         "You are a helpful assistant. Answer the user's question based ONLY on the context provided below. "
    #         "Format your responses using GitHub-flavored Markdown."
    #         "If the context doesn't contain the answer, state that you don't have enough information from the document.\n"
            
    #         """You are an expert assistant for analyzing documents.
    # Your task is to answer the user's question based ONLY on the provided context.

    # CONTEXT:
    # {context}

    # INSTRUCTIONS:
    # 1. Carefully read the provided context to find the most direct answer to the question.
    # 2. Your answer MUST be concise and to the point, ideally 1-3 sentences.
    # 3. If the answer includes a specific number, duration, or key condition (like an exception), you MUST include it.
    # 4. Do not start your answer with phrases like "Based on the context..." or "The provided text states...".
    # 5. If the information is not present in the context, state that the answer cannot be found in the document.
    # 6. Be factually accurate and directly sourced from the document.
    # 7. Use formal language and retain any legal or technical terminology as mentioned in the policy.
    # 8. Follow the same order as the questions.
    # 9. If the question is not answerable, respond with "The answer to this question is not available in the document."
    # 10.Include all relevant numeric data found in the document"""
    #     )),
    #     MessagesPlaceholder(variable_name="chat_history"),
    #     ("user", "{input}")
    # ])
    rag_prompt = ChatPromptTemplate.from_messages([

("system", (
    """You are a document analysis assistant. Your ONLY job is to answer questions based STRICTLY on the provided context from uploaded documents.

CRITICAL RULES:
1. You MUST ONLY use information that is explicitly stated in the context provided below
2. If the answer is not in the context, you MUST respond with: "I cannot answer this question as the information is not available in the uploaded documents."
3. Do NOT use any general knowledge, assumptions, or information from outside the provided context
4. Do NOT provide partial answers by mixing document content with general knowledge
5. Do NOT make inferences beyond what is explicitly stated in the documents

BEFORE answering any question:
- First, carefully scan the provided context
- Verify that the specific information needed to answer the question exists in the context
- If you cannot find the specific information, use the rejection response above

FORMAT REQUIREMENTS:
- Use GitHub-flavored Markdown for formatting
- Be concise and direct
- Quote relevant sections when possible
- If answering, cite which part of the document the information comes from

CONTEXT:
{context}
\n
THE CONTEXT IS YOUR KNOWLEDGE BASE THE CONTEXT IS ALL YOU KNOW

Remember: It's better to say "I don't know based on the documents" than to provide information not found in the context."""
)),
MessagesPlaceholder(variable_name="chat_history"),
        ("user", "{input}")
    ])

    # 2. Helper function to format the retrieved documents
    # def format_docs(docs):
    #     return "\n\n".join(doc.page_content for doc in docs)

    # 3. Construct the RAG chain using LangChain Expression Language (LCEL)
    print(f"--- DEBUG: Creating RAG chain for session_id: {session_id} ---")
    rag_chain = (
        {
            # "context": itemgetter("input") | retriever | format_docs(retrieved_docs),
            "context": lambda x: format_docs(retrieved_docs),
            "input": itemgetter("input"),
            "chat_history": itemgetter("chat_history"),
        }
        | rag_prompt
        | llm
        | StrOutputParser()
    )
    print(f"--- DEBUG: RAG chain created for session_id: {session_id} ---")
    return rag_chain.stream({
        "input": enhanced_prompt,
        "chat_history": chat_history
    })