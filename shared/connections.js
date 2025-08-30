import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
    dimensions: 300,
});
const chatModel = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
    maxTokens: 500,
    timeout: undefined,
    maxRetries: 2,
})

export {
    embeddings,
    chatModel
}