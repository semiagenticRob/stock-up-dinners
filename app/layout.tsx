import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://stockupdinners.com"),
  title: {
    default: "Stock Up Dinners — Easy Meal Prep for Costco Members",
    template: "%s — Stock Up Dinners",
  },
  description:
    "A pantry-aware meal-planning app for Costco members. Tell it what you bought; it tells you what to cook tonight and what to put back on the list.",
  openGraph: {
    type: "website",
    siteName: "Stock Up Dinners",
    images: ["/og-default.png"],
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
