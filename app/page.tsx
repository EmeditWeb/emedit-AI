import { auth } from "@clerk/nextjs/server";

import { CanvasShowcase } from "@/components/landing/canvas-showcase";
import { CtaBand } from "@/components/landing/cta-band";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { SpecShowcase } from "@/components/landing/spec-showcase";

export const metadata = {
  title: "Emedit AI | Collaborative system design at the speed of thought",
  description:
    "Describe your architecture in plain English, refine it together on a real-time canvas, and export a polished technical spec.",
};

export default async function Home() {
  const { userId } = await auth();
  const signedIn = Boolean(userId);

  return (
    <>
      <LandingNavbar signedIn={signedIn} />
      <main className="flex-1">
        <Hero signedIn={signedIn} />
        <HowItWorks />
        <Features />
        <CanvasShowcase />
        <SpecShowcase />
        <Faq />
        <CtaBand signedIn={signedIn} />
      </main>
      <LandingFooter />
    </>
  );
}
