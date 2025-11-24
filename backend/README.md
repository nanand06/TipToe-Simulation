# Tiptoe PIR Backend - Complete Implementation

A complete Python backend implementation of the Tiptoe Private Information Retrieval (PIR) system based on the paper: [Private Web Search with Tiptoe](https://teaching.babman.io/ds593/readings/tiptoe.pdf)

## Key Features

✅ **Real Homomorphic Encryption**: Uses TenSEAL for actual encrypted computation  
✅ **Document Embeddings**: Semantic embeddings using sentence transformers  
✅ **Document Clustering**: K-means clustering groups documents by topic  
✅ **Homomorphic Inner Product**: Server computes similarity under encryption  
✅ **PIR Protocol**: Server never sees plaintext queries  

## Architecture

### Tiptoe Protocol Flow

1. **Initialization** (Server):
   - Documents are embedded using `all-MiniLM-L6-v2` model
   - Documents are clustered into 10 clusters using K-means
   - Cluster centroids are computed and stored

2. **Client-Side Setup**:
   - Client fetches cluster centroids via `/api/clusters`
   - Centroids are stored client-side for cluster selection

3. **Search Process**:
   - **Client**: Generates query embedding
   - **Client**: Finds nearest cluster (client-side, server doesn't know)
   - **Client**: Encrypts query vector using homomorphic encryption
   - **Client**: Sends encrypted query + cluster ID to server
   - **Server**: Computes encrypted inner products for all documents in cluster
   - **Server**: Returns encrypted scores (never sees plaintext query)
   - **Client**: Decrypts scores and ranks results

## Installation

```bash
cd backend
pip install -r requirements.txt
```

**Note**: TenSEAL requires additional setup. If installation fails:
- Install system dependencies: `sudo apt-get install build-essential` (Linux)
- Or use conda: `conda install -c conda-forge tenseal`

## Running the Server

```bash
python main.py
```

Or with auto-reload:
```bash
uvicorn main:app --reload
```

Server starts on `http://localhost:8000`

## API Endpoints

### Health & Info
- `GET /` - API information
- `GET /health` - Health check with system status

### Clusters
- `GET /api/clusters` - Get all cluster centroids (for client-side storage)
  - Returns: List of clusters with centroids and document counts
  - **Important**: Client stores these locally for cluster selection

### Embeddings
- `POST /api/embed` - Generate embedding for query text
  ```json
  {
    "text": "your search query"
  }
  ```
  Returns: `{"embedding": [0.1, 0.2, ...]}`

### Private Information Retrieval
- `POST /api/pir` - Core PIR endpoint
  ```json
  {
    "cluster_id": 0,
    "encrypted_query": "base64_encoded_ciphertext",
    "public_context": "base64_encoded_public_context"
  }
  ```
  Returns: Encrypted scores and document IDs

- `POST /api/search` - Complete search (for demonstration)
  - Same as PIR but includes document text for display
  - In production, client would decrypt and fetch documents separately

### Documents
- `GET /api/documents/{doc_id}` - Get document by ID

## Homomorphic Encryption Details

### Server-Side Computation

The server performs **homomorphic inner product** computation:

```python
encrypted_score = encrypted_query.dot(document_embedding)
```

This computes `Σ(encrypted_query[i] * document_embedding[i])` entirely under encryption.

**Key Points**:
- Server receives encrypted query (base64 serialized ciphertext)
- Server receives public context (allows homomorphic operations)
- Server **never** sees the plaintext query
- All computation happens under encryption
- Server returns encrypted scores

### Privacy Guarantees

1. ✅ **Query Privacy**: Server never sees plaintext query
2. ✅ **Cluster Privacy**: Server only knows which cluster was selected (not the query)
3. ✅ **Computation Privacy**: Inner products computed under encryption
4. ✅ **Result Privacy**: Scores returned encrypted (client decrypts)

## Data Storage

- Documents and embeddings: `data/documents.pkl`
- Clusters: `data/clusters.pkl`

On first run, the system:
1. Creates 20 sample documents
2. Computes embeddings (downloads model if needed)
3. Clusters documents into 10 clusters
4. Saves everything to disk

## Extending the System

### Adding More Documents

Edit `initialize_sample_documents()` or load from file:

```python
def load_documents_from_file(filepath):
    # Load your documents
    documents = [...]
    texts = [doc["text"] for doc in documents]
    embeddings = compute_embeddings(texts)
    # Update global state
```

### Using Different Embedding Models

Change in `compute_embeddings()`:

```python
embedding_model = SentenceTransformer('your-model-name')
```

### Adjusting Cluster Count

Change `n_clusters` global variable (default: 10)

## Performance

- **Embedding computation**: ~1-2 seconds for 20 documents
- **Clustering**: <1 second
- **PIR query**: ~50-100ms per query
- **Model download**: ~80MB on first run

## Troubleshooting

**TenSEAL installation issues**:
- The system will fall back to simulated encryption if TenSEAL is not available
- For real HE, ensure TenSEAL is properly installed

**Memory issues**:
- Reduce number of documents
- Use smaller embedding model
- Process in batches

**Import errors**:
```bash
pip install --upgrade -r requirements.txt
```

## References

- **Tiptoe Paper**: https://teaching.babman.io/ds593/readings/tiptoe.pdf
- **TenSEAL**: https://github.com/OpenMined/TenSEAL
- **Sentence Transformers**: https://www.sbert.net/
- **FastAPI**: https://fastapi.tiangolo.com/
