import { convertQuillToPlainText } from '@/lib/helpers';
import { getContactByNumber } from '@/services/contactServices';
import { createConversation, getAllConversations } from '@/services/conversationServices';
import { getPresetById, getPresetConvosById } from '@/services/presetServices';
import { NextRequest, NextResponse } from 'next/server';
import  Ollama  from 'ollama';


// export const POST = async (req: NextRequest,
//     { params }: { params: { presetId: string } }
// ) => {
//   try {
  
//     const {presetId} = params;
//     const { message, maxTokens, topP, temperature, modelName, sender } = await req.json();
//     let contact = null;
//     // Validate input
//     if (!message) {
//       return NextResponse.json(
//         { error: "Invalid input data. Ensure 'Message' are provided." },
//         { status: 400 }
//       );
//     }
    
    
    

//     // Fetch the preset by presetId
//     const presetResult = await getPresetById(presetId);
    
    
//     if (!presetResult.success || !presetResult.data) {
//       return NextResponse.json(
//         { error: "Preset not found. Please provide a valid presetId." },
//         { status: 404 }
//       );
//     }

//     const preset = presetResult.data;

//     // Merge provided values with preset defaults
//     const finalTemperature = temperature ?? preset.aiTemperature;
//     const finalTopP = topP ?? preset.aiTopP;
//     const finalModelName = modelName ?? preset.modelName;
//     const finalMaxTokens = maxTokens ?? preset.aiMaxLength;
//     const systemBehavior = preset.systemBehavior;
//     const sampleConversations = preset.sampleConversation as any;
   
   
   
//    //Find Contact if any
//   let senderContact = await getContactByNumber(sender);
   
//     if(senderContact.data){
//         contact = senderContact.data;
//     }
//     // Create the prompt templates
    


//     const response = await Ollama.chat({
//         model: modelName,
//         messages: [
//           { role: 'system', content: systemBehavior },
          
//           ...sampleConversations,
//           ...(contact ? [{ role: 'user', content: `User Data Object: ${contact}`}] : []),
//           { role: 'user', content: message },
//         ],
//         options: {
//             num_predict: maxTokens, // Maximum number of tokens to generate
//             temperature: temperature, // Controls randomness: 0.0 (deterministic) to 1.0 (more random)
//             top_p: topP, // Controls diversity via nucleus sampling: 0.0 to 1.0
//           }
//       });
      

//     return NextResponse.json(response, { status: 200 });
//   } catch (error) {
//     console.log('Error in chat API:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// };

export const POST = async (req: NextRequest,
  { params }: { params: { presetId: string } }
) => {
try {
  const {presetId} = params;

  const { message, maxTokens, topP, temperature, modelName, sender, system } = await req.json();
  let contact = null;
  let systemParent = null;
  let messages = [] as any[];
  let userObject = {}
  let sampleConversations = [];
  // Validate input
  if (!message) {
    return NextResponse.json(
      { error: "Invalid input data. Ensure 'Message' are provided." },
      { status: 400 }
    );
  }
  
  
    // Fetch the preset by presetId
    const presetResult = await getPresetById(presetId);
    
    
    if (!presetResult.success || !presetResult.data) {
      return NextResponse.json(
        { error: "Preset not found. Please provide a valid presetId." },
        { status: 404 }
      );
    }

    const preset = presetResult.data as any;
  
  
  
     //Find Contact if any
let senderContact = await getContactByNumber(sender);
let systemContact = await getContactByNumber(system);
let systemConvo = await getPresetConvosById(preset?._id); 
 
if(senderContact.data){
    contact = senderContact.data;
 }
 
 if(systemContact.data){
  systemParent = systemContact.data;
}

if(systemConvo.data){
  sampleConversations = systemConvo.data
}


  
let newConvos = await getAllConversations({ system, contact, preset: preset._id, status: "pending" });

   
if(newConvos.data?.length){
  // sampleConversations = preset.sampleConversation;
  messages = newConvos.data;
} 


messages.forEach(message => sampleConversations.push({role: message.role == 'assistant' ? "assistant" :  "user", content: message.content}))






  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  
  
  // Merge provided values with preset defaults

 

  // Create the prompt templates
  const finalTemperature = temperature ?? preset.aiTemperature;
  const finalTopP = topP ?? preset.aiTopP;
  const finalModelName = modelName ?? preset.modelName;
  const finalMaxTokens = maxTokens ?? preset.aiMaxLength;
  const systemBehavior = convertQuillToPlainText(preset.systemBehavior);
  
  if(contact){
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
        ...(contact ? [{ role: 'user', content: `User object: ${JSON.stringify(userObject)}`}] : []),
        { role: 'user', content: message },
      ],
      options: {
          num_predict: finalMaxTokens, // Maximum number of tokens to generate
          temperature: finalTemperature, // Controls randomness: 0.0 (deterministic) to 1.0 (more random)
          top_p: finalTopP, // Controls diversity via nucleus sampling: 0.0 to 1.0
        }
    }); 
    
 
    
  // if(response.done){
  //     await createConversation({
  //       ...(system ? { system: systemParent?.id} : {}),
  //       ...(contact ? { contact: contact?.id} : {}),
  //       preset: preset,
  //       content: message,
  //       role: 'user'
  //     })
  //     await createConversation({
  //       ...(system ? { system: systemParent?.id} : {}),
  //       ...(contact ? { contact: contact?.id} : {}),
  //       preset: preset,
  //       content: response.message.content,
  //       role: 'assistant'
  //     })
  // }
  
  let newResponse = {
    ...response, 
    preset: preset
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





export const GET = async (
  req: NextRequest,
  { params }: { params: { id: string } }

): Promise<NextResponse> => {
  try {
    let { id } = params;
  
    const result = await getPresetConvosById(id);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch presets" },
      { status: 500 }
    );
  }
};
