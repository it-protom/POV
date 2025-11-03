'use client'

// next-auth removed - needs custom auth
import { useEffect } from 'react'

type Props = {
  children: React.ReactNode
  session: any
}

export default function SessionProvider({ children, session }: Props) {
  // Log della sessione solo in development per performance
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && session) {
      console.log("Session in client:", {
        email: session.user.email,
        role: session.user.role,
        id: session.user.id
      });
    }
  }, [session]);

  return (
    <Provider 
      session={session}
      // Ottimizzazioni per performance
      refetchInterval={5 * 60} // Refetch ogni 5 minuti invece che continuamente
      refetchOnWindowFocus={false} // Non refetch quando si torna alla finestra
    >
      {children}
    </Provider>
  )
} 
