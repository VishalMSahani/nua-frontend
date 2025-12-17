import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import Footer from "@/components/Footer";
import AppLayout from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "NUA File Management",
  description: "Secure file upload and sharing platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: 'rgb(239, 250, 248)' }}>
      <body style={{ backgroundColor: 'rgb(239, 250, 248)' }}>
        <AuthProvider>
          <Toaster position="top-right" />
          <AppLayout>{children}</AppLayout>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
