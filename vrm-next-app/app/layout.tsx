import '../styles/globals-superhello.css'
import '../styles/layered-chat.css'
import '../styles/superhello.css'

export const metadata = {
  title: 'VRM Chat - Nutrition Bot',
  description: 'Debunking nutrition myths with science',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
