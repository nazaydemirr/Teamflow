require('dotenv').config();

async function testOpenRouter() {
  const url = "https://openrouter.ai/api/v1/chat/completions";
  const apiKey = process.env.OPENROUTER_API_KEY;
  console.log("Using API Key:", apiKey ? apiKey.substring(0, 15) + "..." : "undefined");
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-pro-1.5",
        messages: [{ role: "user", content: "Test" }]
      })
    });
    
    if (!response.ok) {
      console.log(`Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log("Response:", text);
    } else {
      const data = await response.json();
      console.log("Success:", data.choices[0].message.content);
    }
  } catch(e) {
    console.error(e);
  }
}

testOpenRouter();
