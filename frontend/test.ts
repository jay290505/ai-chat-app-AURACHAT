import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import dotenv from "dotenv";

dotenv.config({ path: "C:/Users/JJ/Desktop/chat-app/frontend/.env.local" });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

async function test() {
    try {
        console.log("Testing Tavily...");
        const searchResponse = await tvly.search("What is SpaceX?", {
            searchDepth: "basic",
            maxResults: 4
        });
        
        console.log("Tavily Response keys:", Object.keys(searchResponse));
        
        const searchContext = searchResponse.results
            .map((result: any) => `Source (${result.url}): ${result.content}`)
            .join("\n\n");
            
        console.log("Search Context length:", searchContext.length);

        console.log("Testing Groq...");
        const response = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant. Context: " + searchContext },
                { role: "user", content: "What is SpaceX?" }
            ],
            model: "llama3-8b-8192",
            temperature: 0.7,
        });

        console.log("Groq Answer:", response.choices[0]?.message?.content);
    } catch (e: any) {
        console.error("Test Error:", e.message || e);
        if (e.error) console.error("Error Detail:", e.error);
    }
}

test();
