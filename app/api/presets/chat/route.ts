import { cleanJsonObject, convertQuillToPlainText, isParsableObject, sanitizePhoneNumber } from '@/lib/helpers';
import { getContactByNumber, getSystemByNumber, optInContact, optOutContact, setContactPreset, updateContact, updateContactByNumber } from '@/services/contactServices';
import { createConversation, getAllConversations, getContactConversations, updateAllPendingConversationsToClose } from '@/services/conversationServices';
import { createInteraction } from '@/services/interactionServices';
import OllamaService from '@/services/ollamaServices';
import { getAllPresets, getPresetById, getPresetByValue } from '@/services/presetServices';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import Ollama from 'ollama';

const handleCall = async ({ phone, system }: { phone?: string; system?: string; }) => {

  let apiUrl = `http://localhost:3000/api/tasks`


  let resp = await axios.post(apiUrl, {
    status: 'Todo',
    priority: 'Medium',
    category: 'Call',
    title: 'Call Contact',
    taskObject: JSON.stringify({
      // ...preset,
      phone,
      system: system,
    })
  }) as any;

  if (resp.success) {
    console.log('SUCCESS 200')
  }


}

const handleNewMessage = async ({ message, sender, system, isFlash = false }: { message?: string; sender?: string; isFlash?: boolean; system?: string; }) => {

  let apiUrl = `http://localhost:3000/api/tasks`


  let resp = await axios.post(apiUrl, {
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
  }) as any;

  if (resp.success) {
    console.log('SUCCESS 200')
  }


}

async function processApiResponse(response: any) {

  try {
    let { system, sender, phone } = response;
    let contact: any;
    if (response.message.content && isParsableObject(cleanJsonObject(response.message.content))) {
      let contentData = JSON.parse(cleanJsonObject(response.message.content))



      if (contentData.action?.includes("opt-in")) {
        //  await contactService.optIn(contact.phone)
        await optInContact(sender, system);

      }

      if (contentData.action?.includes("opt-out")) {
        // let res = await contactService.optOut(contact.phone)
        let { userData } = contentData;
        if (userData) {
          await optOutContact(sender, system);
        } else {
          await setContactPreset(sender, 'alayon_opting');
        }
      }




      if (contentData.action?.includes("CALL") && (sanitizePhoneNumber(sender) != sanitizePhoneNumber(system))) {
        console.log(contentData, 'CALL DATA', phone, sender)
        await handleCall({
          phone: contentData?.phone ? contentData?.phone : sender,
          system
        })
      }

      if (contentData.action?.includes("SMS") && (sanitizePhoneNumber(sender) != sanitizePhoneNumber(system))) {

        await handleNewMessage({
          sender,
          message: contentData.message,
          system
        })
      }

      if (contentData.action?.includes("API")) {
        let { userData } = contentData;
        if (userData.name || userData.phone || userData.address) {
          let senderContact = await getContactByNumber(sanitizePhoneNumber(sender), sanitizePhoneNumber(system));

          if (senderContact.data) {
            contact = senderContact.data;
          }

          await updateContact(contact?._id, { name: userData.name, address: userData.address })
          // await updateAllPendingConversationsToClose(sender, system)
          await axios.post(`https://sharewin.pro/apiv3/order/create`, { ...userData, system, phone: sender, address: userData?.address, order_quantity: userData?.quantity, name: userData?.name, price: userData?.price })
        }



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
        message: `${response.message.content}`,
        system,
        isFlash: true
      })
    }

  } catch (err) {
    console.log(err, "ERROR CONTENT DTA")
  }

}

