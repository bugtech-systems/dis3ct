import { cleanJsonObject, extractJsonFromText, isParsableObject, sanitizePhoneNumber } from '@/lib/helpers';
import { getContactByNumber, getContactMobile, optInContact, optOutContact, updateContact } from '@/services/contactServices';
import { getPresetByValue } from '@/services/presetServices';
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
    system: system,
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
    system: system,
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
    let { system, sender } = response;
    let contact: any;
    sender = sender ? sender : system;
    let senderContact = await getContactByNumber(sanitizePhoneNumber(sender), sanitizePhoneNumber(system));

    if (senderContact.data) {
      contact = senderContact.data;
    }
    if (response && isParsableObject(cleanJsonObject(response.content))) {
      let contentData = JSON.parse(cleanJsonObject(response.content))



      if (contentData.actions?.includes("subscribed")) {
        //  await contactService.optIn(contact.phone)
        let optRes = await optInContact(sender, system);
      } else if (contentData.actions?.includes("unsubscribe")) {
        // let res = await contactService.optOut(contact.phone)


        let optRes = await optOutContact(sender, system);
      }




      if (contentData.actions?.includes("CALL") && (sanitizePhoneNumber(sender) != sanitizePhoneNumber(system))) {
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

          if (sender) {
            await updateContact(contact?._id, { name: userData.name, address: userData.address })
          }
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
      let { textWithoutJson, jsonObject } = extractJsonFromText(response.content);

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

    const { message, sender, system, preset, status } = await req.json();
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






    //Find Contact if any
    const presetResult = await getPresetByValue(preset);

    if (presetResult.success) {
      presetData = presetResult.data
    } else {
      const defaultPreset = await getPresetByValue('alayon_help');
      presetData = defaultPreset.data
    };



    let mobile = await getContactMobile(sender ? sender : system, system)
    if (!mobile.success || !mobile?.data?.subscribedAt) {
      console.log('opt', mobile, contact)
      const defaultPreset = await getPresetByValue('opting');

      presetData = defaultPreset.data;
      response = await PromptService.generateOptResponse({ message, sender, system, status, mobile, preset: presetData })
    } else {
      console.log('Help resp', presetData)
      response = await PromptService.generateResponse({ message, sender, system, preset: presetData, mobile, status })
    }


    await processApiResponse({ sender, system, content: response })


    // let respData = JSON.parse(cleanJsonObject(response));
    // let smsTemp = getSMSTemplate(respData)
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



