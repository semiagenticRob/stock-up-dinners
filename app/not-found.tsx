import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Section } from "@/components/marketing/Section";
import "./(marketing)/marketing.css";

export const metadata: Metadata = {
  title: "Not found",
  description: "That page doesn't exist.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Section>
          <p className="eyebrow">404</p>
          <h1>That page isn&apos;t on the menu.</h1>
          <p className="lede">The link you followed is broken or the page has moved.</p>
          <p style={{ marginTop: 32 }}>
            <Link href="/" className="btn">
              Back to the home page
            </Link>
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
