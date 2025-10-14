import type { Metadata } from "next";
import "./globals.css";
import "./primereact-theme.css";
import { AuthProvider } from "@/providers/auth-provider";
import { Toaster } from "react-hot-toast";
import { PrimeReactProvider } from 'primereact/api';
// import { AutoLogin } from "@/components/auto-login";

// Note: Euclid Circular A should be loaded via CSS or external source
// Fallback to system fonts as per brand guidelines

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://assetworks.netlify.app'),
  title: "AssetWorks - AI-Powered Financial Analysis",
  description: "Generate powerful financial widgets and analyze market trends with AI",
  keywords: "financial analysis, AI, stock market, trading, widgets, dashboard",
  authors: [{ name: "AssetWorks Team" }],
  openGraph: {
    title: "AssetWorks - AI-Powered Financial Analysis",
    description: "Generate powerful financial widgets and analyze market trends with AI",
    url: "https://assetworks.ai",
    siteName: "AssetWorks",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AssetWorks - AI-Powered Financial Analysis",
    description: "Generate powerful financial widgets and analyze market trends with AI",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
          integrity="sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <PrimeReactProvider>
          <AuthProvider>
            {/* <AutoLogin /> */}
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </PrimeReactProvider>
      </body>
    </html>
  );
}
