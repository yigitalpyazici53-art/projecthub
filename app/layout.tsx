import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "ProjectHub | Find your co-founder at university",
  description:
    "Post your startup idea, meet talented students, and start building real projects together. Find your co-founder at university on ProjectHub.",
  openGraph: {
    title: "ProjectHub | Find your co-founder at university",
    description: "Post your startup idea and find your co-founder at university.",
    type: "website",
  },
};

const themeScript = `
  (function() {
    try {
      var t = localStorage.getItem('ph-theme');
      document.documentElement.setAttribute('data-theme', t || 'slate');
    } catch(e) {
      document.documentElement.setAttribute('data-theme', 'slate');
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-42Q18RT9S6" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-42Q18RT9S6');
        `}} />
      </head>
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }} suppressHydrationWarning>
        <AuthProvider>
          <ErrorBoundary>
            <Navbar />
            {children}
            <Footer />
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
