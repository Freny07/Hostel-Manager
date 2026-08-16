import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hostel Manager - Next-Gen Campus Residence Platform",
  description: "Streamline campus accommodation, room allocations, gate passes, maintenance dispatch, and student security logs.",
  keywords: ["Hostel Manager", "Campus Accommodation", "Student Housing", "Gate Pass System", "Room Allocation"],
  authors: [{ name: "Hostel Manager Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark scroll-smooth`}>
      <body className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-violet-500/30 selection:text-violet-200">
        {children}
      </body>
    </html>
  );
}
