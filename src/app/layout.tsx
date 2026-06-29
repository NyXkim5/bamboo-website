import type { Metadata } from "next";
import { Klee_One, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";

const kleeOne = Klee_One({
  weight: "600",
  subsets: ["latin"],
  variable: "--font-heading",
});

const zenMaru = Zen_Maru_Gothic({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bamboonutrition.app"),
  title: "Bamboo - Nutrition tracking that feels like a game",
  description:
    "Track macros, gut health, and your wellness journey with Bao the panda. Gamified nutrition that actually sticks. Join the waitlist.",
  openGraph: {
    title: "Bamboo - Nutrition tracking that feels like a game",
    description:
      "Track macros, gut health, and your wellness journey with Bao the panda. Join the waitlist.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bamboo - Nutrition tracking that feels like a game",
    description:
      "Track macros, gut health, and your wellness journey with Bao the panda.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${kleeOne.variable} ${zenMaru.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
