import { convertQuillToPlainText } from "@/lib/helpers";
import Ollama from 'ollama';
import { createInteraction, getUserInteractions } from "./interactionServices";
import { getPresetByValue } from "./presetServices";
import { getContactByNumber, getContactMobile } from "./contactServices";


class PromptService {
    static async generateResponse({ userInput, contact, system, preset }: { userInput: any, contact: any, system: any, preset: any }) {
        try {
            const instruction = preset?.instruction;
            const systemDefaults = await getUserInteractions({ preset: preset?._id, status: "default" });
            const recentChats = await getUserInteractions({ contact, system, preset: preset?._id, status: "pending" }, 100, { timestamp: 1 });
            let userContext = '';
            let sampleConversations = [] as any[];
            if (recentChats?.data) {
                userContext = recentChats?.data.map(c =>
                    `User: ${c.inputText}\nAssistant: ${c.feedback?.correction ? c.feedback?.correction : c.responseText}`
                ).join("\n");
            }

            if (systemDefaults.data) {
                systemDefaults.data.map(d => {
                    sampleConversations.push({ role: 'user', content: d.inputText })
                    sampleConversations.push({ role: 'assistant', content: d.feedback ? d.feedback.correction : d.responseText })
                })
            }

            // Strict rules for SMS-friendly, short, and emergency-specific responses
            const promptRules = `Follow these strict rules:
        1. Keep responses under 500 characters.
        2. Be short, simple, and direct.
        3. Responses must be SMS-friendly.
        4. Only respond base on recent conversation.\n
        ${instruction ? instruction : ''}`;

            const prompt = `
        ${promptRules}
        
        Recent Conversations:
        ${userContext}

        New User Input: ${userInput}
        `;





            const response = await Ollama.chat({
                model: preset?.modelName || 'llama3.1',
                messages: [
                    //  ...newMessages,
                    preset?.systemBehavior ? { role: 'system', content: convertQuillToPlainText(preset?.systemBehavior) } : { role: "system", content: "" },
                    ...sampleConversations,
                    { role: 'user', content: prompt }
                ],
                options: {
                    num_predict: preset?.max_tokens,
                    temperature: preset?.temperature,
                    top_p: preset?.top_p,
                },
            });


            if (response && response.message) {

                return response?.message.content;
            } else {
                return "I'm unable to process your request.";
            }
        } catch (error) {
            console.log("Ollama Error:", error);
            return "I'm unable to process your request.";
        }
    }

    static async generateOptResponse(userInput: string, contact: any, system: any) {
        try {
            // 🔹 Fetch AI preset for opt-in process
            const presetResult = await getPresetByValue('opting');
            const preset = presetResult.success ? presetResult.data : null;

            // 🔹 Fetch contact details
            const contactResult = await getContactByNumber(contact, system);
            const contactData = contactResult.success ? contactResult.data : null;

            // 🔹 Fetch mobile subscription status
            const mobile = await getContactMobile(contact);

            // 🔹 Fetch system defaults (for formatting reference, NOT response data)
            const systemDefaults = await getUserInteractions({ preset: preset?._id, status: "default" });

            // 🔹 Fetch recent user interactions (used as reference for response)
            const recentChats = await getUserInteractions(
                { contact, system, preset: preset?._id },
                5, // Limit to the 5 most recent interactions
                { timestamp: 1 }
            );


            let userContext = '';
            let sampleConversations = [] as any[];


            // 📌 Convert system defaults into structured AI behavior examples
            // const systemInstruction = systemDefaults?.data?.map(d =>
            //     `🔹 **Example:** User: "${d.inputText}" → AI: "${d.feedback ? d.feedback.correction : d.responseText}"`
            // ).join("\n") || "No predefined examples.";

            if (systemDefaults.data) {
                systemDefaults.data.map(d => {
                    sampleConversations.push({ role: 'user', content: d.inputText })
                    sampleConversations.push({ role: 'assistant', content: d.feedback ? d.feedback.correction : d.responseText })
                })
            }

            if (recentChats?.data) {
                userContext = recentChats?.data.map(c =>
                    `User: ${c.inputText}\nAssistant: ${c.feedback?.correction ? c.feedback?.correction : c.responseText}`
                ).join("\n");
            }


            // 📌 Define AI system behavior & response structure
            const promptRules = `
            📌 **Strict AI Response Rules:**  
            1️⃣ Responses **must be under 500 characters**.  
            2️⃣ **Short, direct, and SMS-friendly** replies only.  
            3️⃣ AI **must not assume missing details**.  
            4️⃣ Base responses **ONLY** on recent interactions.  
            5️⃣ Always respond in **structured JSON format**.  
            6️⃣ **Do NOT generate information** outside of opt-in context.  
                    `.trim();

            // 📌 Construct AI Messages Array
            const messages = [
                preset?.systemBehavior ? { role: 'system', content: convertQuillToPlainText(preset?.systemBehavior) } : { role: "system", content: "" },
                ...sampleConversations, // Include formatted recent conversations
                {
                    role: "user", content: `
    ${promptRules}\n
    ${preset?.instruction}
    
    
    📌 **User Context:**  
    - **Contact ID:** ${contactData?._id || "Unknown"}  
    - **Subscription Status:** ${mobile?.data?.subscribedAt ? "Subscribed" : "Not Subscribed"}  
    - **Name:** ${contactData?.name || "Missing"}  
    - **Location:** ${contactData?.address || "Missing"}  
    
    
    Recent Conversations:
        ${userContext}
    
    
    📩 **New User Input:** ${userInput}  
    
    🤖 **AI Response (Strict JSON Format)**:  
                    `.trim()
                }
            ];



            console.log(messages, userInput)
            // 🔹 Generate AI response using Ollama
            const response = await Ollama.chat({
                model: preset?.modelName || 'llama3.1',
                messages,
                options: {
                    num_predict: preset?.aiMaxLength,
                    temperature: preset?.aiTemperature,
                    top_p: preset?.aiTopP,
                },
            });

            // 🔹 Handle AI response
            if (response && response.message) {
                // Log interaction for tracking AI responses
                await createInteraction({
                    contact,
                    system,
                    ...(preset ? { preset: preset?._id } : {}),
                    inputText: userInput,
                    responseText: response?.message.content
                });

                return response?.message.content;
            } else {
                return `{"message": "I'm unable to process your request.", "actions": ["error"]}`;
            }
        } catch (error) {
            console.error("Ollama Error:", error);
            return `{"message": "I'm unable to process your request.", "actions": ["error"]}`;
        }
    }



}

export default PromptService;
