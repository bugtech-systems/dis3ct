import { formatVoterSms, sanitizePhoneNumber, updateOrPushObject } from "@/lib/helpers";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import { getServerSession } from "next-auth";
import Contact from '@/models/Contact';
import Mobile from "@/models/Mobile";
import axios from "axios";
import { barangays, regions, provinces, municipalities } from "@/lib/locationData";
import { logAction } from "@/services/auditLogsService";
import { authOptions } from "@/lib/authOptions";
import User from "@/models/User";

let apiUrl = process.env.TASK_URL || `http://localhost:3000/api/tasks`

export const POST = async (req: NextRequest) => {
  try {

    const session = await getServerSession(authOptions) as any;
    // console.log(session, 'SESS')
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }


    await connectToDatabase();

    const userId = session.user.id;

    let user = await User.findById(userId) as any;


    const data = await req.json();

    if (!data?.phone) return new NextResponse("Not Found", { status: 404 })

    let { phone, recordId, system, isFlash } = data;

    let newPhone = sanitizePhoneNumber(phone);

    if (!recordId) {
      return NextResponse.json({ message: 'Record not found!' }, { status: 404 });
    }




    let record = await Contact.findById(recordId) as any;

    if (record) {


      let mobile = await Mobile.findOne({ phone: newPhone, contact: record, user: userId }) as any;

      if (!mobile) {
        mobile = await Mobile.create({
          phone,
          contact: record,
          user: userId
        })




      }

      let newTags = updateOrPushObject(record?.tags, { value: newPhone, tagType: 'phone', user: user?._id })

      record['phone'] = newPhone;
      await record.save()

      let barangay = barangays.find((brgy: any) => brgy.brgyCode == record.brgyCode)?.brgyDesc;
      let citymun = municipalities.find((citymun: any) => citymun.citymunCode == record.citymunCode)?.citymunDesc;
      let province = provinces.find((province: any) => province.provCode == record.provCode)?.provDesc;
      let region = regions.find((region: any) => region.regCode == record.regCode)?.regDesc;

      let resp = await axios.post(apiUrl, {
        status: 'Todo',
        priority: 'Medium',
        category: 'Sms',
        title: 'Send Message',
        taskObject: JSON.stringify({
          // ...preset,

          isFlash,
          phone: phone,
          system: system,
          message: formatVoterSms({
            name: record.name,
            address: record.address,
            precinct: record.precinct,
            school: record.school,
            barangay,
            municipality: citymun,
            province,
            region,
          })

        })
      }) as any;

      if (resp.success) {
        console.log('SUCCESS 200')
      }




    }


    logAction(userId, 'Send Invite', `Sending Invite to ${record.name} with Phone # ${phone} `)

    console.log(record, 'RECORD')
    return NextResponse.json({ message: 'Invite Sent!' }, { status: 201 });

  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}




