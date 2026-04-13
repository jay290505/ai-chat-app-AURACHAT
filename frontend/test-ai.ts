
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function test() {
    console.log("Testing BART on Router...");
    const model = "facebook/bart-large-cnn";
    const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
        headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_HF_TOKEN}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: "The infrastructure migration is complete. The old endpoint is gone. We are using the new router at router.huggingface.co now." }),
    });
    console.log("Status:", response.status);
    const result = await response.json();
    console.log("Result:", JSON.stringify(result, null, 2));
}

test();
