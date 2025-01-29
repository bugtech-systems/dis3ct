import { cleanJsonObject, convertQuillToPlainText, isParsableObject, sanitizePhoneNumber } from '@/lib/helpers';
import { getContactByNumber, getSystemByNumber, optInContact, optOutContact, setContactPreset, updateContactByNumber } from '@/services/contactServices';
import { createConversation, getAllConversations, getContactConversations, updateAllPendingConversationsToClose } from '@/services/conversationServices';
import OllamaService from '@/services/ollamaServices';
import { getAllPresets, getPresetById, getPresetByValue } from '@/services/presetServices';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import Ollama from 'ollama';


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
    let { system, sender } = response
    console.log(response.message.content && isParsableObject(cleanJsonObject(response.message.content)), response, 'PROCESS API')
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
          await updateContactByNumber(userData.phone, { name: userData.name, address: userData.address })
          // await updateAllPendingConversationsToClose(sender, system)
          // await axios.patch(`${process.env.ALAYON_NEXT_URL}/contacts/${sanitizePhoneNumber(sender)}`, {name: userData.name, address: userData.address})
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
        message: `Sorry, please try again later. ${response.message.content}`,
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
    let senderContact = await getContactByNumber(sanitizePhoneNumber(sender), sanitizePhoneNumber(system));
    let systemContact = await getSystemByNumber(sanitizePhoneNumber(system));






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


    const presetResult = await getPresetByValue(contact?.activePreset || null);


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



    // console.log(sampleConversations, messages, presetResult.data?.value, 'SAMPLE CONVOOOS')
    const ollamaService = new OllamaService();
    const aiResponse = presets.length ? await ollamaService.determineRelatedPreset(presets, contact?.activePreset, message, sampleConversations || []) as any : [];






    if (aiResponse) {
      console.log(sampleConversations, aiResponse, 'PRESETS')
      // Fetch the preset by presetId
      const aiPreset = presets.length == 1 ? presets[0] : presets.find(preset => preset.value == aiResponse.Value);
      if (aiPreset) {
        preset = aiPreset;
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
    }





    // Create the prompt templates
    const finalTemperature = temperature ?? preset?.aiTemperature;
    const finalTopP = topP ?? preset?.aiTopP;
    const finalModelName = modelName ?? preset?.modelName;
    const finalMaxTokens = maxTokens ?? preset?.aiMaxLength;
    const systemBehavior = preset?.systemBehavior ? convertQuillToPlainText(preset?.systemBehavior) : null;





    if (contact) {
      // if (preset?.value != 'alayon_opting') {
      setContactPreset(contact?.phone, preset?.value)
      // } else {
      // setContactPreset(contact?.phone, null)
      // }


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


    const response = await Ollama.chat({
      model: finalModelName,
      messages: [

        ...(systemBehavior ? [{ role: 'system', content: systemBehavior }] : []),
        // ...sampleConversations,
        ...recentConversations,
        // ...(preset?.value == 'alayon_water' ? sampleConversations : []),
        // (contact?.subscribed ? { role: 'assistant', content: `${preset?.value != 'alayon_opting' ? 'User not subscribe' : 'User should subscribe'}` } : {}),
        { role: 'user', content: (!contact?.subscribed && preset?.value == 'alayon_opting') ? `Instruction: Check **User Prompt** if the user is trying to subscribe or not. Response should be plain and valid JSON format without other description.  Find in System Instruction, User not subscribe template if not. If Subscribing, return User Request to Subscribe or Opt In template.\nUser Prompt: "${message}"` : message },
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

    await processApiResponse({ ...newResponse, sender: contact?.phone, system: systemParent?.phone })

    if (response.done) {

      await createConversation({
        ...(system ? { system: systemParent?.id } : {}),
        ...(contact ? { contact: contact?.id } : {}),
        preset: preset?._id,
        content: message,
        role: 'user'
      })

      await createConversation({
        ...(system ? { system: systemParent?.id } : {}),
        ...(contact ? { contact: contact?.id } : {}),
        preset: preset?._id,
        content: response.message.content,
        role: 'assistant'
      })
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



