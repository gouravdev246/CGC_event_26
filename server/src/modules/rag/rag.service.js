import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { text } from "node:stream/consumers";
import { Document } from "@langchain/core/documents";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { CohereEmbeddings } from "@langchain/cohere";
import { ChatGroq } from "@langchain/groq"



async function pdfloader(filepath, userid) {
    const loader = new PDFLoader(filepath, {
        // Optional configuration:
        splitPages: true, // Default: true. Parses each page as a separate document chunk.
    });

    // 2. Load and parse the PDF content
    const docs = await loader.load();
    const fulltext = docs.map((doc) => doc.pageContent).join(" ")

    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })
    const texts = await splitter.splitText(fulltext)
    const finalText = texts.map((text, index) => {
        return {
            pageContent: text,
            metadata: {
                source: `${userid}`,
                page: index + 1,
            }
        }
    })
    return finalText;
}

export const embeddings = new CohereEmbeddings({
    model: "embed-english-v3.0", // Natively outputs 1024 dimensions!
    apiKey: process.env.COHERE_API_KEY || "",
});


const pinecone = new PineconeClient({
    apiKey: process.env.PINECONE_API_KEY || "",
});
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX || "personalrag");

export let vectorStore = null;

if (process.env.PINECONE_API_KEY && process.env.COHERE_API_KEY) {
    try {
        vectorStore = await PineconeStore.fromExistingIndex(
            embeddings,
            {
                pineconeIndex,
                maxConcurrency: 5,
            }
        );
    } catch (err) {
        console.warn("Pinecone index notice:", err.message);
    }
}



export async function generateEmbeddingStoreDB(userid, filepath) {
    console.log("Generate Starting....");

    // Resolve upload directory path (supports 'uploads' or 'upload' folder)
    const uploadDir = [
        path.resolve(import.meta.dirname, "../../../uploads"),
        path.resolve(import.meta.dirname, "../../../upload"),
        path.resolve(process.cwd(), "uploads"),
        path.resolve(process.cwd(), "server/uploads"),
    ].find((dir) => fs.existsSync(dir)) || path.resolve(import.meta.dirname, "../../../uploads");

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Determine target files: either the provided filepath or all PDF files in the upload folder
    let filesToProcess = [];

    if (filepath) {
        const directPath = path.isAbsolute(filepath) ? filepath : path.resolve(process.cwd(), filepath);
        const insideUploadPath = path.resolve(uploadDir, filepath);

        if (fs.existsSync(directPath) && fs.statSync(directPath).isDirectory()) {
            const files = fs.readdirSync(directPath);
            filesToProcess = files
                .filter((file) => file.toLowerCase().endsWith(".pdf"))
                .map((file) => path.join(directPath, file));
        } else if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
            filesToProcess.push(directPath);
        } else if (fs.existsSync(insideUploadPath) && fs.statSync(insideUploadPath).isFile()) {
            filesToProcess.push(insideUploadPath);
        } else {
            throw new Error(`File not found: ${filepath}`);
        }
    } else {
        const files = fs.readdirSync(uploadDir);
        filesToProcess = files
            .filter((file) => file.toLowerCase().endsWith(".pdf"))
            .map((file) => path.join(uploadDir, file));
    }

    if (filesToProcess.length === 0) {
        return {
            status: 404,
            message: "No PDF files found to process in the upload folder",
        };
    }

    const processedFiles = [];

    // Process files one by one and add embeddings to the vector store
    for (const currentFilePath of filesToProcess) {
        console.log(`Processing file: ${currentFilePath}`);
        const documents = await pdfloader(currentFilePath, userid);
        if (documents && documents.length > 0) {
            await vectorStore.addDocuments(documents);
        }
        processedFiles.push(path.basename(currentFilePath));
    }

    return {
        status: 200,
        message: "Documents Added Successfully",
        processedFiles,
    };
}



export async function searchSimilarity(query, k, userid) {
    if (!vectorStore) return [];
    const filter = { source: userid };

    const similaritySearchResults = await vectorStore.similaritySearch(query, k, filter);
    return similaritySearchResults;
}






export async function improveQuery(query) {
    const llm = new ChatGroq({
        model: "openai/gpt-oss-120b",
        temperature: 0,
        maxTokens: undefined,
        maxRetries: 2,

    })
    const aiMsg = await llm.invoke([
    {
      role: "system",
      content: "You are a helpful assistant that translates English to French. Translate the user sentence.",
    },
    { role: "user", content: query },
])


return aiMsg.content ;



}