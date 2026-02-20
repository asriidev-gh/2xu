import type { Metadata } from "next";
import { Inter, Fira_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const firaSans = Fira_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira-sans"
});

export const metadata: Metadata = {
  title: "Runner - Running Club & Marathon Events",
  description: "Join our running club for marathon events and sports activities",
  icons: {
    icon: "/images/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* 
          ============================================
          DEVELOPED BY: Andy Radam
          Contact: 09664665514
          Email: asriidev@gmail.com
          ============================================
        */}
        {/* Sweet Sans Pro Font - Add your CDN link here */}
        {/* If using Adobe Fonts: */}
        {/* <link rel="stylesheet" href="https://use.typekit.net/YOUR_PROJECT_ID.css" /> */}
        {/* If using Google Fonts (if available): */}
        {/* <link href="https://fonts.googleapis.com/css2?family=Sweet+Sans+Pro:wght@400;500;600;700&display=swap" rel="stylesheet" /> */}
        {/* If self-hosting, the @font-face is already in globals.css */}
      </head>
      <body className={`${inter.className} ${firaSans.variable}`} suppressHydrationWarning>{children}</body>
    </html>
  );
}

