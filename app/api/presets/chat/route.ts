import { convertQuillToPlainText, convertRichTextToPlain, sanitizePhoneNumber } from '@/lib/helpers';
import { getContactByNumber, setContactPreset } from '@/services/contactServices';
import { createConversation, getAllConversations, getContactConversations } from '@/services/conversationServices';
import OllamaService from '@/services/ollamaServices';
import { getAllPresets, getPresetById, getPresetByValue } from '@/services/presetServices';
import { subscribe } from 'diagnostics_channel';
import { NextRequest, NextResponse } from 'next/server';
import Ollama from 'ollama';

export const POST = async (req: NextRequest,
    { params }: { params: { presetId: string } }
) => {
  try {
  
    const { message, maxTokens, sampleConversations = [], topP, temperature, modelName, sender, system } = await req.json();
    let contact = null;
    let systemParent = null;
    let presets = [] as any[];
    let messages = [] as any[];
    let preset = null;
    let userObject = {}
    
    
    // Validate input
    if (!message) {
      return NextResponse.json(
        { error: "Invalid input data. Ensure 'Message' are provided." },
        { status: 400 }
      );
    }
    
       //Find Contact if any
  let senderContact = await getContactByNumber(sanitizePhoneNumber(sender));
  let systemContact = await getContactByNumber(sanitizePhoneNumber(system));

   
   
  if(senderContact.data){
      contact = senderContact.data;
   }
   
   if(systemContact.data){
    systemParent = systemContact.data;
   }
   
    
   const presetResult = await getPresetByValue(contact?.activePreset || null);
    
    
   if (presetResult.success || presetResult.data) {
   
    let newConvos = await getAllConversations({ system: systemParent?._id, contact: contact?._id, preset: presetResult.data?._id, status: "pending" });
     
    if(newConvos.data){
      messages = newConvos.data;
      console.log('OLD CONVOS', messages)
    }   
  

   } else {
   
  let newConvos = await getAllConversations({ system: systemParent?._id, contact: contact?._id, status: "pending" });
     
  if(newConvos.data){
    messages = newConvos.data;
    console.log('NEW CONVOS', messages)
  }    
}
  
  

    // Fetch the presets by presetId
    const presetsResult = await getAllPresets();
    
    
    if (presetsResult.data) {
          presets = presetsResult.data
    }
    

  messages.forEach(message => sampleConversations.push({role: message.role == 'assistant' ? "assistant" :  "user", content: message.content, preset: message?.preset ? message?.preset.value : null} ))
  
  
  if(senderContact.data){
    sampleConversations.push({role: "user", content: `User Object: \n-phone: ${contact?.phone}\n-Full Name: ${contact?.name}\n-Address: ${contact?.address}\n-Subscribed: ${contact?.subscribed ? 'Yes (Already Subscribed)' : 'No (Not Yet Subscribed)'}`})
  }
  



console.log(sampleConversations, messages, presetResult.data?.value, 'SAMPLE CONVOOOS')
  const ollamaService = new OllamaService();
  const aiResponse = await ollamaService.determineRelatedPreset(presets, contact?.activePreset, message, sampleConversations || []) as any;

    
    
    
    
    
    if(aiResponse){
    
        // Fetch the preset by presetId
        const aiPreset = presets.find(preset => preset.value == aiResponse.Value);
        if(aiPreset){
          preset = aiPreset;
        }

    
    
    }
    

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

    
    
    // Merge provided values with preset defaults
  
   

    // Create the prompt templates
    const finalTemperature = temperature ?? preset.aiTemperature;
    const finalTopP = topP ?? preset.aiTopP;
    const finalModelName = modelName ?? preset.modelName;
    const finalMaxTokens = maxTokens ?? preset.aiMaxLength;
    const systemBehavior = convertQuillToPlainText(preset.systemBehavior);
    // const systemConversations = preset.sampleConversation;
    
    if(contact){
      setContactPreset(contact?.phone, preset?.value)

      userObject = {
        name: contact.name,
        phone: contact.phone,
        subscribe: contact.subscribed,
        address: contact.address
        
      }
    }
    
    
   const response = await Ollama.chat({
        model: finalModelName,
        messages: [
          { role: 'system', content: systemBehavior },
          ...sampleConversations,
          { role: 'user', content: message },
        ],
        options: {
            num_predict: finalMaxTokens, // Maximum number of tokens to generate
            temperature: finalTemperature, // Controls randomness: 0.0 (deterministic) to 1.0 (more random)
            top_p: finalTopP, // Controls diversity via nucleus sampling: 0.0 to 1.0
          }
      }); 
      
   
      
    if(response.done){
       
        await createConversation({
          ...(system ? { system: systemParent?.id} : {}),
          ...(contact ? { contact: contact?.id} : {}),
          preset: preset,
          content: message,
          role: 'user'
        })
        await createConversation({
          ...(system ? { system: systemParent?.id} : {}),
          ...(contact ? { contact: contact?.id} : {}),
          preset: preset,
          content: response.message.content,
          role: 'assistant'
        })
    }
    
    let newResponse = {
    ...response, 
    preset: {
      name: preset.name,
      description: preset.description,
      value: preset.value
    }
    }
      
    return NextResponse.json(newResponse, { status: 200 });
  } catch (error) {
    console.log('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};



