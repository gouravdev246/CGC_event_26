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

export const vectorStore = await PineconeStore.fromExistingIndex(
    embeddings,
    {
        pineconeIndex,
        maxConcurrency: 5,
    }
);







export async function searchSimilarity(query, k, userid) {
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