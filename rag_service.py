# rag_service.py
import os
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
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

# ADD this new function after the existing get_session_retriever function (around line 45)

def get_session_retriever_with_scores(session_id: int, similarity_threshold: float = 0.9):
    """
    Creates a retriever that returns documents with similarity scores and filters by threshold.
    Only returns documents that meet the minimum similarity threshold.
    """
    vector_store = get_vector_store()
    print(f"--- INFO: Creating retriever with similarity threshold {similarity_threshold} for session_id: {session_id} ---")
    
    # Get documents with scores using similarity_search_with_score
    def retrieve_with_filtering(query: str) -> list:
        # Perform similarity search with scores
        docs_with_scores = vector_store.similarity_search_with_score(
            query, 
            k=10,  # Get more documents initially
            filter={"session_id": str(session_id)}
        )
        
        print(f"--- DEBUG: Retrieved {len(docs_with_scores)} documents before filtering ---")
        
        # Filter by similarity threshold
        filtered_docs = []
        for doc, score in docs_with_scores:
            print(f"--- DEBUG: Document score: {score} (threshold: {similarity_threshold}) ---")
            # Note: Chroma returns distance, lower is better, so we filter by < threshold
            if score <= similarity_threshold:
                filtered_docs.append(doc)
            else:
                print(f"--- DEBUG: Document filtered out due to low similarity ---")
        
        if not filtered_docs and docs_with_scores:
            print("--- INFO: No documents passed threshold, returning top-scoring document as fallback ---")
            print(f"--- DEBUG: Top-scoring document: {docs_with_scores[0][0]} ---")
            filtered_docs.append(docs_with_scores[0][0])

        print(f"--- INFO: {len(filtered_docs)} documents passed similarity threshold ---")
        return filtered_docs
    
    # Create a custom retriever that uses our filtering function
    class FilteredRetriever:
        def __init__(self, retrieve_func):
            self.retrieve_func = retrieve_func
            
        def get_relevant_documents(self, query: str):
            return self.retrieve_func(query)
    
    return FilteredRetriever(retrieve_with_filtering)