import { cleanJsonObject, cleanToJson, isParsableObject } from '@/lib/helpers';
import AiPreset from '@/models/AiPreset';
import Ollama from 'ollama';

interface Preset {
  name: string;
  description: string;
  value: string;
}

interface OllamaOptions {
  temperature: number;
  top_p: number;
  max_tokens: number;
}

/**
 * OllamaService class for structuring prompts and determining related presets.
 */
class OllamaService {
  private model: string;
  private options: OllamaOptions;

  constructor(model: string = 'preset_model') {
    this.model = model;
    this.options = {
      temperature: 0.1,
      top_p: 0.9,
      max_tokens: 1000,
    };
  }

  /**
   * Determine the most relevant preset for the user's prompt.
   * @param presets - Array of preset objects.
   * @param userPrompt - User input.
   * @returns - AI response with the matched preset.
   */
  async determineRelatedPreset(presets: Preset[], currentPreset: any, userPrompt: string, sampleConversations: any): Promise<Preset> {
    try {
      this.setOptions('preset_model', this.options)


      const presetConvo = sampleConversations.map(
        (convo: any) => {
          return `${convo.role}: ${isParsableObject(convo.content) ? JSON.parse(convo.content)?.message : convo.content}.\n`
        }
      ).join('\n');

      const structuredPrompt = this.createPrompt(presets, userPrompt, currentPreset, presetConvo);
      // console.log(presets, structuredPrompt, "PRESETS")



      const response = await this.callOllamaAPI(structuredPrompt, sampleConversations) as any;
      return JSON.parse(cleanToJson(response));
    } catch (error) {
      console.error('Error determining related preset:', error);
      throw new Error('Failed to process the user prompt.');
    }
  }

  /**
   * Create a structured prompt for the Ollama API.
   * @param presets - Array of preset objects.
   * @param userPrompt - User input.
   * @returns - Structured prompt as a string.
   */
  createPrompt(presets: Preset[], userPrompt: string, currentPreset: any, convo: any): string {
    const presetDescriptions = presets
      .map(
        (preset, index) =>
          `${index + 1}. Name: ${preset.name}\n   Description: ${preset.description}\n   Value: ${preset.value}`
      )
      .join('\n');



    return `
You are a highly intelligent AI assistant for matching prompts to presets. Your task is to analyze the user's input, evaluate the provided presets, and respond with the most relevant preset in the required JSON format.

### Input Details:
1. **User Prompt**: "${userPrompt}"
${currentPreset
        ? `2. **Current Preset**: ${JSON.stringify(currentPreset)}`
        : '2. **Current Preset**: None'
      }

### **Chat History**:
  ${convo}
      
### Instructions:
1. Analyze the user's prompt and always consider the chat history.
2. Determine the most relevant preset from the available presets based on the user's intent and input.
3. Check If Current Preset exists, and If the user's prompt is clearly linked or related to chat history or the **Current Preset**, return the **Current Preset**.
4. If the user's prompt doesn't linked to the **Chat History**, return the relevant Preset available or if not sure return "Help" preset.
5. Select Only 1 Preset Name, Description, Value from Available Presets.





### Presets Available:
${presetDescriptions}



### Response Rules:
- Your response **must be a valid JSON object only**.
- Do not include any additional text, commentary, or explanations outside of the JSON object.

### Expected JSON Response Format:
{
  "Name": "string",
  "Description": "string",
  "Value": "string"
}
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
   * Call the Ollama API for chat interaction.
   * @param prompt - Chat prompt.
   * @returns - Chat response content.
   */
  async callOllamaAPI(prompt: string, sampleConversations: any): Promise<string> {

    // let newMessages = sampleConversations.map

    // console.log(sampleConversations, presetConvo, 'PRESET CONVO')
    try {


      const response = await Ollama.chat({
        model: this.model,
        messages: [
          //  ...newMessages,
          // { role: 'system', content: `Chat Histrory: \n\n${presetConvo} ` },
          ...sampleConversations,
          { role: 'user', content: prompt }
        ],
        options: {
          num_predict: this.options.max_tokens,
          temperature: this.options.temperature,
          top_p: this.options.top_p,
        },
      });



      if (response && response.message) {
        return response?.message.content;
      } else {
        throw new Error('Invalid response from Ollama API.');
      }
    } catch (error) {
      console.error('Error calling Ollama API:', error);
      throw error;
    }
  }

}

export default OllamaService;
