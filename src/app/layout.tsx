import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Head from "next/head"; 
import Script from 'next/script';  // Import the Next.js Script component
import NavBar from '@/components/NavBar';
import '@/styles/nprogress.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <link href="https://cdn.jsdelivr.net/npm/flowbite@2.5.2/dist/flowbite.min.css" rel="stylesheet" />
      </Head>
      <body className={inter.className}>
        <div className="m-24 p-12 bg-gray-200 min-h-screen">
          {children}
        </div>
        <Script
          src="https://cdn.jsdelivr.net/npm/flowbite@2.5.2/dist/flowbite.min.js"
          strategy="afterInteractive"  // Ensures the script is loaded after page has loaded
        />
      </body>
    </html>
  );
}