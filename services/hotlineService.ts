import { cleanJsonObject, cleanToJson, convertQuillToPlainText, isParsableObject } from '@/lib/helpers';
import Ollama from 'ollama';

interface EmergencyDetails {
    callerName?: string;
    location?: string;
    emergencyType?: string;
    details?: string;
}

interface OllamaOptions {
    temperature: number;
    top_p: number;
    max_tokens: number;
}

/**
 * OllamaService class for structuring emergency prompts and interacting with the Ollama AI API.
 */
class HotlineService {
    private model: string;
    private options: OllamaOptions;

    constructor(model: string = 'llama3.1') {
        this.model = model;
        this.options = {
            temperature: 0.1,
            top_p: 0.9,
            max_tokens: 1000,
        };
    }

    /**
     * Determines emergency details from the user's input.
     * @param userPrompt - The caller's message.
     * @param conversationHistory - Previous chat history.
     * @returns - AI response with extracted emergency details.
     */
    async processEmergency(userPrompt: string, systemPrompt: any, conversationHistory: any): Promise<any> {
        try {
            this.setOptions('llama3.1', this.options);

            const history = conversationHistory
                .map((convo: any) => `${convo.role}: ${convo.content}`)
                .join('\n');


            const structuredPrompt = this.createPrompt(userPrompt, systemPrompt, history);

            const response = await this.callOllamaAPI(structuredPrompt, conversationHistory);

            return JSON.parse(cleanToJson(response));
        } catch (error) {
            console.error('Error processing emergency request:', error);
            throw new Error('Failed to process emergency request.');
        }
    }

    /**
     * Creates a structured prompt for processing emergencies.
     * @param userPrompt - The caller's message.
     * @param history - Conversation history.
     * @returns - A structured prompt string.
     */
    createPrompt(userPrompt: string, systemPrompt: string, history: string): string {

        return `
  ${systemPrompt}
  
  # Reference Chat History (for formatting only, do not copy values):
  ${history}

  # Actual Chat History (identify missing values):
  ${history}

  User: ${userPrompt}
  Assistant: (Include an action marker in square brackets, e.g., [ACTION:CONFIRM_BOOKING])

`;
    }

    /**
     * Set custom options for Ollama API.
     * @param model - Model name.
     * @param options - API options.
     */
    setOptions(model: string, options: OllamaOptions): void {
        this.model = model;
        this.options = options;
    }

    /**
     * Calls the Ollama API to process the emergency prompt.
     * @param prompt - Structured chat prompt.
     * @returns - AI-generated response.
     */
    async callOllamaAPI(prompt: string, conversationHistory: any): Promise<string> {
        try {


            const response = await Ollama.generate({
                model: this.model,
                prompt: convertQuillToPlainText(prompt),
                options: {
                    num_predict: this.options.max_tokens,
                    temperature: this.options.temperature,
                    top_p: this.options.top_p,
                },
            });



            if (response && response.response) {
                return response?.response;
            } else {
                throw new Error('Invalid response from Ollama API.');
            }
            return response
        } catch (error) {
            console.error('Error calling Ollama API:', error);
            throw error;
        }
    }
}

export default HotlineService;
