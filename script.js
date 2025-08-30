import dotenv from "dotenv";
import embeddingTest from "./modules/embeddings.js";
import chatModelTest from "./modules/chatOpen.js";
import chatBot from "./modules/chatbot.js";
// Configure dotenv to load environment variables
dotenv.config()

function main(){
    // embeddingTest()
    chatBot()
}
main()


