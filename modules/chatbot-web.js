import { chatModel } from "../shared/connections.js";
const chat_history = [];

// Web-compatible chatbot function that doesn't use readline
const webChatBot = async (userMessage,chat_history) => {
    try {
        if (!userMessage || userMessage.trim() === '') {
            return "Please enter a message.";
        }

        // Get AI response
        const result = await chatModel.invoke(chat_history);
        chat_history.push(result.content)
        const botResponse = result.content;

        console.log(`Bot: ${botResponse}`);

        return botResponse;

    } catch (error) {
        console.error("Error:", error.message);
        return "Sorry, I encountered an error. Please try again.";
    }
};

// Original terminal-based chatbot function (unchanged)
const terminalChatBot = async () => {
    const readline = await import('readline');

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

    console.log("Chatbot started! Type 'exit' to quit.\n");

    while (true) {
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
};

// Export both versions
export { webChatBot, terminalChatBot };
export default terminalChatBot;
