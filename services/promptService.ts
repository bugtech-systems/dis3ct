import { convertQuillToPlainText } from "@/lib/helpers";
import Ollama from 'ollama';
import { createInteraction, getUserInteractions } from "./interactionServices";
import { getPresetByValue } from "./presetServices";
import { getContactByNumber } from "./contactServices";


class PromptService {
    static async generateResponse({ userInput, contact, system, preset, status }: any) {
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
                // Log interaction for tracking AI responses
                await createInteraction({
                    contact,
                    system,
                    ...(preset ? { preset: preset?._id } : {}),
                    inputText: userInput,
                    responseText: response?.message.content,
                    status
                });

                return response?.message.content;
            } else {
                return `{"message": "I'm unable to process your request.", "actions": ["error"]}`;
            }
        } catch (error) {
            console.log("Ollama Error:", error);
            return "I'm unable to process your request.";
        }
    }

    static async generateOptResponse({ message: userInput, sender, system, status = 'pending', mobile }: any) {
        try {
            // 🔹 Fetch necessary data
            const presetResult = await getPresetByValue('opting');
            const preset = presetResult.success ? presetResult.data : null;
            let contactData;
            let contact = system;
            const contactResult = await getContactByNumber(sender, system);
            const systemResult = await getContactByNumber(system, system);


            if (sender) {
                contactData = contactResult.success ? contactResult.data : null;
                contact = sender;
            } else if (systemResult.success) {
                contactData = systemResult.data
            }

            const systemDefaults = await getUserInteractions({ preset: preset?._id, status: "default" });
            const recentChats = await getUserInteractions({ contact, system, preset: preset?._id, status: 'pending' }, 5, { timestamp: 1 });

            // 🔹 Process user & system context
            let sampleConversations: any[] = [];
            let userContext = "";
            let systemContext = "";


            if (systemDefaults?.data) {
                systemDefaults.data.forEach(d => {
                    sampleConversations.push({ role: 'user', content: d.inputText });
                    sampleConversations.push({ role: 'assistant', content: d.feedback?.correction || d.responseText });
                });

                systemContext = systemDefaults.data.map(c =>
                    `User: ${c.inputText}\nAssistant: ${c.feedback?.correction || c.responseText}`
                ).join("\n");
            }

            if (recentChats?.data) {
                userContext = recentChats.data.map(c =>
                    `User: ${c.inputText}\nAssistant: ${c.feedback?.correction || c.responseText}`
                ).join("\n");
            }



            const userData = `
            📌 **User Context**  
            - **Contact Number:** ${sender ? contactData?.phone : "Unknown"}  
            - **Subscription Status:** ${mobile?.data?.subscribedAt ? "Subscribed" : "Not Subscribed"}  
            - **Name:** ${sender ? contactData?.name : "Missing"}  
            - **Location:** ${sender ? contactData?.address : "Missing"}  
            `


            // 🔹 Define AI Behavior Rules
            const promptRules = `
            📌 **AI Response Rules**  
            - Keep responses **minimum 500 and maximum 700 characters**.  
            - Ensure replies are **SMS-friendly**.  
            - Do **not assume** missing details.  
            - Respond in **structured JSON format**.  
            - Do **not generate information** beyond opt-in context.  
            - Always response for opt-in request if **Not Subscribed**.
            `.trim();

            // 🔹 Build AI Prompt
            const userPrompt = `
            ${promptRules}  
            \n
            ${userData}
            \n
    
            📩 **User Input:** ${userInput}
    
            🔹 **Recent Conversations**  
            ${userContext}\n
            `.trim();

            // 🔹 Construct AI Messages Array
            const messages = [
                preset?.systemBehavior ? { role: 'system', content: convertQuillToPlainText(preset?.systemBehavior) } : { role: "system", content: "" },
                ...sampleConversations, // Include system behavior examples
                { role: "user", content: userPrompt }
            ];

            console.log({
                model: preset?.modelName || 'llama3.1',
                messages,
                options: {
                    num_predict: preset?.aiMaxLength,
                    temperature: preset?.aiTemperature,
                    top_p: preset?.aiTopP,
                },
            });

            // 🔹 Generate AI response
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
            if (response?.message) {
                await createInteraction({
                    contact,
                    system,
                    ...(preset ? { preset: preset?._id } : {}),
                    inputText: userInput,
                    responseText: response.message.content,
                    status: 'closed'
                });
                return response.message.content;
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
