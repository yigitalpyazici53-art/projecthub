import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { SITE_NAME, SITE_URL } from "@/utils/seo";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ProjectHub | Where student builders prove what they've built",
    // Child routes set a bare title ("Projects"); never add the brand again there.
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "The proof-of-work portfolio platform for student builders. Ship projects, collect endorsements, and share a verified record of what you've built.",
  applicationName: SITE_NAME,
  openGraph: {
    title: "ProjectHub | Where student builders prove what they've built",
    description:
      "Ship projects, collect endorsements, and share your proof-of-work profile.",
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProjectHub | Where student builders prove what they've built",
    description:
      "Ship projects, collect endorsements, and share your proof-of-work profile.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
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
