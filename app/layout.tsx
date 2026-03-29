import { AuthProvider } from "@/components/auth-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Explore VIT",
  description: "A prototype platform for exploring domains, mentors, and career-fit signals at VIT.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full text-foreground">
        <AuthProvider>
          <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-8 sm:px-6 lg:px-8">
            <SiteNav />
            <main className="flex-1 py-6">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
