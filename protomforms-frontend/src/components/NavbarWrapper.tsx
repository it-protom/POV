'use client';

// next-auth removed - needs custom auth;
import Navbar from './Navbar';

export default function NavbarWrapper({ session }: { session: any }) {
  return (
    <SessionProvider session={session}>
      <Navbar />
    </SessionProvider>
  );
} 
