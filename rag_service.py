# rag_service.py
import os
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
from config import settings

# --- 1. Document Loading and Splitting ---

def load_document(file_path: str) -> list[Document]:
    """Loads a document based on its file extension."""
    if file_path.endswith(".pdf"):
        loader = PyPDFLoader(file_path)
    elif file_path.endswith(".docx"):
        loader = Docx2txtLoader(file_path)
    elif file_path.endswith(".txt"):
        loader = TextLoader(file_path)
    else:
        raise ValueError("Unsupported file type.")
    print(f"--- INFO: Loading document from {file_path} ---")
    return loader.load()

def split_text(documents: list[Document]) -> list[Document]:
    """Splits documents into smaller chunks."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    print(f"--- INFO: Splitting {len(documents)} documents into chunks ---")
    return text_splitter.split_documents(documents)

# --- 2. Vector Store and Retriever ---

def get_vector_store() -> Chroma:
    """Initializes the Chroma vector store."""
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001" , google_api_key=settings.google_api_key)
    # Using a persistent directory and a single collection name
    print("--- INFO: Initializing Chroma vector store ---")
    return Chroma(
        persist_directory="./chroma_db_main",
        embedding_function=embeddings,
        collection_name="chatbot_rag"
    )

def process_and_store_document(file_path: str, session_id: int):
    """The complete pipeline for processing and storing a document with session metadata."""
    # Load and split the document
    documents = load_document(file_path)
    chunks = split_text(documents)

    # Add session_id metadata to each chunk
    for chunk in chunks:
        chunk.metadata = {"session_id": str(session_id)}
    
    # Get the vector store and add the new chunks
    vector_store = get_vector_store()
    vector_store.add_documents(chunks)
    print(f"--- INFO: Stored {len(chunks)} chunks for session_id: {session_id} ---")

def get_session_retriever(session_id: int):
    """
    Creates a retriever that ONLY searches for documents matching the session_id.
    """
    vector_store = get_vector_store()
    print(f"--- INFO: Creating retriever for session_id: {session_id} ---")
    return vector_store.as_retriever(
        search_kwargs={"filter": {"session_id": str(session_id)}}
    )