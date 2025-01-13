import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { internationalizePhoneNumber } from "@/lib/helpers"
import moment from 'moment';


export function RecentSales({contacts = []} : { contacts: any}) {
  return (
    <div className="space-y-8">
    {contacts.map((contact: any, index: any) => {
      
      
      return (
        <div className="flex min-w-[300px]" key={index}>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">{internationalizePhoneNumber(contact.phone)}</p>
          <p className="text-sm text-muted-foreground">
           {contact.name ? contact.name : 'No Name'}
          </p>
        </div>
        <div className="ml-auto font-light text-sm">{moment(contact.createdAt).from(moment())}</div>
      </div>
      )
    })}

    </div>
  )
}
