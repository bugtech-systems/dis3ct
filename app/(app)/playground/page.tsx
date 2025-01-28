import { redirect } from "next/navigation";
import getAuth from "@/actions/getAuth";
import PlaygroundPage from "./components/playground";

// async function authenticate() {
//   const session = await getServerSession(authOptions);


//   if (!session) return redirect('/login'); // Redirects the user to "/login" after logging out
// }

export default async function Page() {
  // await authenticate();
  // let authUser = await getAuth();
  // console.log(authUser, 'AUTH USER')
  let authUser = await getAuth();
  console.log(authUser, 'AUTH USER')

  if (!authUser) {
    // signOut()
    return redirect('/login')
  }




  return (
    <>
      <PlaygroundPage
      />
    </>

  );
}
