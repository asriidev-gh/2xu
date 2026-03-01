import type { Metadata } from "next";
import { Inter, Fira_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const firaSans = Fira_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira-sans"
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  (typeof process.env.VERCEL_URL === 'string' ? `https://${process.env.VERCEL_URL}` : 'https://www.oneofakindasia.com');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Mission Strong : Speed Series powered by 2XU",
  description: "Mission Strong. 2XU Speed Run — Built for Speed, Strength & Impact. Ayala Triangle, Makati. May 17th 2026. Register now.",
  icons: {
    icon: "/images/favicon.ico",
  },
  openGraph: {
    title: "Mission Strong : Speed Series powered by 2XU",
    description: "Mission Strong. 2XU Speed Run — Built for Speed, Strength & Impact. Ayala Triangle, Makati. May 17th 2026. Register now.",
    images: ["/images/mission_strong.jpeg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mission Strong : Speed Series powered by 2XU",
    description: "Mission Strong. 2XU Speed Run — Built for Speed, Strength & Impact. Ayala Triangle, Makati. May 17th 2026. Register now.",
    images: ["/images/mission_strong.jpeg"],
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
      <body className={`${inter.className} ${firaSans.variable}`} suppressHydrationWarning>
        {/* Tribute visible in HTML source / DevTools */}
        <div
          dangerouslySetInnerHTML={{
            __html: '<!-- Web development by Andy Radam (asriidev@gmail.com) -->',
          }}
          aria-hidden
          style={{ display: 'none' }}
        />
        {children}
      </body>
    </html>
  );
}

