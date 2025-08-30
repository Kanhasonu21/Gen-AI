import { chatModel } from "../shared/connections.js"
import readline from 'readline'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const getUserInput = (prompt) => {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
};

const chatBot = async()=>{
    console.log("Chatbot started! Type 'exit' to quit.\n");
    
    while(true) {
        try {
            const userInput = await getUserInput("You: ");
            
            if (userInput.toLowerCase().trim() === 'exit') {
                console.log("Goodbye!");
                rl.close();
                break;
            }
            
            if (userInput.trim() === '') {
                console.log("Please enter a message.\n");
                continue;
            }
            
            console.log("Bot is thinking...");
            const result = await chatModel.invoke(userInput);
            console.log("Bot:", result.content);
            console.log(); 
            
        } catch (error) {
            console.error("Error:", error.message);
        }
    }
}

export default chatBot