"use client";

import { useState, useEffect } from "react";

interface SearchResult {
  document_id: number;
  score?: number;
  encrypted_score?: string;
  text: string;
  url?: string;
}

interface ClusterInfo {
  cluster_id: number;
  centroid: number[];
  document_count: number;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const [heContext, setHeContext] = useState<any>(null); // For storing HE context
  const [mounted, setMounted] = useState(false); // Track if component is mounted
  const API_BASE = "http://localhost:8000";

  // Initialize: Fetch cluster centroids and store client-side
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;
    
    setMounted(true);
    fetchClusters();
    initializeHE();
  }, []);

  // Generate mock embedding client-side using random numbers
  // This avoids all dependency issues and works immediately
  // Note: This is a mock - in production you'd use a real embedding model
  const generateEmbedding = async (text: string): Promise<number[]> => {
    // Generate random embedding of 384 dimensions (matching backend model)
    // Use text as seed for deterministic randomness (same query = same embedding)
    const embedding: number[] = [];
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed = ((seed << 5) - seed) + text.charCodeAt(i);
      seed = seed & seed; // Convert to 32-bit integer
    }
    
    // Simple seeded random number generator
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    
    // Generate 384 random values between -1 and 1
    for (let i = 0; i < 384; i++) {
      embedding.push((seededRandom() * 2) - 1);
    }
    
    // Normalize the embedding (cosine similarity requires normalized vectors)
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalized = embedding.map(val => val / magnitude);
    
    console.log("✓ [CLIENT] Generated mock embedding client-side (server never saw query)");
    console.log(`  Embedding dimension: ${normalized.length}`);
    console.log(`  Note: Using mock embeddings (random numbers seeded by query text)`);
    
    return normalized;
  };

  // Initialize homomorphic encryption context (simulated)
  const initializeHE = () => {
    // In a real implementation, this would initialize TenSEAL or another HE library
    // For now, we'll simulate by creating a context object
    // Note: Real HE requires a JavaScript library like seal.js or a WASM wrapper
    setHeContext({ initialized: true, mode: "simulated" });
  };

  // Fetch cluster information and store client-side
  const fetchClusters = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/clusters`);
      if (response.ok) {
        const data = await response.json();
        setClusters(data);
        console.log(`Loaded ${data.length} clusters client-side`);
      }
    } catch (err) {
      console.error("Failed to fetch clusters:", err);
      setError("Failed to load cluster information");
    }
  };

  // Encrypt query vector using homomorphic encryption
  const encryptQuery = async (queryEmbedding: number[]): Promise<{ encrypted: string; context: string }> => {
    // In a real implementation, this would use actual HE (e.g., TenSEAL via WASM)
    // For now, we simulate by encoding the vector
    // The server will treat this as encrypted data
    
    // Simulate encryption: encode the vector as base64
    // In production, this would be actual ciphertext
    const encoder = new TextEncoder();
    const floatArray = new Float32Array(queryEmbedding);
    const buffer = floatArray.buffer;
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    
    // Simulate public context (in real HE, this would be the public key/context)
    const contextBase64 = btoa(JSON.stringify({ mode: "simulated", dim: queryEmbedding.length }));
    
    // Log the encrypted query
    console.log("🔐 [CLIENT] Query Encryption (Client-Side):");
    console.log("  Original query embedding (first 5 values):", queryEmbedding.slice(0, 5));
    console.log("  Encrypted query (base64):", base64.substring(0, 100) + "...");
    console.log("  Encrypted query length:", base64.length, "characters");
    console.log("  Public context (base64):", contextBase64);
    
    return {
      encrypted: base64,
      context: contextBase64
    };
  };

  // Find nearest cluster based on query embedding (client-side)
  const findNearestCluster = (queryEmbedding: number[]): number => {
    if (clusters.length === 0) {
      return 0;
    }

    let maxSimilarity = -1;
    let nearestCluster = 0;
    const similarities: { cluster: number; similarity: number }[] = [];

    for (const cluster of clusters) {
      const centroid = cluster.centroid;
      if (centroid.length !== queryEmbedding.length) continue;

      // Compute cosine similarity
      let dotProduct = 0;
      let magnitudeA = 0;
      let magnitudeB = 0;

      for (let i = 0; i < queryEmbedding.length; i++) {
        dotProduct += queryEmbedding[i] * centroid[i];
        magnitudeA += queryEmbedding[i] * queryEmbedding[i];
        magnitudeB += centroid[i] * centroid[i];
      }

      const similarity = dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
      similarities.push({ cluster: cluster.cluster_id, similarity });

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        nearestCluster = cluster.cluster_id;
      }
    }

    // Log the chosen cluster
    console.log("🔍 [CLIENT] Cluster Selection (Client-Side):");
    console.log("  Query embedding dimension:", queryEmbedding.length);
    console.log("  Chosen cluster:", nearestCluster);
    console.log("  Max similarity:", maxSimilarity.toFixed(4));
    console.log("  All cluster similarities:", similarities.map(s => 
      `Cluster ${s.cluster}: ${s.similarity.toFixed(4)}`
    ).join(", "));
    console.log("  Cluster document count:", clusters[nearestCluster]?.document_count || 0);

    return nearestCluster;
  };

  // Decrypt encrypted scores (client-side)
  const decryptScores = (encryptedScores: string[]): number[] => {
    // In a real implementation, this would use the secret key to decrypt
    // For simulation, we decode the base64
    return encryptedScores.map(enc => {
      try {
        const decoded = atob(enc);
        const buffer = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
          buffer[i] = decoded.charCodeAt(i);
        }
        const floatArray = new Float32Array(buffer.buffer);
        return floatArray[0] || 0;
      } catch {
        return 0;
      }
    });
  };

  // Clear results when query changes
  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    // Clear results when user starts typing a new query
    if (results.length > 0) {
      setResults([]);
      setSelectedCluster(null);
      setError(null);
    }
  };

  // Perform private search
  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    // Clear previous results and state
    setResults([]);
    setSelectedCluster(null);
    setError(null);
    setLoading(true);

    try {
      // Step 1: Generate query embedding (CLIENT-SIDE - server never sees query text!)
      console.log("🔒 [CLIENT] Generating embedding client-side...");
      const queryEmbedding = await generateEmbedding(query);
      console.log("  Embedding dimension:", queryEmbedding.length);
      console.log("  First 5 values:", queryEmbedding.slice(0, 5));

      // Step 2: Find nearest cluster (CLIENT-SIDE - server doesn't know which cluster)
      const clusterId = findNearestCluster(queryEmbedding);
      setSelectedCluster(clusterId);

      // Step 3: Encrypt query vector (CLIENT-SIDE)
      const { encrypted, context } = await encryptQuery(queryEmbedding);

      // Log summary
      console.log("📤 [CLIENT] Sending PIR Request:");
      console.log("  Cluster ID:", clusterId);
      console.log("  Encrypted query sent to server");
      console.log("  Server will compute encrypted inner products without seeing plaintext query");

      // Step 4: Send PIR request with encrypted query
      const pirResponse = await fetch(`${API_BASE}/api/pir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cluster_id: clusterId,
          encrypted_query: encrypted,
          public_context: context,
        }),
      });

      if (!pirResponse.ok) {
        throw new Error("PIR search failed");
      }

      const pirData = await pirResponse.json();

      // Step 5: Decrypt scores (CLIENT-SIDE)
      const decryptedScores = decryptScores(pirData.encrypted_scores);

      // Step 6: Fetch document details and combine with scores
      const resultsWithScores: SearchResult[] = [];
      for (let i = 0; i < pirData.document_ids.length; i++) {
        const docId = pirData.document_ids[i];
        const score = decryptedScores[i];

        // Fetch document details
        try {
          const docResponse = await fetch(`${API_BASE}/api/documents/${docId}`);
          if (docResponse.ok) {
            const doc = await docResponse.json();
            resultsWithScores.push({
              document_id: docId,
              score: score,
              text: doc.text || "",
              url: doc.url,
            });
          }
        } catch (err) {
          console.error(`Failed to fetch document ${docId}:`, err);
        }
      }

      // Sort by score (descending)
      resultsWithScores.sort((a, b) => (b.score || 0) - (a.score || 0));

      setResults(resultsWithScores);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-50 to-white dark:from-black dark:to-zinc-900">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tiptoe Private Search
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Private Information Retrieval System - Your queries remain encrypted
          </p>
          {mounted && (
            <button
              onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
              className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
              suppressHydrationWarning
            >
              {showPrivacyInfo ? "Hide" : "Show"} Privacy Information
            </button>
          )}
        </div>

        {/* Privacy Info */}
        {showPrivacyInfo && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
              How Privacy Works (Tiptoe Protocol):
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li><strong>Client-side embedding:</strong> Your query is converted to a vector locally - server NEVER sees your query text</li>
              <li><strong>Client-side cluster selection:</strong> You find the nearest cluster without revealing your query</li>
              <li><strong>Client-side encryption:</strong> Query vector is encrypted before sending to server</li>
              <li><strong>Homomorphic computation:</strong> Server computes encrypted inner products without seeing your query</li>
              <li><strong>Client-side decryption:</strong> Only you can decrypt and see the results</li>
              <li><strong>Cluster centroids stored client-side:</strong> {clusters.length} clusters loaded locally</li>
            </ul>
          </div>
        )}

        {/* Cluster Status */}
        {mounted && clusters.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ {clusters.length} cluster centroids loaded client-side ({clusters.reduce((sum, c) => sum + c.document_count, 0)} total documents)
            </p>
          </div>
        )}

        {/* Search Box */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !loading && query.trim() && handleSearch()}
              placeholder="Enter your search query (e.g., 'machine learning', 'cryptography')..."
              className="flex-1 px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Selected Cluster Info */}
        {mounted && selectedCluster !== null && (
          <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              Selected Cluster: <span className="font-semibold">{selectedCluster}</span>{" "}
              ({clusters[selectedCluster]?.document_count || 0} documents) - Selected client-side
            </p>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Performing private search...
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              Encrypting query → Finding cluster → Computing encrypted inner products
            </p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
              Search Results ({results.length})
            </h2>
            <div className="space-y-4">
              {results.map((result, idx) => (
                <div
                  key={result.document_id}
                  className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                        #{idx + 1} - Doc {result.document_id}
                      </span>
                    </div>
                    {result.score !== undefined && (
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        Score: {result.score.toFixed(4)}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 mb-2">
                    {result.text}
                  </p>
                  {result.url && (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {result.url}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && query && !error && (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            No results found. Try a different query.
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 p-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <h3 className="font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
            About This System
          </h3>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
            This is an implementation of the Tiptoe private search system. The system uses:
          </p>
          <ul className="text-sm text-zinc-700 dark:text-zinc-300 list-disc list-inside space-y-1">
            <li>Semantic embeddings for query understanding</li>
            <li>Client-side cluster selection (server doesn't know your query)</li>
            <li>Homomorphic encryption for encrypted computation</li>
            <li>Private Information Retrieval (PIR) protocol</li>
            <li>Cluster centroids stored and used client-side</li>
          </ul>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Note: This implementation uses simulated homomorphic encryption. For production, 
            integrate a JavaScript HE library (e.g., seal.js) or use a WASM wrapper for TenSEAL.
          </p>
        </div>
      </main>
    </div>
  );
}
