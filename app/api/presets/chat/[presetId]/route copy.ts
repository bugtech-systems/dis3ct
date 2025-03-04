import { convertQuillToPlainText } from '@/lib/helpers';
import { getContactByNumber } from '@/services/contactServices';
import { createConversation, getAllConversations } from '@/services/conversationServices';
import { getPresetById, getPresetConvosById } from '@/services/presetServices';
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
    const { presetId } = params;

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

    if (senderContact.data) {
      contact = senderContact.data;
    }

    if (systemContact.data) {
      systemParent = systemContact.data;
    }

    if (systemConvo.data) {
      sampleConversations = systemConvo.data
    }



    let newConvos = await getAllConversations({ system, contact, preset: preset._id, status: "pending" });


    if (newConvos.data?.length) {
      // sampleConversations = preset.sampleConversation;
      messages = newConvos.data;
    }


    messages.forEach(message => sampleConversations.push({ role: message.role == 'assistant' ? "assistant" : "user", content: message.content }))



































    // Merge provided values with preset defaults



    // Create the prompt templates
    const finalTemperature = temperature ?? preset.aiTemperature;
    const finalTopP = topP ?? preset.aiTopP;
    const finalModelName = modelName ?? preset.modelName;
    const finalMaxTokens = maxTokens ?? preset.aiMaxLength;
    const systemBehavior = convertQuillToPlainText(preset.systemBehavior);

    if (contact) {
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
        ...(contact ? [{ role: 'user', content: `User object: ${JSON.stringify(userObject)}` }] : []),
        { role: 'user', content: message },
      ],
      options: {
        num_predict: finalMaxTokens, // Maximum number of tokens to generate
        temperature: finalTemperature, // Controls randomness: 0.0 (deterministic) to 1.0 (more random)
        top_p: finalTopP, // Controls diversity via nucleus sampling: 0.0 to 1.0
      }
    });
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

    await processApiResponse({ ...newResponse, sender: contact?.phone, system: systemParent?.phone })




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
