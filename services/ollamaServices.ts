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
      max_tokens: 4000,
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
    
      const structuredPrompt = this.createPrompt(presets, userPrompt, currentPreset);
    console.log(structuredPrompt, "PROMPT")
     let defaultConvo = [ 
     {
        role: "user",
        content: "ALAYON"
     }, {
        role: "assistant",
        content: JSON.stringify({
              Name: "Alayon Help",
              Description: "ALAYON Ai Help. Your Ai Assistant for everything you need.",
              Value: "alayon_help"
        })
     }, ...sampleConversations ];
    
    
      const response = await this.callOllamaAPI(structuredPrompt, sampleConversations);
console.log(response, 'CALL OLLAMA API')
      return JSON.parse(response);
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
  createPrompt(presets: Preset[], userPrompt: string, currentPreset: any): string {
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
${
  currentPreset
    ? `2. **Current Preset**: ${JSON.stringify(currentPreset)}`
    : '2. **Current Preset**: None'
}

### Presets Available:
${presetDescriptions}

### Instructions:
1. Analyze the user's prompt and if applicable, consider the chat history in the system instruction.
2. Determine the most relevant preset from the list above based on the user's intent and input.
3. If the user's prompt is clearly linked to the **Current Preset**, return the **Current Preset**.
4. If the user's intent cannot be matched to a specific preset, return this JSON object:
   {
     "Name": "Alayon Help",
     "Description": "ALAYON Help for general questions.",
     "Value": "alayon_help"
   }

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
  
    // let newMessages = sampleConversations.map((convo: any) => ({role: convo.role, content: convo.content}))
    const presetConvo = sampleConversations.map(
      (convo: any) => {
        return `${convo.role}: ${convo.content}.`
      }
    ).join('\n');
  
  console.log(sampleConversations, presetConvo, 'PRESET CONVO')
    try {
      const response = await Ollama.chat({
        model: this.model,
        messages: [
        //  ...newMessages,
         { role: 'system', content: `Chat Histrory: \n\n${presetConvo} ` },
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
