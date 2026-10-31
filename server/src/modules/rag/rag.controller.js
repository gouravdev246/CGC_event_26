import { searchSimilarity, searchWithQueryExpansion, generateRAGAnswer } from "./rag.service.js";
import { validateApiKey } from "../api_generate/api.service.js";
import { logUsage } from "../usage/usage.service.js";

/**
 * Handle incoming RAG chat queries.
 * Validates the API key, performs dual vector search with query improvement,
 * generates grounded LLM answer, and logs live telemetry metrics.
 */
export const handleChatQuery = async (req, res) => {
  const startTime = Date.now();
  const { userid: userId, apikey: paramApiKey } = req.params;

  // Support API key from URL parameter, header, query string, or body
  const apiKey =
    paramApiKey ||
    req.headers["x-api-key"] ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null) ||
    req.query?.apikey ||
    req.body?.apiKey;

  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required in URL path (/api/:userid/chat)",
      });
    }

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "API key is required. Provide it in URL, x-api-key header, or Authorization header.",
      });
    }

    // Authenticate the API key against the database for this specific user
    const isValid = await validateApiKey(userId, apiKey);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid or unauthorized API key for this user.",
      });
    }

    const query = req.body?.query || req.body?.message || req.body?.prompt;
    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid 'query' or 'message' string is required in the request body.",
      });
    }

    const k = Math.min(Number(req.body?.k) || 4, 10);
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    // 1st user question goes to improveQuery, then dual vector search:
    // improved query (k = 3) + user's raw query (k = 2), then deduplicated
    const { improvedQuery, documents: searchResults } = await searchWithQueryExpansion(query.trim(), userId);

    // Format retrieved chunks into context
    const context = searchResults.map((doc) => doc.pageContent).join("\n\n");

    // Generate response using LLM grounded in context
    const answer = await generateRAGAnswer(query.trim(), context, history);
    const latencyMs = Date.now() - startTime;

    // Asynchronously log live telemetry
    logUsage({
      userId,
      apiKey,
      query: query.trim(),
      improvedQuery,
      answer,
      sources: searchResults.map((doc) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
      })),
      status: "success",
      statusCode: 200,
      latencyMs,
      contextText: context,
    }).catch((err) => console.error("Telemetry logging error:", err.message));

    return res.status(200).json({
      success: true,
      query: query.trim(),
      improvedQuery,
      answer,
      response: answer,
      latencyMs,
      responseTime: Number((latencyMs / 1000).toFixed(3)),
      sources: searchResults.map((doc) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
      })),
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error("Chat query processing failed:", error);

    // Log failed execution to telemetry
    logUsage({
      userId: userId || "anonymous",
      apiKey,
      query: req.body?.query || req.body?.message || "unknown",
      answer: "",
      status: "error",
      statusCode: 500,
      latencyMs,
      errorMessage: error.message,
    }).catch((err) => console.error("Telemetry logging error:", err.message));

    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your chat request.",
      error: error.message,
    });
  }
};
