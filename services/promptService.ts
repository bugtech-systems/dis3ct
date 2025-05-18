import { cleanJsonObject, convertQuillToPlainText, sanitizePhoneNumber } from "@/lib/helpers";
import Ollama from 'ollama';
import { createInteraction, getUserIntent, getUserInteractions } from "./interactionServices";
import { getPresetByValue } from "./presetServices";
import { getContactByNumber } from "./contactServices";
import axios from "axios";

const OLLAMA_API = process.env.OLLAMA_API || 'http://127.0.0.1:11434/api/generate';


function inferType(value) {
    if (Array.isArray(value)) return "array";
    if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "object" && value !== null) return "object";
    return "string"; // default to string for placeholders
}

function convertToSchemaTemplate(obj) {
    const buildSchema = (value) => {
        const type = inferType(value);

        if (type === "object") {
            const properties = {};
            const required = [];

            for (const key in value) {
                properties[key] = buildSchema(value[key]);
                required.push(key);
            }

            return {
                type: "object",
                properties,
                required
            };
        }

        if (type === "array") {
            return {
                type: "array",
                items: buildSchema(value[0] ?? "")
            };
        }

        return { type };
    };

    return buildSchema(obj);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


class PromptService {
    static async generatePromptResponse({ message, sender, system, preset, mobile }: any) {
        try {
            let instruction = preset?.instruction;

            let contactData;
            let intentData;
            let intent = mobile?.data?.activeIntent ? mobile?.data?.activeIntent : null
            let contact = system;
            const contactResult = await getContactByNumber(sender, system);
            const systemResult = await getContactByNumber(system, system);


            if (sender) {
                contactData = contactResult.success ? contactResult.data : null;
                contact = sender;
            } else if (systemResult.success) {
                contactData = systemResult.data
            }

            if (intent) {
                let intentResult = await getUserIntent(intent, system)
                intentData = intentResult?.data
                if (intentData?.note) {
                    instruction = `${intentData?.note}`;
                }
            }



            const systemDefaults = await getUserInteractions({ preset: preset?._id, status: "default", ...(intentData ? { intent } : {}) });
            console.log({ preset: preset?._id, status: "default", ...(intentData ? { intent } : {}) }, systemDefaults)

            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const filter = {
                contact,
                system,
                preset: preset?._id,
                status: 'pending',
                createdAt: { $gte: startOfDay, $lte: endOfDay },
                ...(intentData ? { intent } : {})
            };

            let sampleConversations = [];
            const systemDefaultData = systemDefaults?.data.map((entry, i) => `${entry.responseText}`);


            console.log(systemDefaultData, 'SYSS', systemDefaults)


            const recentChats = await getUserInteractions(filter, 5, { timestamp: 1 });

            if (recentChats?.data) {
                recentChats.data.forEach(d => {
                    sampleConversations.push({ role: 'user', message: d.inputText });
                    sampleConversations.push({ role: 'assistant', message: d.feedback?.correction || d.responseText });
                });

            }



            const input = {
                message: "",
                intent: "",
                actions: ["SMS", "create_hotline"]
            };

            const hotlines = [
                { department: "Fire Department", number: "160", description: "Fire emergencies" },
                { department: "Ambulance", number: "162", description: "Medical transport and emergencies" },
            ];

            const requiredObject = {
                department: '',
                description: '',
                location: ''
            };



            const collectedData = {
                department: "Fire Department",
                description: "Fire emergencies"
            };

            const systemInstructions = `
Your task is to assist the user based on the list provided. Only respond with information from the list. If a user asks for something outside the list, politely inform them that the information is unavailable.

User queries should be answered only using the list data. Follow these steps:
- If the user asks for a specific hotline number or service, look for it in the list.
- If the service is found, provide the details in a concise, SMS-friendly format.
- If the service is not found, politely inform the user that the information is unavailable.`;


            const prompt = await PromptService.generatePromptWithSystemDefaults({
                systemInstructions,
                systemResponseTemplates: systemDefaultData,
                dataList: hotlines,
                requiredObject,
                recentConversations: sampleConversations,
                collectedData: collectedData,
                userQueryPlaceholder: message
            });
            const schemaTemplate = convertToSchemaTemplate(input);

            console.log(prompt, 'PROMPT', schemaTemplate)
            const response = await axios.post(OLLAMA_API, {
                model: 'mistral',
                prompt: `${prompt}. Respond using JSON`,
                stream: false,
                format: schemaTemplate,
                options: {
                    "num_keep": 10,                // Retains system prompt header and intent tokens
                    "seed": 42,                    // Ensures reproducible behavior (optional)
                    "num_predict": 150,            // Slightly extended token limit (approx 600–700 chars)
                    "top_k": 20,                   // Good balance between accuracy and variety
                    "top_p": 0.85,                 // Keeps output relevant but not robotic
                    "typical_p": 0.8,              // Encourages “expected” responses
                    "repeat_last_n": 50,          // Stronger memory against looping
                    "temperature": 0.6,            // Balanced creativity and control (SMS style)
                    "repeat_penalty": 1.3,         // Strong discouragement of repeated phrases
                    "presence_penalty": 1.7,       // Avoids repeating same ideas (helps with follow-ups)
                    "frequency_penalty": 1.0       // Avoids repeating the same words (e.g., “po” or “hotline”)
                }
            });

            const reply = response.data.response.trim();
            console.log(reply, 'RESPPPPS')
            return reply

        } catch (error) {
            console.log("Ollama Error:", error);
            return `{ "message": "I'm unable to process your request.", "actions": ["SMS", "error"] }`;
        }
    }


    static async generateElectionResponse({ message: userInput, sender, system, preset, mobile, data }: any) {
        try {
            let instruction = preset?.instruction;
            let contact = system;
            let intentData;
            let contactData;

            const contactResult = await getContactByNumber(sender, system);
            const systemResult = await getContactByNumber(system, system);

            if (sender) {
                contactData = contactResult.success ? contactResult.data : null;
                contact = sender;
            } else if (systemResult.success) {
                contactData = systemResult.data;
            }

            const intent = mobile?.data?.activeIntent || null;
            if (intent) {
                const intentResult = await getUserIntent(intent, system);
                intentData = intentResult?.data;
                if (intentData?.note) instruction = `${intentData?.note}`;
            }

            const systemDefaults = await getUserInteractions({ preset: preset?._id, status: "default" }, 3);

            const filter = {
                contact,
                system,
                preset: preset?._id,
                status: 'pending',
            };

            const recentChats = await getUserInteractions(filter, 3, { createdAt: -1 });

            // --- Context Construction ---
            const sampleConversations: any[] = [];
            let systemContext = "";

            if (systemDefaults?.data?.length) {
                systemContext = systemDefaults.data.map(c =>
                    `user: ${c.inputText}.\nassistant: ${c.feedback?.correction || c.responseText}`
                ).join("\n");
            }

            if (recentChats?.data?.length) {
                const sortedChats = [...recentChats.data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                if (systemDefaults.data) {
                    [...systemDefaults?.data].forEach(chat => {
                        sampleConversations.push({ role: 'user', content: chat.inputText });
                        sampleConversations.push({ role: 'assistant', content: chat.feedback?.correction || chat.responseText });
                    });
                }

                sortedChats.forEach(chat => {
                    sampleConversations.push({ role: 'user', content: chat.inputText });
                    sampleConversations.push({ role: 'assistant', content: chat.feedback?.correction || chat.responseText });
                });
            }

            let allTags = [...data.tags, ...data.mediaTags]

            // --- Election Data (Strict) ---
            const userData = `
    📊 ELECTION DATA SNAPSHOT (STRICTLY BASED ON PROVIDED INFORMATION)
    
    - Total Registered Voters: ${data.teamReach}
    - Actual Reach (Number of Voters): ${data.contacts}
    
    🗺️ BARANGAY-WISE STATUS COUNTS:
    ${Object.keys(data.barangay).map((barangay, i) => {
                const b = data.barangay[barangay];
                const rows = [`${i + 1}.) ${barangay}`];
                if (b.total > 0) rows.push(`   - Total: ${b.total}`);
                if (b.confirm > 0) rows.push(`   - Targeted: ${b.confirm}`);
                if (b.declined > 0) rows.push(`   - Declined: ${b.declined}`);
                if (b.undecided > 0) rows.push(`   - Dead: ${b.undecided}`);
                if (b.unknown > 0) rows.push(`   - Unknown: ${b.unknown}`);
                if (b.verified > 0) rows.push(`   - Confirmed or Sure Votes: ${b.verified}`);
                return rows.join('\n') + '\n';
            }).join('\n\n')}
    
    
    
    📦 OVERALL TAG COUNTS (USE EXACT VALUES BELOW):
    ${allTags.map(tag => `- ${tag.value == 'confirm' ? 'TARGETED' : tag.value == 'verified' ? 'CONFIRMED' : tag.value == 'undecided' ? 'DEAD' : tag.label.toUpperCase()}: ${tag.count}`).join('\n')}
    `;
            console.log(allTags, 'TT')
            // --- System Instruction ---
            const systemInstruction = `
    ${convertQuillToPlainText(preset?.systemBehavior) || ''}\n
    ${userData}
    
     **IMPORTANT INSTRUCTIONS:**
    ${instruction}
    📌 RULES FOR RESPONSE:
    - Answer ONLY using the election data above.
    - DO NOT assume or fabricate values.
    - Consider the prompt may be a follow-up or related to recent chats.
    - Be accurate and informative, always referencing the actual counts provided.\n 
 
    `;

            console.log(systemInstruction)

            // --- AI Call ---
            const response = await Ollama.chat({
                model: preset?.modelName || 'llama3.1',
                messages: [
                    { role: 'system', content: systemInstruction },
                    ...sampleConversations,
                    { role: 'user', content: userInput }
                ],
                options: {
                    num_predict: preset?.aiMaxLength,
                    temperature: preset?.aiTemperature,
                    top_p: preset?.aiTopP,
                },
            });
            console.log(response.message, 'RESSP')
            if (response?.message?.content) {
                return response.message.content;
            } else {
                return `{ "message": "I'm unable to process your request.", "actions": ["SMS", "error"] }`;
            }
        } catch (error) {
            console.error("Election Response Error:", error);
            return `{ "message": "I'm unable to process your request.", "actions": ["SMS", "error"] }`;
        }
    }






    static async generateResponse({ message: userInput, sender, system, preset, mobile }: any) {
        try {
            let instruction = preset?.instruction;

            let contactData;
            let intentData;
            let intent = mobile?.data?.activeIntent ? mobile?.data?.activeIntent : null
            let contact = system;
            const contactResult = await getContactByNumber(sender, system);
            const systemResult = await getContactByNumber(system, system);


            if (sender) {
                contactData = contactResult.success ? contactResult.data : null;
                contact = sender;
            } else if (systemResult.success) {
                contactData = systemResult.data
            }

            if (intent) {
                let intentResult = await getUserIntent(intent, system)
                intentData = intentResult?.data
                if (intentData?.note) {
                    instruction = `${intentData?.note} `;
                }
            }


            console.log(intentData, 'INTT')
            const systemDefaults = await getUserInteractions({ preset: preset?._id, status: "default", ...(intentData ? { intent } : {}) });

            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const filter = {
                contact,
                system,
                preset: preset?._id,
                status: 'pending',
                createdAt: { $gte: startOfDay, $lte: endOfDay },
                ...(intentData ? { intent } : {})
            };


            const recentChats = await getUserInteractions(filter, 5, { timestamp: 1 });


            // 🔹 Process user & system context
            let sampleConversations: any[] = [];
            let userContext = "";
            let systemContext = "";


            if (systemDefaults?.data) {


                systemContext = systemDefaults.data.map(c =>
                    `Intent: ${c.intent}.\nPrompt: ${c.inputText}.\nResponse: ${c.feedback?.correction || c.responseText} `
                ).join("\n\n");



            }

            if (recentChats?.data) {
                recentChats.data.forEach(d => {
                    sampleConversations.push({ role: 'user', content: d.inputText });
                    sampleConversations.push({ role: 'assistant', content: d.feedback?.correction || d.responseText });
                });

                userContext = recentChats.data.map(c =>
                    `Intent: ${c.intent}.\nPrompt: ${c.inputText}.\nResponse: ${c.feedback?.correction || c.responseText} `
                ).join("\n\n");
            }



            const userData = `
            📌 ** User Context **  
            - ** Subscription Status:** ${mobile?.data?.subscribedAt ? "Subscribed" : "Not Subscribed"}
        `


            // Strict rules for SMS-friendly, short, and emergency-specific responses
            const promptRules = `Follow these strict rules:
        - Keep responses ** minimum 500 and maximum 700 characters **.  
        - Responses must be SMS - friendly.
        - Do ** not assume ** missing details.  
        - Respond in ** structured JSON format ** Do ** not generate text or content ** outside JSON object.  
        - Should use the ** System sample ** as reference to response sequence, behavior, format or template.But not it's subjects, as data value.  
            `




            const prompt = `
        ${promptRules} \n
            ** IMPORTANT INSTRUCTION **
                ${instruction} \n

                    ** User Input:** ${userInput}
        `.trim();

            let systemInstruction = `${preset?.systemBehavior} \n\n
            ** System Sample Responses **
                ${systemContext} `;



            console.log(mobile, [
                //  ...newMessages,
                preset?.systemBehavior ? { role: 'system', content: convertQuillToPlainText(systemInstruction) } : { role: "system", content: "" },
                ...sampleConversations,
                { role: 'user', content: prompt }
            ], 'PROMPTTT HELP')

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

                return response?.message.content;
            } else {
                return `{ "message": "I'm unable to process your request.", "actions": ["SMS", "error"] } `;
            }
        } catch (error) {
            console.log("Ollama Error:", error);
            return `{ "message": "I'm unable to process your request.", "actions": ["SMS", "error"] }`;
        }
    }

    static async generateOptResponse({ message: userInput, sender, system, preset, mobile }: any) {
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
                    `Prompt: ${c.inputText}.\nResponse: \n${c.feedback?.correction || c.responseText} `
                ).join("\n\n");
            }

            if (recentChats?.data) {
                // recentChats.data.forEach(d => {
                //     sampleConversations.push({ role: 'user', content: d.inputText });
                //     sampleConversations.push({ role: 'assistant', content: d.feedback?.correction || d.responseText });
                // });

                userContext = recentChats.data.map(c =>
                    `Prompt: ${c.inputText} \nResponse: ${c.feedback?.correction || c.responseText} `
                ).join("\n");
            }



            const userData = `
            📌 ** User Context **  
            - ** Contact Number:** ${sender ? contactData?.phone : "Unknown"}  
            - ** Subscription Status:** ${mobile?.data?.subscribedAt ? "Subscribed" : "Not Subscribed"}
        `


            // Strict rules for SMS-friendly, short, and emergency-specific responses
            const promptRules = `Follow these strict rules:
        - Responses must be SMS - friendly.
        - Do ** not assume ** missing details.  
        - Respond in ** structured JSON format **. 
        - Always response for opt -in request if Subscription status is ** Not Subscribed ** and prompt is not opt -in or SUBSCRIBE.
       `

            const promptInstruction = `
        ${promptRules} \n
            ** IMPORTANT INSTRUCTION **
                ${instruction} \n
                `.trim();
            const prompt = `
                    ** User DATA **: ${userData}
            ** User Prompt **: ${userInput}
          
             `.trim();

            let systemInstruction = `${convertQuillToPlainText(preset?.systemBehavior)} \n
            ${promptInstruction}
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
                    "num_keep": 10,                // Retains system prompt header and intent tokens
                    "seed": 42,                    // Ensures reproducible behavior (optional)
                    "num_predict": 150,            // Slightly extended token limit (approx 600–700 chars)
                    "top_k": 20,                   // Good balance between accuracy and variety
                    "top_p": 0.85,                 // Keeps output relevant but not robotic
                    "typical_p": 0.8,              // Encourages “expected” responses
                    "repeat_last_n": 50,          // Stronger memory against looping
                    "temperature": 0.6,            // Balanced creativity and control (SMS style)
                    "repeat_penalty": 1.3,         // Strong discouragement of repeated phrases
                    "presence_penalty": 1.7,       // Avoids repeating same ideas (helps with follow-ups)
                    "frequency_penalty": 1.0       // Avoids repeating the same words (e.g., “po” or “hotline”)
                },
            });
            console.log(response, 'RESPPPP', systemContext)

            if (response && response.message) {
                // Log interaction for tracking AI responses
                /*                await createInteraction({
                                   contact: sanitizePhoneNumber(contact),
                                   system: sanitizePhoneNumber(system),
                                   ...(preset ? { preset: preset?._id } : {}),
                                   inputText: userInput,
                                   responseText: response?.message.content,
                                   status
                               }); */

                return response?.message.content;
            } else {
                return `{ "message": "I'm unable to process your request.", "actions": ["error"] } `;
            }
        } catch (error) {
            console.log("Ollama Error:", error);
            return `{ "message": "I'm unable to process your request.", "actions": ["SMS", "error"] }`;
        }
    }

    static async generateOptsResponse({ message: userInput, sender, system, mobile }: any) {
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
                    `User: ${c.inputText} \nAssistant: ${c.feedback?.correction || c.responseText} `
                ).join("\n");
            }

            if (recentChats?.data) {
                userContext = recentChats.data.map(c =>
                    `User: ${c.inputText} \nAssistant: ${c.feedback?.correction || c.responseText} `
                ).join("\n");
            }



            const userData = `
            📌 ** User Context **  
            - ** Contact Number:** ${sender ? contactData?.phone : "Unknown"}  
            - ** Subscription Status:** ${mobile?.data?.subscribedAt ? "Subscribed" : "Not Subscribed"}

        `


            // 🔹 Define AI Behavior Rules
            const promptRules = `
            📌 ** AI Response Rules **
            - Keep responses ** minimum 500 and maximum 700 characters **.  
            - Ensure replies are ** SMS - friendly **.  
            - Do ** not assume ** missing details.  
            - Respond in ** structured JSON format **.  
            - Do ** not generate information ** beyond opt -in context.  
            - Always response for opt -in request if ** Not Subscribed **.
            `.trim();

            // 🔹 Build AI Prompt
            const userPrompt = `
            ${promptRules}
        \n
            ${instruction} \n
            ${userData}
        \n
    
            📩 ** User Input:** ${userInput}
    
            🔹 ** Recent Conversations **
            ${userContext} \n
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
                return `{ "message": "I'm unable to process your request.", "actions": ["error"] } `;
            }
        } catch (error) {
            console.error("Ollama Error:", error);
            return `{ "message": "I'm unable to process your request.", "actions": ["error"] } `;
        }
    }

    static async generatePromptWithSystemDefaults({
        systemInstructions,
        systemResponseTemplates,
        dataList,
        requiredObject,
        recentConversations = [],
        collectedData = {},
        userQueryPlaceholder = "[Insert user query here]"
    }) {
        const formattedSystemTemplates = systemResponseTemplates.map((entry, i) =>
            `${i + 1}. ${entry} `
        ).join('\n');

        const formattedDataList = dataList.map((item, i) =>
            `${i + 1}. ${Object.entries(item).map(([k, v]) => `${capitalize(k)}: ${v}`).join(", ")} `
        ).join("\n");

        const formattedCollectedData = Object.keys(collectedData).length
            ? Object.entries(collectedData).map(([k, v]) => `- ${capitalize(k)}: ${v} `).join('\n')
            : "(None yet)";

        const missingFields = Object.keys(requiredObject).filter(field => !collectedData[field]);

        const formattedRecentConversations = recentConversations.map((entry) =>
            `${entry.role === 'user' ? 'User' : 'AI'}: ${entry.message} `
        ).join('\n');

        const followUpInstructions = missingFields.map(field =>
            `- Ask the user: "Ano po ang ${field}?"`
        ).join('\n');

        return `
      You are ALAYON Assistant, an SMS - based AI chatbot for emergency hotlines, elections, and public assistance in Tacloban City.
      
      📌 System Instructions:
      ${systemInstructions.trim()}
      
      🧾 Response Templates(System Defaults):
      ${formattedSystemTemplates}
      
      📋 Reference Data List:
      ${formattedDataList}
      
      🧠 Recent Conversation Context(Accumulated Info):
      ${formattedRecentConversations || "(None yet)"}
      
      📦 Collected Data So Far:
      ${formattedCollectedData}
      
      ❓ Fields Still Missing:
      ${missingFields.length > 0 ? missingFields.join(", ") : "None"}
      
      📍 Follow - up Instructions:
      ${followUpInstructions || "- No follow-up questions needed."}
      
      📜 Final Step:
        - If all fields are gathered, summarize in a clean, human - readable format.
      - Ask the user to confirm the info or let you know if corrections are needed.
      - Response must be under 700 characters and ONLY based on system instructions and collected data.
      
      🔍 Example Input:
        User: ${userQueryPlaceholder}
      AI Response:
        `.trim();
    }



    static async generateCompletePrompt({
        listName,
        dataList,
        instruction,
        requiredObject,
        conversationHistory = [],
        collectedData = {},
        userQueryPlaceholder = "[Insert user query here]"
    }: any) {
        // Format the reference list
        const formattedList = dataList.map((item, i) =>
            `${i + 1}. ${Object.entries(item).map(([k, v]) => `${capitalize(k)}: ${v}`).join(", ")} `
        ).join("\n");

        // Determine which fields are still missing
        const requiredFields = Object.keys(requiredObject);
        const missingFields = requiredFields.filter(field => !collectedData[field]);

        const followUpInstructions = missingFields.map(field =>
            `- If "${field}" is still missing, ask a short follow - up question to get this information.`
        ).join('\n');

        const summaryInstructions = `
            - After collecting all required fields, present a clean summary of the data in a human - readable format.
  - Ask the user if everything is correct, and politely confirm the details.
  `;

        // Format conversation history
        const formattedHistory = conversationHistory.map((entry, index) => {
            const role = entry.role === 'user' ? 'User' : 'AI';
            return `${role}: ${entry.message} `;
        }).join('\n');

        // Format currently collected data
        const formattedCollectedData = Object.keys(collectedData).length
            ? Object.entries(collectedData).map(([key, val]) => `- ${capitalize(key)}: ${val} `).join('\n')
            : "(None yet)";

        return `
  You are ALAYON Assistant, a polite and informative chatbot that provides SMS - based support to Tacloban City residents.
  
  ⚠️ AI Rules:
        - Keep responses under 700 characters.
  - Only use the list and instructions below.
  - Never hallucinate or assume data outside provided info.
  - Use recent conversation context to continue collecting data.
  - Ask follow - up questions for missing fields.
  - Once complete, show a summary and ask for confirmation.
  
  📌 List: ${listName}
  ${formattedList}
  
  📝 Instructions:
  ${instruction.trim()}
  
  🧠 Conversation History:
  ${formattedHistory || "(No prior conversation)"}
  
  📦 Data Collected:
  ${formattedCollectedData}
  
  🔍 Fields Still Needed:
  ${missingFields.length > 0 ? missingFields.join(", ") : "None – ready to summarize"}
  
  📌 Follow - up Instructions:
  ${followUpInstructions}
  ${summaryInstructions.trim()}
  
  💬 Example Input:
        User: ${userQueryPlaceholder}
  AI Response:
        `.trim();
    }




}

export default PromptService;
