import authOptions from "@/lib/authOptions";
import NextAuth from "next-auth";

// const authOptions = {
//   providers: [
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {
//         phone: { label: "Phone", type: "text", placeholder: "09123456789" },
//         otp: { label: "OTP", type: "text", placeholder: "123456" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.phone || !credentials?.otp) return null;
//         const user = { id: "1", name: "User", phone: credentials.phone };
//         return user;
//       },
//     }),
//   ],
//   session: {
//     strategy: "jwt",
//   },
// };

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
