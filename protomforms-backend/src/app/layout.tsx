import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ProtomForms Backend API',
  description: 'Backend API for ProtomForms application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}


