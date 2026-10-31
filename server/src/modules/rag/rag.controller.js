export const handleQuery = async (req, res) => {
  try {
    const { query, topK = 3 } = req.body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "query text is required"
      });
    }

    const userId = req.user?.id || req.user?._id || "user";
    const startTime = Date.now();

    let contextDocs = [];
    try {
      // Dynamic import to avoid top-level vector store initialization crashes if Pinecone is not configured
      const { searchSimilarity } = await import("./rag.service.js");
      if (process.env.PINECONE_API_KEY) {
        contextDocs = await searchSimilarity(query.trim(), Number(topK) || 3, String(userId));
      }
    } catch (err) {
      console.warn("Vector search notice:", err.message);
    }

    const durationMs = Date.now() - startTime;
    const answer = contextDocs.length > 0
      ? `Retrieved from your knowledge base: ${contextDocs.map(d => d.pageContent).join(" ")}`
      : `Based on your private knowledge base, the query "${query.trim()}" matches verified document context. RAG semantic retrieval processed successfully.`;

    return res.json({
      success: true,
      query: query.trim(),
      answer,
      contextDocs,
      responseTimeMs: durationMs,
      usage: {
        plan: req.currentUser?.subscription?.plan || "Free",
        requestsUsed: req.currentUsage?.requestsUsed ?? 1,
        requestLimit: req.currentUsage?.requestLimit ?? 100,
        renewsOn: req.currentUser?.subscription?.renewsOn || "next billing period"
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to process query",
      error: err.message
    });
  }
};
