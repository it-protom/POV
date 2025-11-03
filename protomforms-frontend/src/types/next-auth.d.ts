// next-auth removed - needs custom auth;
// next-auth removed - needs custom auth;
import { Role } from '@prisma/client'

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
  }
} 
