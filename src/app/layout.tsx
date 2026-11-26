import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import ServiceWorker from "@/components/ServiceWorker";
import { PreferencesProvider } from "@/lib/preferences";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "GetPointr | Point the way. Never take over.", template: "%s | GetPointr" },
  description:
    "Remote help without remote control. A trusted helper guides you with glowing visual cues while you keep 100% control of your phone.",
  applicationName: "GetPointr",
  appleWebApp: { capable: true, title: "GetPointr", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/pwa/192", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/pwa/180", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F7FB" },
    { media: "(prefers-color-scheme: dark)", color: "#070B14" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" data-text-scale="normal" className={`${jakarta.variable} ${jetbrains.variable} antialiased`} suppressHydrationWarning>
      <body>
        <PreferencesProvider>
          {children}
          <ServiceWorker />
        </PreferencesProvider>
      </body>
    </html>
  );
}
