import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.moleculecapital.net"),
  title: {
    default: "Molecule Capital | Healthcare & Biotech Investment",
    template: "%s | Molecule Capital",
  },
  description:
    "Molecule Capital is a family office investing in transformative healthcare and biotech companies across private and public markets.",
  keywords: [
    "healthcare investing",
    "biotech venture capital",
    "family office",
    "life science investments",
    "molecule capital",
  ],
  authors: [{ name: "Molecule Capital" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.moleculecapital.net",
    siteName: "Molecule Capital",
    title: "Molecule Capital | Healthcare & Biotech Investment",
    description:
      "A family office dedicated to healthcare & biotech innovation across private and public markets.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Molecule Capital | Healthcare & Biotech Investment",
    description:
      "A family office dedicated to healthcare & biotech innovation.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Molecule Capital",
              url: "https://www.moleculecapital.net",
              description:
                "A family office investing in healthcare and biotech.",
              industry: "Investment Management",
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