export const POST = async (req: NextRequest,
  { params }: { params: { presetId: string } }
) => {
  try {

    const { message, maxTokens, sampleConversations = [], topP, temperature, modelName, sender, system, presetValue } = await req.json();
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

    let systemContact = await getSystemByNumber(sanitizePhoneNumber(system));
    let senderContact = await getContactByNumber(sanitizePhoneNumber(sender), sanitizePhoneNumber(system));





    if (senderContact.data) {
      contact = senderContact.data;
    }

    if (systemContact.data) {
      systemParent = systemContact.data;

      if (!systemParent?.presets || (systemParent?.presets && !systemParent?.presets.length)) {
        return NextResponse.json(
          { error: "No System Preset Available." },
          { status: 400 }
        );
      } else {
        presets = systemParent.presets
      }

    }


    const presetResult = await getPresetByValue(presetValue || contact?.activePreset || null);


    if (presetResult.success || presetResult.data) {

      let newConvos = await getAllConversations({ system: systemParent?._id, contact: contact?._id, preset: presetResult.data?._id, status: "pending" });

      if (newConvos.data) {
        messages = newConvos.data;
      }


    } else {

      let newConvos = await getAllConversations({ system: systemParent?._id, contact: contact?._id, status: "pending" });

      if (newConvos.data) {
        messages = newConvos.data;
      }
    }



    // Fetch the presets by presetId


    messages.forEach(message => sampleConversations.push({ role: message.role == 'assistant' ? "assistant" : "user", content: message.content, preset: message?.preset ? message?.preset.value : null }))


    if (senderContact.data) {
      sampleConversations.push({ role: "user", content: `User Object: \n-phone: ${contact?.phone}\n-Full Name: ${contact?.name}\n-Address: ${contact?.address}\n` })
    }


    console.log(sampleConversations, "CONVOO")
    const ollamaService = new OllamaService();
    const aiResponse = presets.length ? await ollamaService.determineRelatedPreset(presets, contact?.activePreset, message, sampleConversations || []) as any : [];


    console.log(presets, 'PRESETS')
    if (!contact?.subscribed) {
      preset = presets.filter(preset => { return String(preset?.value).toLowerCase().includes('opt') })[0];

    } else if (aiResponse) {
      // Fetch the preset by presetId



      const aiPreset = presets.length == 1 ? presets[0] : presets.find(preset => preset.value == aiResponse.Value);

      if (aiPreset) {
        preset = aiPreset;
      } else {
        let pres = presets.find(preset => preset.value == contact.activePreset)
        console.log(pres, 'No preset match')
        if (pres) {
          preset = pres;
        } else {

          return NextResponse.json(
            { error: "No Preset Match." },
            { status: 400 }
          );
        }

      }
    }




    if (!preset) {
      console.log('No preset match selected')
      if (presets.length) {
        preset = presets[0];
      } else {
        return NextResponse.json(
          { error: "No Preset Match." },
          { status: 400 }
        );
      }
    }

























    let recentConversations = [] as any;






    // Merge provided values with preset defaults
    let newConvos = await getAllConversations({ system: systemParent?._id, contact: contact?._id, preset: preset?._id, status: "pending" });
    if (newConvos.data) {
      recentConversations = newConvos.data.map(convo => ({ role: convo.role, content: convo.content }));
      // recentConversations.push({ role: "user", content: `User Object: \n-phone: ${contact?.phone}` })
    }





    // Create the prompt templates
    const finalTemperature = temperature ?? preset?.aiTemperature;
    const finalTopP = topP ?? preset?.aiTopP;
    const finalModelName = modelName ?? preset?.modelName;
    const finalMaxTokens = maxTokens ?? preset?.aiMaxLength;
    const systemBehavior = preset?.systemBehavior ? convertQuillToPlainText(preset?.systemBehavior) : null;





    if (contact) {
      if (preset?.value == 'alayon_water') {
        setContactPreset(contact?.phone, preset?.value)
      } else {
        setContactPreset(contact?.phone, 'alayon_help');
      }





      userObject = {
        name: contact.name,
        phone: contact.phone,
        subscribe: contact.subscribed,
        address: contact.address
      }
    }

    let options = {} as any;

    if (finalMaxTokens) {
      options.num_predict = finalMaxTokens;
    }
    if (finalTemperature) {
      options.temperature = finalTemperature;
    }
    if (finalTopP) {
      options.top_p = finalTopP;
    }

    console.log(preset, contact, recentConversations, 'API CALL', {
      model: finalModelName ?? "llama3.2",
      messages: [

        ...(systemBehavior ? [{ role: 'system', content: systemBehavior }] : []),
        // ...sampleConversations,
        ...recentConversations,
        // ...(preset?.value == 'alayon_water' ? sampleConversations : []),
        // (contact?.subscribed ? { role: 'assistant', content: `${preset?.value != 'alayon_opting' ? 'User not subscribe' : 'User should subscribe'}` } : {}),
        { role: 'user', content: (!contact?.subscribed && preset?.value == 'alayon_opting') ? `Instruction: Check **User Prompt** if the user is trying to subscribe or not. Response should be plain and valid JSON format without other description.  Find in System Instruction, User not subscribe template if not. If Subscribing, return User Request to Subscribe or Opt In template.\nUser Prompt: "${message}"` : message },
      ],
      options: options
    })
    const response = await Ollama.chat({
      model: finalModelName ?? "llama3.2",
      messages: [

        ...(systemBehavior ? [{ role: 'system', content: systemBehavior }] : []),
        // ...sampleConversations,
        ...recentConversations,
        // ...(preset?.value == 'alayon_water' ? sampleConversations : []),
        // (contact?.subscribed ? { role: 'assistant', content: `${preset?.value != 'alayon_opting' ? 'User not subscribe' : 'User should subscribe'}` } : {}),
        { role: 'user', content: (!contact?.subscribed && preset?.value == 'alayon_opting') ? `Instruction: Check **User Prompt** if the user is trying to subscribe or not. Response should be plain and valid JSON format without other description.  Find in System Instruction, User not subscribe template if not. If Subscribing, return User Request to Subscribe or Opt In template.\n**User Prompt**: "${message}"` : message },
      ],
      options: options
    });





    let newResponse = {
      ...response,
      preset: {
        name: preset?.name,
        description: preset?.description,
        value: preset?.value
      }
    }

    if (response.done) {

      await createConversation({
        ...(systemParent ? { system: systemParent?._id } : {}),
        ...(contact ? { contact: contact?.id } : {}),
        preset: preset?._id,
        content: message,
        role: 'user'
      })

      await createConversation({
        ...(systemParent ? { system: systemParent?._id } : {}),
        ...(contact ? { contact: contact?.id } : {}),
        preset: preset?._id,
        content: response.message.content,
        role: 'assistant'
      })


      let contentData = isParsableObject(cleanJsonObject(response.message.content)) ? JSON.parse(cleanJsonObject(response.message.content)) : response.message.content;


      await createInteraction({
        contact: contact?.phone,
        inputText: message,
        responseText: (contentData && contentData?.message) ? contentData?.message : contentData,
      })
    }

    console.log(newResponse, 'RESPONSE')
    await processApiResponse({ ...newResponse, sender: contact?.phone, system: systemParent?.phone })




    return NextResponse.json(newResponse, { status: 200 });
  } catch (error) {
    console.log('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};



