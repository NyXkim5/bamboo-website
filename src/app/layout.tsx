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
  title: "Bamboo - Your gut, macros & mood. Tracked like a game you actually win.",
  description:
    "Bamboo is a gamified nutrition app with a panda mascot that tracks your calories, macros, gut health, and cycle. Join the waitlist.",
  openGraph: {
    title: "Bamboo - Nutrition tracking that feels like a game",
    description: "Track macros, gut health, and your cycle with Bao the panda. Join the waitlist.",
    type: "website",
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
      <body className="min-h-full flex flex-col bg-[#F3EBDA]">{children}</body>
    </html>
  );
}
