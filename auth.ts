import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Basic admin protection for prototype
        if (credentials?.password === "mutante2026") {
          return { id: "1", name: "Admin", email: "admin@mutante.local" };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: "/admin/login",
  },
});
