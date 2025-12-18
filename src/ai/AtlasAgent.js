
import { CONFIG } from "../config.js";

export class AtlasAgent {
    constructor() {
        this.systemPrompt = `
You are the AI Copilot for 'Solstice Atlas', a 3D Earth and Solar System visualization. 
Your goal is to translate user natural language into JSON commands to control the app.

AVAILABLE ACTIONS:
1. SWITCH_VIEW
   - params: { view: "earth" | "solar" }
   - Listen for: "Go to Earth", "Show me space", "Solar system mode".

2. FLY_TO
   - params: { target: "mercury"|"venus"|"earth"|"mars"|"jupiter"|"saturn"|"uranus"|"neptune"|"sun" }
   - Listen for: "Take me to Jupiter", "Zoom in on Mars".
   - ONLY works if view is already "solar" or implies going to solar. If user asks "Go to Mars", imply SWITCH_VIEW: "solar" AND FLY_TO: "mars" (return list of actions).

3. TOGGLE_LAYER
   - params: { layer: "earthquakes"|"volcanoes"|"wildfires"|"satellites", state: true|false }
   - Listen for: "Show earthquakes", "Turn off fires", "Enable orbit lines".


5. FILTER_LAYER
    - params: { layer: "earthquakes", minMag: number, keyword: string }
    - Listen for: "Show magnitude 6+ earthquakes", "Filter big quakes", "Show quakes in Japan".
    - NOTE: For "Big quakes", imply minMag: 6.0.

6. RESET
   - params: {}
   - Listen for: "Reset view", "Go back", "Clear everything", "Show all earthquakes".
   - If user says "Show all", it implies RESET or FILTER_LAYER with null params? Prefer RESET or re-enabling layer.


OUTPUT FORMAT:
Return ONLY a JSON Array of objects. No markdown. No text.
Example: [{"action": "SWITCH_VIEW", "params": {"view": "solar"}}, {"action": "FLY_TO", "params": {"target": "jupiter"}}]
`;
    }

    async process(text) {
        if (!CONFIG.OPENAI_KEY) {
            console.error("No API Key found");
            return [];
        }

        try {
            console.log("AI Request:", text);
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${CONFIG.OPENAI_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: this.systemPrompt },
                        { role: "user", content: text }
                    ],
                    temperature: 0.1
                })
            });

            const data = await response.json();
            if (data.error) {
                console.error("OpenAI Error:", data.error);
                return [];
            }

            const content = data.choices[0].message.content;
            console.log("AI Raw Response:", content);

            // Robust JSON Extraction
            let cleanJson = content;
            const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
            const match = content.match(codeBlockRegex);
            if (match) {
                cleanJson = match[1];
            }

            return JSON.parse(cleanJson);

        } catch (e) {
            console.error("AtlasAgent failed:", e);
            return [];
        }
    }
}
