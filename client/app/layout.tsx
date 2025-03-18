import "./globals.css"
import type { Metadata } from "next"
import { PrivyAuthProvider } from "./providers";
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PrivyAuthProvider>
            {children}
          </PrivyAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
