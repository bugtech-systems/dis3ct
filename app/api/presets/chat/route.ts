import { cleanJsonObject, convertQuillToPlainText, isParsableObject, sanitizePhoneNumber } from '@/lib/helpers';
import { getContactByNumber, optInContact, optOutContact, setContactPreset, updateContactByNumber } from '@/services/contactServices';
import { createConversation, getAllConversations, getContactConversations, updateAllPendingConversationsToClose } from '@/services/conversationServices';
import OllamaService from '@/services/ollamaServices';
import { getAllPresets, getPresetById, getPresetByValue } from '@/services/presetServices';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import Ollama from 'ollama';


const handleNewMessage = async ({message, sender, system, isFlash = false}: { message?: string; sender?: string; isFlash?: boolean; system?: string; }) => {

  let apiUrl =  `http://localhost:3000/api/tasks`


 let resp = await axios.post( apiUrl, {
      status: 'Todo',
      priority: 'Medium',
      category: 'Sms',
      title: 'Send Message',
      taskObject: JSON.stringify({
        // ...preset,
        isFlash, 
        phone: sender,  
        system: system,
        message: message
      
      })
  } ) as any;
  
  if(resp.success){
    console.log('SUCCESS 200')
  }
  
  console.log(resp.data, 'RESPONSE NEW MESSAGE')
  

}

async function processApiResponse(response: any){

  try {
    let { system, sender } = response
  
    if(response.message.content && isParsableObject(cleanJsonObject(response.message.content))){
      let contentData = JSON.parse(cleanJsonObject(response.message.content))
    console.log(contentData, 'CONTENT DATA')
      
      
      
    if(contentData.action?.includes("opt-in")){
          //  await contactService.optIn(contact.phone)
          await optInContact(sender);
                 console.log(contentData, 'OPT IN DATA')
                 console.log('OPT IN TASK')
  
     }
     
     if(contentData.action?.includes("opt-out")){
      // let res = await contactService.optOut(contact.phone)
      let { userData} = contentData;
      if(userData){
        await optOutContact(sender);
      } else {
        await setContactPreset(sender, 'alayon_opting');
      }
  
            console.log(contentData, 'OPT OUT DATA')
            console.log('OPT OUT TASK')
  
      }  
      
      
      if(contentData.action?.includes("SMS") && (sanitizePhoneNumber(sender) != sanitizePhoneNumber(system))){
      
      console.log('SMS TASK')
      await handleNewMessage({
        sender,
        message: contentData.message,
        system
      })
      }
    
    
    
    if(contentData.action?.includes("API")){
        let {userData} = contentData;
        if(userData.name || userData.phone || userData.address){
        await updateContactByNumber(userData.phone, {name: userData.name, address: userData.address})
        await updateAllPendingConversationsToClose(sender, system)
          // await axios.patch(`${process.env.ALAYON_NEXT_URL}/contacts/${sanitizePhoneNumber(sender)}`, {name: userData.name, address: userData.address})
        }
        
        console.log('API TASK')
  
        
        // await db.message.updateMany({
        //   where: {
        //   AND: [{
        //     completedDate: null
        //   }, { OR: [ {tag: aiResponse.Value }, {tag: null} ]}]
        //   },
        //   data: {
        //     completedDate: new Date(),   // Updated values
        //     tag: aiResponse.Value
        //   },
        // })
    }
  } else {
    await handleNewMessage({
      sender,
      message: `Sorry, please try again later. ${response.message.content}`,
      system,
      isFlash: true
    })
  }
  
  }  catch (err){
    console.log(err, "ERROR CONTENT DTA")
  }
  
  }

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
  


console.log(messages, sampleConversations, 'MESSAGES')
// console.log(sampleConversations, messages, presetResult.data?.value, 'SAMPLE CONVOOOS')
  const ollamaService = new OllamaService();
  const aiResponse = await ollamaService.determineRelatedPreset(presets, contact?.activePreset, message, sampleConversations || []) as any;

    
    
    
    
    
    if(aiResponse){
    
        // Fetch the preset by presetId
        const aiPreset = presets.find(preset => preset.value == (contact?.subscribed ? aiResponse.Value : 'alayon_opting'));
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
      if(preset?.value != 'alayon_opting'){
        setContactPreset(contact?.phone, preset?.value)
      } else {
        setContactPreset(contact?.phone, null)
      }
      

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
          ...(preset?.value != 'alayon_help' ? sampleConversations : []),
          // (contact?.subscribed ? { role: 'assistant', content: `${preset?.value != 'alayon_opting' ? 'User not subscriber' : 'User should subscribe'}` }  : {}),
          { role: 'user', content: message },
        ],
        options: {
            num_predict: finalMaxTokens, // Maximum number of tokens to generate
            temperature: finalTemperature, // Controls randomness: 0.0 (deterministic) to 1.0 (more random)
            top_p: finalTopP, // Controls diversity via nucleus sampling: 0.0 to 1.0
          }
      }); 
      
      
      let newResponse = {
        ...response, 
        preset: {
          name: preset.name,
          description: preset.description,
          value: preset.value
        }
        }
      
      
   console.log(sampleConversations, preset?.value, 'AI RESPONSE')
   if(response.done && preset?.value == 'alayon_water'){
       
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
      
      console.log(newResponse)
  await processApiResponse({...newResponse, sender: contact?.phone, system: systemParent?.phone })


      
    return NextResponse.json(newResponse, { status: 200 });
  } catch (error) {
    console.log('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};



