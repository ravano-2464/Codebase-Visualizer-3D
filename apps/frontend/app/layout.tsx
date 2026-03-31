import type { Metadata } from "next";
import Script from "next/script";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "Codebase Visualizer 3D",
  description: "Upload repo dan lihat file menjadi gedung 3D berisi room-room fungsi.",
  icons: {
    icon: [
      {
        url: "/images/Icon.webp",
        type: "image/webp"
      }
    ],
    shortcut: ["/images/Icon.webp"],
    apple: [
      {
        url: "/images/Icon.webp",
        type: "image/webp"
      }
    ]
  }
};

const themeBootScript = `
  (function () {
    try {
      var storageKey = "cv3d-theme";
      var storedTheme = window.localStorage.getItem(storageKey);
      var preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      var resolvedTheme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : preferredTheme;
      document.documentElement.dataset.theme = resolvedTheme;
    } catch (error) {
      document.documentElement.dataset.theme = "dark";
    }
  })();
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${plexMono.variable}`}>
        <Script
          dangerouslySetInnerHTML={{ __html: themeBootScript }}
          id="theme-boot"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
