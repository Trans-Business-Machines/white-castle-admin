import { type Metadata } from "next"
import {
  Geist_Mono,
  Inter,
  Manrope,
  IBM_Plex_Sans,
  Poppins,
} from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/providers/auth-provider"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { QueryProvider } from "@/providers/query-client"
import { AppToaster } from "@/components/app-toaster"

const manropeHeading = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
})

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const fontPoppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
})

const fontIBM = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex",
})

export const metadata: Metadata = {
  title: {
    default: "White Castle Motel Admin",
    template: "%s · White Castle Motel",
  },
  description: "Staff admin for White Castle Motel, Eldoret.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable,
        fontPoppins.variable,
        fontIBM.variable,
        manropeHeading.variable
      )}
    >
      <body>
        <ThemeProvider defaultTheme="light">
          <QueryProvider>
            <AuthProvider>
              <TooltipProvider>
                {children}
                <AppToaster />
              </TooltipProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
