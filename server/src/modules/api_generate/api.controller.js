import { generateApiKey, getOrCreateApiKey } from "./api.service.js";

/**
 * Controller to generate/regenerate an API key for the logged-in user.
 */
export const createApiKeyController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found in token",
      });
    }

    const keyRecord = await generateApiKey(userId);

    const protocol = req.protocol;
    const host = req.get("host");

    return res.status(201).json({
      success: true,
      message: "API key generated successfully",
      apiKey: keyRecord.api_key,
      endpoints: {
        chatUrlWithKey: `${protocol}://${host}/api/${userId}/${keyRecord.api_key}/chat`,
        chatUrl: `${protocol}://${host}/api/${userId}/chat`,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate API key",
      error: error.message,
    });
  }
};

/**
 * Controller to retrieve the active API key and endpoints for the logged-in user.
 */
export const getApiKeyController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found in token",
      });
    }

    const keyRecord = await getOrCreateApiKey(userId);

    const protocol = req.protocol;
    const host = req.get("host");

    return res.status(200).json({
      success: true,
      apiKey: keyRecord.api_key,
      endpoints: {
        chatUrlWithKey: `${protocol}://${host}/api/${userId}/${keyRecord.api_key}/chat`,
        chatUrl: `${protocol}://${host}/api/${userId}/chat`,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve API key",
      error: error.message,
    });
  }
};

