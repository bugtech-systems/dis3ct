import { cleanJsonObject, convertQuillToPlainText, extractJsonFromText, getSMSTemplate, isParsableObject, sanitizePhoneNumber } from '@/lib/helpers';
import AiPreset from '@/models/AiPreset';
import Contact from '@/models/Contact';
import Conversation from '@/models/Conversation';
import User from '@/models/User';
import { getContactByNumber, getContactMobile, getSystemByNumber, optInContact, optOutContact, setContactPreset, updateContact, updateContactByNumber } from '@/services/contactServices';
import { createInteraction } from '@/services/interactionServices';
import { getPresetById, getPresetByValue } from '@/services/presetServices';
import PromptService from '@/services/promptService';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

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
    let { textWithoutJson, jsonObject } = extractJsonFromText(response.content);
    console.log(jsonObject, 'EXTRACT')
    if (response && isParsableObject(cleanJsonObject(response.content))) {
      let contentData = JSON.parse(cleanJsonObject(response.content))



      if (contentData.actions?.includes("subscribed")) {
        //  await contactService.optIn(contact.phone)
        let optRes = await optInContact(sender, system);
        console.log(optRes, 'OPT RESP')
      }

      if (contentData.actions?.includes("unsubscribe")) {
        // let res = await contactService.optOut(contact.phone)


        let optRes = await optOutContact(sender, system);
        console.log(optRes, 'OPT RESP OUT')
        await setContactPreset(sender, 'opting');
      }




      if (contentData.actions?.includes("CALL") && (sanitizePhoneNumber(sender) != sanitizePhoneNumber(system))) {
        console.log(contentData, 'CALL DATA', phone, sender)
        await handleCall({
          phone: contentData?.phone ? contentData?.phone : sender,
          system
        })
      }

      if (contentData.actions?.includes("SMS") && (sanitizePhoneNumber(sender) != sanitizePhoneNumber(system))) {

        await handleNewMessage({
          sender,
          message: contentData.message,
          system
        })
      }

      if (contentData.actions?.includes("API")) {
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
      console.log('OTHER SMS')
      await handleNewMessage({
        sender,
        message: `${jsonObject.message}`,
        system,
        isFlash: true
      })
    }

  } catch (err) {
    console.log(err, "ERROR CONTENT DTA")
  }

}

export const POST = async (req: NextRequest) => {
  try {

    const { message, sender, system, preset } = await req.json();
    let contact;
    let presetData;
    let response;

    // Validate input
    if (!message) {
      return NextResponse.json(
        { error: "Invalid input data. Ensure 'Message' are provided." },
        { status: 400 }
      );
    }


    let contactResult = await getContactByNumber(sender, system);

    if (contactResult.success) {
      contact = contactResult.data
    };



    //Find Contact if any
    const presetResult = await getPresetByValue(preset);

    if (presetResult.success) {
      presetData = presetResult.data
    } else {
      const defaultPreset = await getPresetByValue('general_assistant');
      presetData = defaultPreset.data
    };



    let mobile = await getContactMobile(sender, system)
    if (!mobile || !mobile?.data?.subscribedAt || !contact) {
      console.log('opt', mobile)
      response = await PromptService.generateOptResponse(message, sender, system)
    } else {
      response = await PromptService.generateResponse({ userInput: message, contact: sender, system, preset: presetData })
    }









    // let respData = JSON.parse(cleanJsonObject(response));
    // let smsTemp = getSMSTemplate(respData)
    console.log(response, "SMS TEMP")
    await processApiResponse({ sender, system, content: response })
    // let resp = await createInteraction({ contact, system, preset: preset?._id, inputText: message, responseText: response })
    // console.log(r  esp, 'INTER RESP', response)


    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.log('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};



