import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { getServerSession } from "next-auth";

// Configurazione Azure AD - Credenziali hardcoded (App Registration "POV")
const AZURE_AD_CLIENT_ID = '0fc2c468-c587-4bae-a99c-e8512c720d94';
const AZURE_AD_CLIENT_SECRET = 'Bbx8Q~lVe0OnN6odfQEC7o7E4SzrRWjOjQMLpbEU';
const AZURE_AD_TENANT_ID = '94524ed0-9807-4351-bd2e-ba548fd5a31d';

// Configurazione NextAuth
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'development-secret-key-change-in-production';
// In produzione usa HTTPS e il dominio corretto
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://pov.protom.com' : 'http://localhost:3001');
const FRONTEND_URL = process.env.FRONTEND_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://pov.protom.com' : 'http://localhost:3000');

// Costruisci il redirect URI per Azure AD (deve corrispondere esattamente a quello configurato in Azure AD)
const AZURE_AD_REDIRECT_URI = `${NEXTAUTH_URL}/api/auth/callback/azure-ad`;

// Validazione in produzione
if (process.env.NODE_ENV === 'production') {
  if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is required");
}

// Log per debug (sempre attivo per troubleshooting)
console.log('🔐 Azure AD Configuration:', {
  clientId: `${AZURE_AD_CLIENT_ID.substring(0, 10)}...${AZURE_AD_CLIENT_ID.substring(AZURE_AD_CLIENT_ID.length - 4)}`,
  tenantId: AZURE_AD_TENANT_ID,
  redirectUri: AZURE_AD_REDIRECT_URI,
  nextAuthUrl: NEXTAUTH_URL,
  frontendUrl: FRONTEND_URL,
  status: '✅ Configured with hardcoded credentials',
  expectedRedirectUri: 'http://localhost:3001/api/auth/callback/azure-ad'
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  
  // Configurazione URL base - importante per determinare correttamente gli URL
  // NextAuth usa questa per costruire i redirect URI e i link CSRF
  // In produzione deve essere HTTPS
  url: NEXTAUTH_URL,
  
  // Permetti il collegamento automatico di account OAuth con stessa email
  // Questo risolve l'errore OAuthAccountNotLinked
  // Nota: allowDangerousEmailAccountLinking non è disponibile in NextAuth v4, gestito nel callback signIn
  
  providers: [
    // Azure AD Provider
    AzureADProvider({
      clientId: AZURE_AD_CLIENT_ID,
      clientSecret: AZURE_AD_CLIENT_SECRET,
      tenantId: AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email",
          response_type: "code",
          response_mode: "query",
          prompt: "select_account"
        }
      },
      // Usa sia state che PKCE per sicurezza
      // PKCE è richiesto da Azure AD per applicazioni pubbliche
      checks: ["pkce", "state"],
      profile(profile) {
        console.log("📋 Azure AD Profile received:", {
          sub: profile.sub,
          name: profile.name,
          email: profile.email,
          preferred_username: (profile as any).preferred_username,
        });
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email || (profile as any).preferred_username,
          image: profile.picture,
        }
      }
    }),
    
    // Credentials Provider per login email/password
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
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // Verifica se l'utente è nuovo controllando nel database
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! }
      });
      const isNewUser = !existingUser;
      
      console.log("🔵 signIn callback called:", {
        provider: account?.provider,
        isNewUser,
        userEmail: user.email,
        hasAccount: !!account,
        hasProfile: !!profile
      });
      
      if (account?.provider === "azure-ad") {
        try {
          console.log("Azure AD Sign In - Account:", {
            provider: account.provider,
            type: account.type,
            providerAccountId: account.providerAccountId
          });
          console.log("Azure AD Sign In - User:", {
            id: user.id,
            email: user.email,
            name: user.name
          });
          console.log("Azure AD Sign In - Profile:", {
            email: (profile as any)?.email,
            preferred_username: (profile as any)?.preferred_username,
            sub: (profile as any)?.sub
          });
          
          // Ensure email is available
          const userEmail = user.email || (profile as any)?.email || (profile as any)?.preferred_username;
          if (!userEmail) {
            console.error("No email found in Azure AD profile");
            return false;
          }

          const existingUser = await prisma.user.findUnique({
            where: { email: userEmail },
          });

          // Determina il ruolo - solo ludovica.luongo@protom.com e admin@protom.com sono admin
          // Tutti gli altri utenti (inclusi quelli che fanno autenticazione con tenant) sono USER
          const role = (
            userEmail === 'ludovica.luongo@protom.com' || 
            userEmail === 'admin@protom.com'
          ) 
            ? Role.ADMIN 
            : Role.USER;

          if (existingUser) {
            // Utente esiste già - collega manualmente l'account OAuth
            console.log("🔗 Linking OAuth account to existing user:", existingUser.email);
            
            // Verifica se l'account OAuth è già collegato
            const existingAccount = await prisma.account.findFirst({
              where: {
                userId: existingUser.id,
                provider: 'azure-ad',
                providerAccountId: account.providerAccountId
              }
            });

            if (!existingAccount) {
              // Crea il collegamento Account per l'utente esistente
              await prisma.account.create({
                data: {
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
                  session_state: (account as any).session_state,
                }
              });
              console.log("✅ OAuth account linked successfully");
            } else {
              // Aggiorna l'account esistente con nuovi token
              await prisma.account.update({
                where: { id: existingAccount.id },
                data: {
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: (account as any).session_state,
                }
              });
              console.log("✅ OAuth account updated with new tokens");
            }

            // Aggiorna ruolo e nome se necessario
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { 
                role,
                name: user.name || existingUser.name,
              },
            });
            
            // Imposta l'ID utente per NextAuth
            user.id = existingUser.id;
            console.log("✅ Existing user updated and account linked");
          } else {
            // Utente non esiste - crea manualmente perché PrismaAdapter fallisce senza emailVerified
            console.log("✅ New user - creating manually (PrismaAdapter doesn't support emailVerified in our schema)");
            
            // Crea l'utente manualmente (senza emailVerified che non esiste nello schema)
            const newUser = await prisma.user.create({
              data: {
                email: userEmail,
                name: user.name || null,
                role: role,
              }
            });
            
            // Crea l'account OAuth collegato
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
                session_state: (account as any).session_state,
              }
            });
            
            // Imposta l'ID utente per NextAuth
            user.id = newUser.id;
            console.log("✅ New user and OAuth account created successfully");
          }
          
          return true;
        } catch (error) {
          console.error("❌ Error during Azure AD sign in callback:", error);
          console.error("Error details:", {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userEmail: user.email,
            profileEmail: (profile as any)?.email,
            account: account ? { provider: account.provider, type: account.type } : null,
          });
          return false;
        }
      }
      return true;
    },
    
    async jwt({ token, user, account, trigger }) {
      console.log("🎫 JWT callback:", {
        trigger,
        hasUser: !!user,
        hasAccount: !!account,
        provider: account?.provider,
        userEmail: token.email,
        userId: user?.id || token.id
      });
      
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        console.log("✅ User data added to token:", { id: user.id, role: (user as any).role });
      }
      
      // Recupera il ruolo dal database se non presente
      if (account && !token.role && token.email) {
        try {
          console.log("🔍 Fetching user from DB:", token.email);
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            console.log("✅ User found in DB:", { id: dbUser.id, role: dbUser.role });
          } else {
            console.warn("⚠️ User not found in DB:", token.email);
          }
        } catch (error) {
          console.error("❌ Error fetching user in jwt callback:", error);
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as Role;
      }
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      // baseUrl è NEXTAUTH_URL (http://localhost:3001)
      // url può essere il callbackUrl passato o il default di NextAuth
      
      console.log('🔄 Redirect callback called:', {
        url,
        baseUrl,
        frontendUrl: FRONTEND_URL,
        urlIsBaseUrl: url === baseUrl,
        urlIsRoot: url === baseUrl + '/' || url === '/',
        urlType: typeof url,
        urlLength: url?.length
      });
      
      // SEMPRE reindirizza al frontend - anche se url contiene il callbackUrl corretto
      // ma potrebbe essere un URL del backend che vogliamo convertire
      
      // Se l'URL è la root del backend o il baseUrl stesso o vuoto, reindirizza sempre alla dashboard
      if (!url || url === '' || url === baseUrl || url === baseUrl + '/' || url === '/') {
        console.log('✅ URL is backend root or empty, redirecting to frontend dashboard');
        return `${FRONTEND_URL}/admin/dashboard`;
      }
      
      // Se l'URL è un URL completo del frontend, usa quello direttamente
      if (url.startsWith(FRONTEND_URL)) {
        console.log('✅ URL is already frontend URL, using it:', url);
        return url;
      }
      
      // Se l'URL inizia con baseUrl (backend), sostituisci con frontend
      // Esempio: http://localhost:3001/admin/dashboard -> http://localhost:3000/admin/dashboard
      if (url.startsWith(baseUrl)) {
        const path = url.replace(baseUrl, '');
        const redirectUrl = `${FRONTEND_URL}${path || '/admin/dashboard'}`;
        console.log('✅ Converting backend URL to frontend:', {
          original: url,
          path,
          redirectUrl
        });
        return redirectUrl;
      }
      
      // Se è un percorso relativo che inizia con /, aggiungi al frontend
      // Esempio: /admin/dashboard -> http://localhost:3000/admin/dashboard
      if (url.startsWith('/')) {
        // Rimuovi eventuali query params dal percorso se presenti
        const path = url.split('?')[0];
        const redirectUrl = `${FRONTEND_URL}${path}`;
        console.log('✅ Converting relative path to frontend URL:', {
          original: url,
          path,
          redirectUrl
        });
        return redirectUrl;
      }
      
      // Se l'URL è un URL completo che non inizia con baseUrl o FRONTEND_URL
      // potrebbe essere un URL esterno, ma per sicurezza reindirizziamo alla dashboard
      if (url.startsWith('http://') || url.startsWith('https://')) {
        console.log('⚠️ URL is external, redirecting to frontend dashboard for security:', url);
        return `${FRONTEND_URL}/admin/dashboard`;
      }
      
      // Fallback finale: reindirizza sempre alla dashboard del frontend
      console.log('✅ Default fallback: redirecting to frontend dashboard');
      return `${FRONTEND_URL}/admin/dashboard`;
    },
  },

  pages: {
    // NON configuriamo signIn qui - NextAuth deve reindirizzare direttamente ad Azure AD
    // Se configuriamo signIn, NextAuth reindirizza alla pagina invece che al provider
    error: `${FRONTEND_URL}/auth/error`,
  },
  
  // Callback per gestire gli errori e reindirizzare correttamente
  events: {
    async signIn({ user, account, profile }) {
      console.log("✅ Sign in successful:", {
        user: user.email,
        provider: account?.provider
      });
    },
    async signOut() {
      console.log("👋 User signed out");
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Don't set domain in production if using subdomain paths
        // Let NextAuth handle it automatically
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Host-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  secret: NEXTAUTH_SECRET,
  debug: true, // Sempre attivo per debug
  logger: {
    error(code, metadata) {
      console.error('🔴 NextAuth Error:', {
        code,
        metadata,
        timestamp: new Date().toISOString()
      });
    },
    warn(code) {
      console.warn('⚠️ NextAuth Warning:', code);
    },
    debug(code, metadata) {
      console.log('🐛 NextAuth Debug:', {
        code,
        metadata,
        timestamp: new Date().toISOString()
      });
    },
  },
};

export const getAuthSession = () => {
  return getServerSession(authOptions);
};
