import { cleanJsonObject, convertQuillToPlainText, sanitizePhoneNumber } from "@/lib/helpers";
import Ollama from 'ollama';
import { createInteraction, getUserInteractions } from "./interactionServices";
import { getPresetByValue } from "./presetServices";
import { getContactByNumber } from "./contactServices";


class PromptService {
    static async generateResponse({ message: userInput, sender, system, preset, status, mobile }: any) {
        try {
            const instruction = preset?.instruction;

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

            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const filter = {
                contact,
                system,
                preset: preset?._id,
                status: 'pending',
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            };


            const recentChats = await getUserInteractions(filter, 5, { timestamp: 1 });


            // 🔹 Process user & system context
            let sampleConversations: any[] = [];
            let userContext = "";
            let systemContext = "";


            if (systemDefaults?.data) {


                systemContext = systemDefaults.data.map(c =>
                    `Intent: ${c.intent}.\nPrompt: ${c.inputText}.\nResponse: ${c.feedback?.correction || c.responseText}`
                ).join("\n\n");



            }

            if (recentChats?.data) {
                recentChats.data.forEach(d => {
                    sampleConversations.push({ role: 'user', content: d.inputText });
                    sampleConversations.push({ role: 'assistant', content: d.feedback?.correction || d.responseText });
                });

                userContext = recentChats.data.map(c =>
                    `Intent: ${c.intent}.\nPrompt: ${c.inputText}.\nResponse: ${c.feedback?.correction || c.responseText}`
                ).join("\n\n");
            }



            const userData = `
            📌 **User Context**  
            - **Subscription Status:** ${mobile?.data?.subscribedAt ? "Subscribed" : "Not Subscribed"}  
            `


            // Strict rules for SMS-friendly, short, and emergency-specific responses
            const promptRules = `Follow these strict rules:
        - Keep responses **minimum 500 and maximum 700 characters**.  
        - Responses must be SMS-friendly.
        - Do **not assume** missing details.  
        - Respond in **structured JSON format** Do **not generate text or content** outside JSON object.  
        - Should use the **System sample** as reference to response sequence, behavior, format or template. But not it's subjects, as data value.  
       `

            const prompt = `
        ${promptRules}\n
        **IMPORTANT INSTRUCTION**
         ${instruction}\n
    
            **User Input:** ${userInput}
             `.trim();

            let systemInstruction = `${preset?.systemBehavior}\n\n
            **System Sample Responses**
            ${systemContext}`;





            const response = await Ollama.chat({
                model: preset?.modelName || 'llama3.1',
                messages: [
                    //  ...newMessages,
                    preset?.systemBehavior ? { role: 'system', content: convertQuillToPlainText(systemInstruction) } : { role: "system", content: "" },
                    ...sampleConversations,
                    { role: 'user', content: prompt }
                ],
                options: {
                    num_predict: preset?.aiMaxLength,
                    temperature: preset?.aiTemperature,
                    top_p: preset?.aiTopP,
                },
            });

            if (response && response.message) {
                // Log interaction for tracking AI responses
                let contentData = JSON.parse(cleanJsonObject(response?.message.content))

                await createInteraction({
                    contact: sanitizePhoneNumber(contact),
                    system: sanitizePhoneNumber(system),
                    ...(preset ? { preset: preset?._id } : {}),
                    inputText: userInput,
                    responseText: response?.message.content,
                    status,
                    intent: contentData?.intent
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

    static async generateOptResponse({ message: userInput, sender, system, preset, status, mobile }: any) {
        try {
            const instruction = preset?.instruction;

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

            const systemDefaults = await getUserInteractions({ preset: preset?._id, status: "default" }, 100, { timestamp: 1 });
            const recentChats = await getUserInteractions({ contact, system, preset: preset?._id, status: 'pending' }, 5, { timestamp: 1 });


            // 🔹 Process user & system context
            let sampleConversations: any[] = [];
            let userContext = "";
            let systemContext = "";


            if (systemDefaults?.data) {
                systemDefaults?.data.forEach(d => {
                    sampleConversations.push({ role: 'user', content: d.inputText });
                    sampleConversations.push({ role: 'assistant', content: d.feedback?.correction || d.responseText });
                });

                systemContext = systemDefaults.data.map(c =>
                    `User Prompt: ${c.inputText}.\nResponse:\n${c.feedback?.correction || c.responseText}`
                ).join("\n\n");
            }

            if (recentChats?.data) {
                // recentChats.data.forEach(d => {
                //     sampleConversations.push({ role: 'user', content: d.inputText });
                //     sampleConversations.push({ role: 'assistant', content: d.feedback?.correction || d.responseText });
                // });

                userContext = recentChats.data.map(c =>
                    `Prompt: ${c.inputText}\nResponse: ${c.feedback?.correction || c.responseText}`
                ).join("\n");
            }



            const userData = `
            📌 **User Context**  
            - **Contact Number:** ${sender ? contactData?.phone : "Unknown"}  
            - **Subscription Status:** ${mobile?.data?.subscribedAt ? "Subscribed" : "Not Subscribed"}  
            `


            // Strict rules for SMS-friendly, short, and emergency-specific responses
            const promptRules = `Follow these strict rules:
        - Responses must be SMS-friendly.
        - Do **not assume** missing details.  
        - Respond in **structured JSON format**. 
        - Always response for opt-in request if Subscription status is **Not Subscribed** and prompt is not opt-in or SUBSCRIBE.
       `

            const prompt = `
        ${promptRules}\n
        **IMPORTANT INSTRUCTION**
         ${instruction}\n
    
            **User DATA**: ${userData}
            **User Prompt**: ${userInput}
            **Recent Conversations**  
            ${userContext}\n
             `.trim();

            let systemInstruction = `${convertQuillToPlainText(preset?.systemBehavior)}\n
         `;





            console.log([
                //  ...newMessages,
                preset?.systemBehavior ? { role: 'system', content: systemInstruction } : { role: "system", content: "" },
                ...sampleConversations,
                { role: 'user', content: prompt }
            ], 'PROMPTTT')
            const response = await Ollama.chat({
                model: preset?.modelName ? preset?.modelName : 'llama3.1',
                messages: [
                    //  ...newMessages,
                    preset?.systemBehavior ? { role: 'system', content: systemInstruction } : { role: "system", content: "" },
                    ...sampleConversations,
                    { role: 'user', content: prompt }
                ],
                options: {
                    num_predict: preset?.aiMaxLength,
                    temperature: preset?.aiTemperature,
                    top_p: preset?.aiTopP,
                },
            });


            if (response && response.message) {
                // Log interaction for tracking AI responses
                await createInteraction({
                    contact: sanitizePhoneNumber(contact),
                    system: sanitizePhoneNumber(system),
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

    static async generateOptsResponse({ message: userInput, sender, system, status = 'pending', mobile }: any) {
        try {

            // 🔹 Fetch necessary data
            const presetResult = await getPresetByValue('opting');
            const preset = presetResult.success ? presetResult.data : null;
            let contactData;
            let contact = system;
            const contactResult = await getContactByNumber(sender, system);
            const systemResult = await getContactByNumber(system, system);
            const instruction = preset?.instruction;


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
            ${instruction}\n
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
