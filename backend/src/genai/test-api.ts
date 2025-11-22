import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

async function testAPI() {
  try {
    console.log("🧪 Testing OpenAI API connection...\n");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Test 1: Simple text generation
    console.log("📝 Test 1: Text Generation (GPT-4o-mini)");
    const textResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: 'Say "Hello, API is working!"' }],
      max_tokens: 20,
    });

    console.log("✅ Text response:", textResponse.choices[0].message.content);
    console.log("💰 Cost: ~$0.0001\n");

    // Test 2: Image generation
    console.log("🎨 Test 2: Image Generation (DALL-E 3)");
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: "A simple red circle on white background",
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });

    console.log(
      "✅ Image URL:",
      imageResponse.data?.[0].url?.substring(0, 50) + "..."
    );
    console.log("💰 Cost: $0.04\n");

    console.log("🎉 ALL TESTS PASSED! Your API is ready to use.");
    console.log("💵 Total test cost: ~$0.04\n");
  } catch (error) {
    console.error("❌ Error:", error);

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        console.log("\n💡 Fix: Check your .env file has the correct API key");
      }
      if (error.message.includes("quota")) {
        console.log(
          "\n💡 Fix: Add payment method at https://platform.openai.com/settings/organization/billing"
        );
      }
    }
  }
}

testAPI();
