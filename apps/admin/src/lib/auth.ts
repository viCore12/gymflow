/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { type NextAuthConfig, type Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";

const MOCK_USERS = [
  { id: "1", email: "admin@gymflow.local", password: "admin123", role: "admin", name: "Admin" },
];

const config: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = MOCK_USERS.find(
          (u) =>
            u.email === credentials?.email &&
            u.password === credentials?.password
        );
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }: { token: JWT; user?: any }): JWT {
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }: { session: Session; token: JWT }): Session {
      if (session.user) (session.user as any).role = token.role;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const nextAuth = NextAuth(config);

// NextAuth v5 beta has TS2742 issues with re-exporting inferred types;
// using explicit any casts to unblock typecheck in isolated-modules mode.
export const handlers = nextAuth.handlers as any;
export const signIn = nextAuth.signIn as any;
export const signOut = nextAuth.signOut as any;
export const auth = nextAuth.auth as any;
