import os
import chromadb
from chromadb.config import Settings
from dotenv import load_dotenv

load_dotenv()

CHROMA_DB_DIR = os.getenv("CHROMA_DB_DIR", "./chroma_data")
COLLECTION_NAME = "mentora_knowledge_base"

# Initialize ChromaDB persistent client
client = chromadb.PersistentClient(path=CHROMA_DB_DIR, settings=Settings(anonymized_telemetry=False))

def get_or_create_collection():
    """
    Retrieves the existing collection or creates a new one.
    """
    try:
        collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"} # Use cosine similarity for embeddings
        )
        return collection
    except Exception as e:
        print(f"Error initializing ChromaDB collection: {e}")
        raise e

def add_documents_to_chroma(ids, embeddings, metadatas, documents):
    """
    Adds documents, their embeddings, and metadata to ChromaDB.
    """
    collection = get_or_create_collection()
    collection.add(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
        documents=documents
    )
    return True

def query_chroma(query_embeddings, n_results=5, where_filter=None):
    """
    Queries ChromaDB for the most similar documents.
    """
    collection = get_or_create_collection()
    results = collection.query(
        query_embeddings=query_embeddings,
        n_results=n_results,
        where=where_filter
    )
    return results

def delete_documents_by_resource_id(resource_id: str):
    """
    Deletes all chunks associated with a specific resource_id from ChromaDB.
    """
    try:
        collection = get_or_create_collection()
        # ChromaDB allows deleting based on metadata where filters
        collection.delete(where={"resourceId": resource_id})
        return True
    except Exception as e:
        print(f"Error deleting from ChromaDB: {e}")
        return False

