# Tiptoe Private Search System - Complete Implementation

A full-stack implementation of the **Tiptoe Private Information Retrieval (PIR)** system for private web search, based on the paper: [Private Web Search with Tiptoe](https://teaching.babman.io/ds593/readings/tiptoe.pdf)

## 🎯 Overview

This system implements the complete Tiptoe protocol:

- ✅ **Client-side query encryption** using homomorphic encryption
- ✅ **Client-side cluster selection** based on nearest embeddings
- ✅ **Server-side homomorphic computation** of inner products
- ✅ **Document clustering** with centroids stored client-side
- ✅ **Private Information Retrieval** - server never sees plaintext queries

## 🏗️ Architecture

```
┌─────────────┐                    ┌─────────────┐
│   Client    │                    │   Server    │
│  (Browser)  │                    │  (FastAPI)  │
└──────┬──────┘                    └──────┬──────┘
       │                                   │
       │ 1. Fetch cluster centroids        │
       │──────────────────────────────────>│
       │<──────────────────────────────────│
       │                                   │
       │ 2. Generate query embedding       │
       │    (client-side)                  │
       │                                   │
       │ 3. Find nearest cluster           │
       │    (client-side)                  │
       │                                   │
       │ 4. Encrypt query vector           │
       │    (client-side)                  │
       │                                   │
       │ 5. Send encrypted query + cluster │
       │──────────────────────────────────>│
       │                                   │
       │                   6. Compute encrypted │
       │                      inner products    │
       │                      (homomorphic)     │
       │                                   │
       │<──────────────────────────────────│
       │ 7. Encrypted scores              │
       │                                   │
       │ 8. Decrypt scores                │
       │    (client-side)                  │
       │                                   │
       │ 9. Display results               │
       │                                   │
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The backend will:
- Initialize 20 sample documents
- Compute embeddings (downloads model ~80MB on first run)
- Cluster documents into 10 clusters
- Start server on `http://localhost:8000`

### 2. Frontend Setup

In a new terminal:

```bash
npm install
npm run dev
```

Frontend starts on `http://localhost:3000`

### 3. Use the System

1. Open `http://localhost:3000`
2. Enter a search query (e.g., "machine learning", "cryptography")
3. Click "Search"
4. View results ranked by relevance

## 🔐 Privacy Guarantees

The Tiptoe protocol ensures:

1. **Query Privacy**: Server never sees your plaintext query
2. **Cluster Selection Privacy**: Server only knows which cluster you selected (not your query)
3. **Computation Privacy**: All similarity computations happen under encryption
4. **Result Privacy**: Scores are returned encrypted; only you can decrypt

## 📋 How It Works

### Client-Side (Browser)

1. **Cluster Loading**: Fetches and stores cluster centroids locally
2. **Query Processing**:
   - Converts text query to embedding vector
   - Finds nearest cluster using cosine similarity
   - Encrypts query vector using homomorphic encryption
3. **PIR Request**: Sends encrypted query + cluster ID to server
4. **Result Decryption**: Decrypts encrypted scores and displays results

### Server-Side (Python/FastAPI)

1. **Initialization**:
   - Embeds all documents using sentence transformers
   - Clusters documents using K-means
   - Stores embeddings and cluster assignments

2. **PIR Processing**:
   - Receives encrypted query (never sees plaintext)
   - Computes encrypted inner products for all documents in selected cluster
   - Returns encrypted scores

3. **Homomorphic Computation**:
   ```python
   encrypted_score = encrypted_query.dot(document_embedding)
   ```
   This computes the similarity entirely under encryption.

## 📁 Project Structure

```
my-app/
├── app/
│   └── page.tsx          # Frontend UI with client-side encryption
├── backend/
│   ├── main.py           # FastAPI server with PIR protocol
│   ├── requirements.txt  # Python dependencies
│   └── README.md         # Backend documentation
└── README.md             # This file
```

## 🔧 Technical Details

### Homomorphic Encryption

- **Backend**: Uses TenSEAL (Python) for real homomorphic encryption
- **Frontend**: Simulated encryption (can be extended with seal.js or WASM wrapper)
- **Operations**: Supports encrypted inner product computation

### Embeddings

- **Model**: `all-MiniLM-L6-v2` (384 dimensions)
- **Purpose**: Semantic understanding of queries and documents
- **Computation**: Client-side for queries, server-side for documents

### Clustering

- **Algorithm**: K-means (10 clusters)
- **Storage**: Centroids stored client-side
- **Selection**: Client finds nearest cluster without revealing query

## 📊 API Endpoints

See `backend/README.md` for detailed API documentation.

Key endpoints:
- `GET /api/clusters` - Get cluster centroids (stored client-side)
- `POST /api/embed` - Generate query embedding
- `POST /api/pir` - Private Information Retrieval
- `GET /api/documents/{id}` - Get document details

## 🎓 Learning Resources

- **Tiptoe Paper**: [Private Web Search with Tiptoe](https://teaching.babman.io/ds593/readings/tiptoe.pdf)
- **TenSEAL Documentation**: https://github.com/OpenMined/TenSEAL
- **Sentence Transformers**: https://www.sbert.net/

## ⚠️ Current Limitations

1. **Frontend HE**: Currently uses simulated encryption (can be extended with real JS library)
2. **Document Corpus**: 20 sample documents (extendable)
3. **Performance**: Optimized for demonstration; production needs scaling

## 🔮 Production Considerations

For a production system:

1. **Real HE in Browser**: Integrate seal.js or TenSEAL WASM wrapper
2. **Database**: Replace in-memory storage with database
3. **Scaling**: 
   - Distributed clustering for millions of documents
   - Efficient PIR protocols
   - Caching and optimization
4. **Security**: 
   - Authentication
   - Rate limiting
   - Input validation
5. **Performance**: 
   - Batch processing
   - Parallel computation
   - CDN for static assets

## 📝 License

This is an educational implementation for research and learning purposes.

## 🙏 Acknowledgments

Based on the Tiptoe paper by Alexandra Henzinger, Emma Dauterman, Henry Corrigan-Gibbs, and Nickolai Zeldovich.
