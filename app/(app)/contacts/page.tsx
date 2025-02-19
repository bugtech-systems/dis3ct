
import { redirect } from "next/navigation";
import getAuth from "@/actions/getAuth";
import ContactsPage from "./components/contacts";
import getLeadersContacts from "@/actions/getContacts";

// async function authenticate() {
//   const session = await getServerSession(authOptions);


//   if (!session) return redirect('/login'); // Redirects the user to "/login" after logging out
// }

export default async function Page() {
  // await authenticate();
  // let authUser = await getAuth();
  let authUser = await getAuth();
  if (!authUser) {
    // signOut()
    return redirect('/login')
  }




  return (
    <>
      <ContactsPage
      // contacts={contacts}
      />
    </>
  );
}
