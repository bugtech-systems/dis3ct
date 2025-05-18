import { getLeaderDashboard } from '@/actions/getDashboard';
import { getElectionFilters } from '@/actions/getFilters';
import { cleanAndParseJSON, cleanJsonObject, extractJsonFromText, isParsableObject, sanitizePhoneNumber } from '@/lib/helpers';
import { getContactByNumber, getContactMobile, getUserByNumber, optInContact, optOutContact, setMobileIntent, updateContact } from '@/services/contactServices';
import { createInteraction } from '@/services/interactionServices';
import { getPresetByValue } from '@/services/presetServices';
import PromptService from '@/services/promptService';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

// let apiUrl = `http://192.168.1.150:3000/api/tasks`

let apiUrl = `http://localhost:3000/api/tasks`

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
    let { system, sender, preset, status, userInput, content } = response;
    let contact: any;
    sender = sender ? sender : system;
    let senderContact = await getContactByNumber(sanitizePhoneNumber(sender), sanitizePhoneNumber(system));

    if (senderContact.data) {
      contact = senderContact.data;
    }


    if (content && isParsableObject(cleanJsonObject(content))) {
      let contentData = cleanAndParseJSON(cleanJsonObject(content))

      await setMobileIntent(sender, system, contentData?.intent)

      if (contentData.actions?.includes("subscribed")) {
        //  await contactService.optIn(contact.phone)
        await optInContact(sender, system);
      } else if (contentData.actions?.includes("unsubscribe")) {
        // let res = await contactService.optOut(contact.phone)
        await optOutContact(sender, system);
      }


      status = contentData.actions?.includes("flash") ? 'flash' : status
      if (status && (status == 'flash' || status == 'Sms')) {

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
            system,
            isFlash: status == 'flash' ? true : false
          })
        }
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

      // Log interaction for tracking AI responses
      await createInteraction({
        contact: sanitizePhoneNumber(sender),
        system: sanitizePhoneNumber(system),
        ...(preset ? { preset: preset?._id } : {}),
        inputText: userInput,
        responseText: content,
        intent: contentData?.intent
      });


    } else {
      let { textWithoutJson, jsonObject } = extractJsonFromText(response.content);

      let content = cleanAndParseJSON(cleanJsonObject(response.content))

      // const fixed = `{${textWithoutJson}}`.replace(/(\w+):/g, '"$1":');


      // let contentData = JSON.parse(cleanJsonObject(textWithoutJson))

      await handleNewMessage({
        sender,
        message: `${content?.message}`,
        system,
        isFlash: true
      })
    }

  } catch (err) {
    console.log(err, "ERROR CONTENT DTA")
  }

}

export const POST = async (req: NextRequest, res: NextResponse) => {
  try {

    const { message, sender, system, preset, status, withSms } = await req.json();
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
      const defaultPreset = await getPresetByValue('alayon_election');
      presetData = defaultPreset.data
    };



    let mobile = await getContactMobile(sender ? sender : system, system)
    if (mobile?.data && !mobile?.data?.subscribedAt) {
      const defaultPreset = await getPresetByValue('opting');
      presetData = defaultPreset.data;
      response = await PromptService.generateOptResponse({ message, sender, system, status, mobile, preset: presetData })
    } else if (mobile && mobile?.data?.activeIntent == 'alayon_hotline') {
      response = await PromptService.generateResponse({ message, sender, system, preset: presetData, mobile, status })
    } else {

      let contact = await getUserByNumber(system)

      if (contact && contact.data) {
        let data = await getLeaderDashboard({ id: contact.data.accessCode })
        let filters = await getElectionFilters(contact.data.parent, contact.data._id);
        console.log(data, filters, 'DASH DTS')
        response = await PromptService.generateElectionResponse({ message, sender, system, preset: presetData, mobile, status, data: { ...data, ...filters } })

      } else {
        const helpPreset = await getPresetByValue('alayon_help');
        response = await PromptService.generateResponse({ message, sender, system, preset: helpPreset.data, mobile, status })

      }




      // response = await PromptService.generateResponse({ message, sender, system, preset: presetData, mobile, status })
    }


    console.log(response, 'RESP')

    await processApiResponse({ sender, system, content: response, status: withSms ? 'Sms' : status, preset: presetData, userInput: message })

    // let respData = JSON.parse(cleanJsonObject(response));
    // let smsTemp = getSMSTemplate(respData)
    // let resp = await createInteraction({ contact, system, preset: preset?._id, inputText: message, responseText: response })
    // console.log(r  esp, 'INTER RESP', response)

    // return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_BASE_URL), 302);
    // res.end();
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.log('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};



