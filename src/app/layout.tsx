import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MoodReel - Vibe-Based Movie Recommendations',
  description: 'Find movies that match your vibe, not just your genre',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
