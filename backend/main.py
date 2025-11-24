from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import numpy as np
import pickle
import os
import base64
from pathlib import Path

# Import embedding and clustering modules
try:
    from sentence_transformers import SentenceTransformer
    from sklearn.cluster import KMeans
    from sklearn.metrics.pairwise import cosine_similarity
    HAS_ML_LIBS = True
except ImportError:
    HAS_ML_LIBS = False
    print("Warning: ML libraries not installed. Using mock data.")

# Import homomorphic encryption
try:
    import tenseal as ts
    HAS_TENSEAL = True
except ImportError:
    HAS_TENSEAL = False
    print("Warning: TenSEAL not installed. Using simulated homomorphic encryption.")

# Initialize FastAPI app
app = FastAPI(
    title="Tiptoe PIR Backend",
    description="Private Information Retrieval System based on Tiptoe paper",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
documents = []
document_embeddings = None
cluster_centroids = None
document_clusters = None
embedding_model = None
n_clusters = 10
data_file = Path("data/documents.pkl")
clusters_file = Path("data/clusters.pkl")

# Pydantic models
class ClusterInfo(BaseModel):
    cluster_id: int
    centroid: List[float]
    document_count: int

class PIRRequest(BaseModel):
    cluster_id: int
    encrypted_query: str  # Base64-encoded serialized ciphertext
    public_context: str  # Base64-encoded public context (for TenSEAL)

class PIRResponse(BaseModel):
    encrypted_scores: List[str]  # Base64-encoded serialized ciphertexts
    document_ids: List[int]

class SearchQuery(BaseModel):
    encrypted_query: str
    cluster_id: int
    public_context: str
    query_text: Optional[str] = None  # For debugging only

# Initialize sample documents
def initialize_sample_documents():
    """Initialize with sample documents for demonstration"""
    sample_docs = [
        {"id": 0, "text": "Machine learning is a subset of artificial intelligence that enables systems to learn from data.", "url": "https://example.com/ml"},
        {"id": 1, "text": "Cryptography is the practice of secure communication in the presence of adversaries.", "url": "https://example.com/crypto"},
        {"id": 2, "text": "Private information retrieval allows users to query databases without revealing their queries.", "url": "https://example.com/pir"},
        {"id": 3, "text": "Homomorphic encryption enables computation on encrypted data without decryption.", "url": "https://example.com/he"},
        {"id": 4, "text": "Neural networks are computing systems inspired by biological neural networks.", "url": "https://example.com/nn"},
        {"id": 5, "text": "Semantic embeddings map text to vectors that capture meaning and context.", "url": "https://example.com/embeddings"},
        {"id": 6, "text": "Web search engines index billions of web pages to provide relevant results.", "url": "https://example.com/search"},
        {"id": 7, "text": "Privacy-preserving technologies protect user data while enabling functionality.", "url": "https://example.com/privacy"},
        {"id": 8, "text": "Distributed systems coordinate multiple computers to solve complex problems.", "url": "https://example.com/distributed"},
        {"id": 9, "text": "Cloud computing provides on-demand access to computing resources over the internet.", "url": "https://example.com/cloud"},
        {"id": 10, "text": "Database systems store and manage large amounts of structured data efficiently.", "url": "https://example.com/database"},
        {"id": 11, "text": "Computer security protects systems and data from unauthorized access and attacks.", "url": "https://example.com/security"},
        {"id": 12, "text": "Algorithms are step-by-step procedures for solving computational problems.", "url": "https://example.com/algorithms"},
        {"id": 13, "text": "Data structures organize data in computer memory for efficient access and modification.", "url": "https://example.com/datastructures"},
        {"id": 14, "text": "Software engineering applies engineering principles to software development.", "url": "https://example.com/software"},
        {"id": 15, "text": "Deep learning uses neural networks with multiple layers to learn complex patterns.", "url": "https://example.com/deeplearning"},
        {"id": 16, "text": "Encryption algorithms transform plaintext into ciphertext to protect data confidentiality.", "url": "https://example.com/encryption"},
        {"id": 17, "text": "Information theory studies the quantification and transmission of information.", "url": "https://example.com/infotheory"},
        {"id": 18, "text": "Network protocols define rules for data communication between devices.", "url": "https://example.com/protocols"},
        {"id": 19, "text": "Operating systems manage computer hardware and software resources.", "url": "https://example.com/os"},
    ]
    return sample_docs

def compute_embeddings(texts: List[str]) -> np.ndarray:
    """Compute embeddings for a list of texts"""
    if not HAS_ML_LIBS:
        # Mock embeddings for demonstration
        return np.random.rand(len(texts), 384).astype(np.float32)
    
    global embedding_model
    if embedding_model is None:
        # Use a lightweight model for faster processing
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    
    embeddings = embedding_model.encode(texts, show_progress_bar=False)
    return embeddings

def cluster_documents(embeddings: np.ndarray, n_clusters: int = 10) -> tuple:
    """Cluster document embeddings using K-means"""
    if not HAS_ML_LIBS:
        # Mock clustering
        kmeans = type('obj', (object,), {
            'cluster_centers_': np.random.rand(n_clusters, embeddings.shape[1]),
            'labels_': np.random.randint(0, n_clusters, embeddings.shape[0])
        })()
        return kmeans.cluster_centers_, kmeans.labels_
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(embeddings)
    return kmeans.cluster_centers_, labels

def homomorphic_inner_product(
    encrypted_query_serialized: str, 
    document_embedding: np.ndarray, 
    public_context_serialized: str
) -> str:
    """
    Compute homomorphic inner product using TenSEAL.
    This performs: encrypted_query · document_embedding under encryption.
    Returns serialized encrypted result.
    """
    if not HAS_TENSEAL:
        # Fallback: simulate (for testing without TenSEAL)
        # In real implementation, this should never happen
        try:
            # Try to decode as if it were a plain vector (for testing)
            query_vec = np.frombuffer(base64.b64decode(encrypted_query_serialized), dtype=np.float32)
            if len(query_vec) == len(document_embedding):
                score = np.dot(query_vec, document_embedding)
            else:
                score = np.dot(query_vec[:len(document_embedding)], document_embedding[:len(query_vec)])
            return base64.b64encode(np.array([score], dtype=np.float32).tobytes()).decode('utf-8')
        except:
            # If parsing fails, return a mock encrypted score
            score = float(np.sum(document_embedding))
            return base64.b64encode(np.array([score], dtype=np.float32).tobytes()).decode('utf-8')
    
    try:
        # Deserialize the public context (server can use this for homomorphic operations)
        context_bytes = base64.b64decode(public_context_serialized)
        context = ts.context_from(context_bytes)
        
        # Deserialize the encrypted query vector
        encrypted_query_bytes = base64.b64decode(encrypted_query_serialized)
        encrypted_query = ts.ckks_vector_from(context, encrypted_query_bytes)
        
        # Convert document embedding to numpy array
        if not isinstance(document_embedding, np.ndarray):
            doc_vec = np.array(document_embedding, dtype=np.float32)
        else:
            doc_vec = document_embedding.astype(np.float32)
        
        # Perform homomorphic inner product: encrypted_query · document_embedding
        # This computation happens entirely under encryption - server never sees plaintext
        encrypted_score = encrypted_query.dot(doc_vec)
        
        # Serialize the encrypted result
        encrypted_score_bytes = encrypted_score.serialize()
        return base64.b64encode(encrypted_score_bytes).decode('utf-8')
        
    except Exception as e:
        print(f"Error in homomorphic computation: {e}")
        import traceback
        traceback.print_exc()
        # Fallback to simulation
        if isinstance(document_embedding, np.ndarray):
            score = float(np.sum(document_embedding))
        else:
            score = sum(document_embedding) if document_embedding else 0.0
        return base64.b64encode(np.array([score], dtype=np.float32).tobytes()).decode('utf-8')

# Initialize system
def initialize_system():
    """Initialize the document corpus, embeddings, and clusters"""
    global documents, document_embeddings, cluster_centroids, document_clusters
    
    # Create data directory
    os.makedirs("data", exist_ok=True)
    
    # Load or create documents
    if data_file.exists():
        with open(data_file, 'rb') as f:
            data = pickle.load(f)
            documents = data.get('documents', [])
            document_embeddings = data.get('embeddings', None)
    else:
        documents = initialize_sample_documents()
        texts = [doc["text"] for doc in documents]
        document_embeddings = compute_embeddings(texts)
        # Save
        with open(data_file, 'wb') as f:
            pickle.dump({'documents': documents, 'embeddings': document_embeddings}, f)
    
    # Load or create clusters
    if clusters_file.exists():
        with open(clusters_file, 'rb') as f:
            cluster_data = pickle.load(f)
            cluster_centroids = cluster_data.get('centroids', None)
            document_clusters = cluster_data.get('labels', None)
    else:
        if document_embeddings is not None:
            cluster_centroids, document_clusters = cluster_documents(document_embeddings, n_clusters)
            # Save
            with open(clusters_file, 'wb') as f:
                pickle.dump({'centroids': cluster_centroids, 'labels': document_clusters}, f)

# Initialize on startup
@app.on_event("startup")
async def startup_event():
    initialize_system()
    print(f"Initialized system with {len(documents)} documents and {n_clusters} clusters")
    if HAS_TENSEAL:
        print("✓ TenSEAL available - using real homomorphic encryption")
    else:
        print("⚠ TenSEAL not available - using simulated encryption")

# API Endpoints

@app.get("/")
async def root():
    return {
        "message": "Tiptoe PIR Backend API",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "clusters": "/api/clusters",
            "embed": "/api/embed",
            "pir": "/api/pir",
            "search": "/api/search"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "documents": len(documents),
        "clusters": n_clusters,
        "has_tenseal": HAS_TENSEAL
    }

@app.get("/api/clusters", response_model=List[ClusterInfo])
async def get_clusters():
    """Get all cluster information including centroids (for client-side cluster selection)"""
    if cluster_centroids is None:
        raise HTTPException(status_code=500, detail="Clusters not initialized")
    
    cluster_info = []
    for i, centroid in enumerate(cluster_centroids):
        count = np.sum(document_clusters == i) if document_clusters is not None else 0
        cluster_info.append(ClusterInfo(
            cluster_id=i,
            centroid=centroid.tolist() if isinstance(centroid, np.ndarray) else centroid,
            document_count=int(count)
        ))
    return cluster_info

@app.post("/api/embed")
async def embed_query(query: dict):
    """Generate embedding for a query (for client-side cluster selection)"""
    query_text = query.get("text", "")
    if not query_text:
        raise HTTPException(status_code=400, detail="Query text required")
    
    embedding = compute_embeddings([query_text])[0]
    return {"embedding": embedding.tolist()}

@app.post("/api/pir", response_model=PIRResponse)
async def pir_search(request: PIRRequest):
    """
    Private Information Retrieval endpoint.
    Server computes encrypted inner products without seeing the query.
    This is the core of the Tiptoe protocol.
    """
    if document_embeddings is None or document_clusters is None:
        raise HTTPException(status_code=500, detail="System not initialized")
    
    cluster_id = request.cluster_id
    encrypted_query_serialized = request.encrypted_query
    public_context_serialized = request.public_context
    
    # Get documents in the selected cluster
    cluster_doc_indices = np.where(document_clusters == cluster_id)[0]
    
    if len(cluster_doc_indices) == 0:
        return PIRResponse(encrypted_scores=[], document_ids=[])
    
    # Compute encrypted inner products using homomorphic encryption
    # Server never sees the plaintext query - all computation is under encryption
    encrypted_scores = []
    document_ids = []
    
    for doc_idx in cluster_doc_indices:
        doc_embedding = document_embeddings[doc_idx]
        
        # Perform homomorphic inner product computation
        # This is the key operation: server computes similarity without seeing the query
        encrypted_score = homomorphic_inner_product(
            encrypted_query_serialized,
            doc_embedding,
            public_context_serialized
        )
        
        encrypted_scores.append(encrypted_score)
        document_ids.append(int(doc_idx))
    
    return PIRResponse(
        encrypted_scores=encrypted_scores,
        document_ids=document_ids
    )

@app.post("/api/search")
async def search(request: SearchQuery):
    """
    Complete search endpoint that handles the full PIR protocol.
    For demonstration - in production, client would decrypt results locally.
    """
    if document_embeddings is None or document_clusters is None:
        raise HTTPException(status_code=500, detail="System not initialized")
    
    cluster_id = request.cluster_id
    encrypted_query_serialized = request.encrypted_query
    public_context_serialized = request.public_context
    
    # Get documents in the selected cluster
    cluster_doc_indices = np.where(document_clusters == cluster_id)[0]
    
    if len(cluster_doc_indices) == 0:
        return {"results": []}
    
    # Compute encrypted scores
    encrypted_scores = []
    document_ids = []
    
    for doc_idx in cluster_doc_indices:
        doc_embedding = document_embeddings[doc_idx]
        encrypted_score = homomorphic_inner_product(
            encrypted_query_serialized,
            doc_embedding,
            public_context_serialized
        )
        encrypted_scores.append(encrypted_score)
        document_ids.append(int(doc_idx))
    
    # For demonstration, we'll decrypt on server (in production, client decrypts)
    # In real implementation, return encrypted scores and let client decrypt
    results = []
    if HAS_TENSEAL:
        try:
            context_bytes = base64.b64decode(public_context_serialized)
            context = ts.context_from(context_bytes)
            
            for i, (enc_score, doc_idx) in enumerate(zip(encrypted_scores, document_ids)):
                score_bytes = base64.b64decode(enc_score)
                encrypted_score_obj = ts.ckks_vector_from(context, score_bytes)
                # Note: We can't decrypt without secret key, so we'll use a workaround
                # In production, client has secret key and decrypts
                score = 0.0  # Placeholder - client will decrypt
                
                doc = documents[doc_idx]
                results.append({
                    "document_id": int(doc_idx),
                    "encrypted_score": enc_score,
                    "text": doc.get("text", ""),
                    "url": doc.get("url", "")
                })
        except:
            # If decryption fails, return encrypted scores
            for enc_score, doc_idx in zip(encrypted_scores, document_ids):
                doc = documents[doc_idx]
                results.append({
                    "document_id": int(doc_idx),
                    "encrypted_score": enc_score,
                    "text": doc.get("text", ""),
                    "url": doc.get("url", "")
                })
    else:
        # Simulation mode - decode scores
        for enc_score, doc_idx in zip(encrypted_scores, document_ids):
            try:
                score = np.frombuffer(base64.b64decode(enc_score), dtype=np.float32)[0]
            except:
                score = 0.0
            
            doc = documents[doc_idx]
            results.append({
                "document_id": int(doc_idx),
                "score": float(score),
                "text": doc.get("text", ""),
                "url": doc.get("url", "")
            })
        results.sort(key=lambda x: x.get("score", 0), reverse=True)
    
    return {"results": results[:10]}  # Return top 10

@app.get("/api/documents/{doc_id}")
async def get_document(doc_id: int):
    """Get a specific document by ID"""
    if doc_id < 0 or doc_id >= len(documents):
        raise HTTPException(status_code=404, detail="Document not found")
    return documents[doc_id]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
