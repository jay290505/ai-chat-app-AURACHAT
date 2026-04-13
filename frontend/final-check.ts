
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function test() {
    console.log("Final check for Mistral...");
    const model = "mistralai/Mistral-7B-Instruct-v0.2";
    const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
        headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_HF_TOKEN}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: "Hello Aura, what is 1+1?" }),
    });
    console.log("Status:", response.status);
    const result = await response.json();
    console.log("Result:", JSON.stringify(result, null, 2));
}

test();
