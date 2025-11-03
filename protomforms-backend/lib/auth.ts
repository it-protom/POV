/// <reference types="node" />
import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { User, Role } from '@prisma/client';
import { AdapterUser } from 'next-auth/adapters';
import GoogleProvider from "next-auth/providers/google";
import { getServerSession } from "next-auth";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AZURE_AD_CLIENT_ID?: string;
      AZURE_AD_CLIENT_SECRET?: string;
      AZURE_AD_TENANT_ID?: string;
      AZURE_AD_REDIRECT_URI?: string;
      NEXTAUTH_SECRET?: string;
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;
      FRONTEND_URL?: string;
    }
  }
}

type UserWithPassword = User & {
  password: string;
};

// Estendi il tipo Session per includere il ruolo
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: Role;
    }
  }
}

// Definizione del tipo User con la proprietà role
type UserWithRole = User & {
  role: string;
};

// Utente admin hardcoded
const hardcodedAdminUser = {
  id: 'admin-user-id',
  email: 'admin@protom.com',
  role: 'ADMIN',
  password: 'Password123!'
};

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXTAUTH_URL || 'http://localhost:3001';
};

// For development, use default values if environment variables are not set
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'development-secret-key';
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3001';
const AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID || 'development-client-id';
const AZURE_AD_CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET || 'development-client-secret';
const AZURE_AD_TENANT_ID = process.env.AZURE_AD_TENANT_ID || 'development-tenant-id';
const AZURE_AD_REDIRECT_URI = process.env.AZURE_AD_REDIRECT_URI || 'http://localhost:3001/api/auth/callback/azure-ad';

// Only throw errors in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.AZURE_AD_CLIENT_ID) throw new Error("AZURE_AD_CLIENT_ID is not set");
  if (!process.env.AZURE_AD_CLIENT_SECRET) throw new Error("AZURE_AD_CLIENT_SECRET is not set");
  if (!process.env.AZURE_AD_TENANT_ID) throw new Error("AZURE_AD_TENANT_ID is not set");
  if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is not set");
  if (!process.env.NEXTAUTH_URL) throw new Error("NEXTAUTH_URL is not set");
  if (!process.env.AZURE_AD_REDIRECT_URI) throw new Error("AZURE_AD_REDIRECT_URI is not set");
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    AzureADProvider({
      clientId: AZURE_AD_CLIENT_ID,
      clientSecret: AZURE_AD_CLIENT_SECRET,
      tenantId: AZURE_AD_TENANT_ID,
      authorization: { 
        params: { 
          scope: "openid profile email",
          redirect_uri: AZURE_AD_REDIRECT_URI
        } 
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "azure-ad") {
        try {
          // Cerca un utente esistente con la stessa email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          // Determina il ruolo in base all'email
          const role = (user.email === 'giuseppe.mursia@protom.com' || user.email === 'admin@protom.com') ? Role.ADMIN : Role.USER;

          if (existingUser) {
            // Se l'utente esiste, aggiorna il suo ruolo e l'account Azure AD
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { role },
            });

            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: "azure-ad",
                  providerAccountId: account.providerAccountId,
                },
              },
              create: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
              update: {
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            });

            // Aggiungi l'ID dell'utente all'oggetto user
            user.id = existingUser.id;
            return true;
          }

          // Se l'utente non esiste, crea un nuovo utente con il ruolo appropriato
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              role: role,
            },
          });

          // Collega l'account Azure AD al nuovo utente
          await prisma.account.create({
            data: {
              userId: newUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            },
          });

          // Aggiungi l'ID dell'utente all'oggetto user
          user.id = newUser.id;
          return true;
        } catch (error) {
          console.error("Error during Azure AD sign in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Assicurati che il ruolo venga salvato nel token
        return {
          ...token,
          id: user.id,
          role: (user as any).role,
        };
      }
      
      // Se non c'è un utente ma c'è un account, cerca l'utente nel database
      if (account) {
        try {
          const dbUser = await prisma.user.findFirst({
            where: {
              accounts: {
                some: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
            },
          });
          
          if (dbUser) {
            return {
              ...token,
              id: dbUser.id,
              role: dbUser.role,
            };
          }
        } catch (error) {
          console.error("Error fetching user in jwt callback:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // Assicurati che il ruolo venga incluso nella sessione
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as Role,
        },
      };
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export const getAuthSession = () => {
  return getServerSession(authOptions);
};


