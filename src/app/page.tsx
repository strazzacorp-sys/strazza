import { CallToAction } from "@/app/sections/CallToAction";
import { Footer } from "@/app/sections/Footer";
import { Header } from "@/app/sections/Header";
import { Hero } from "@/app/sections/Hero";
import { LogoTicker } from "@/app/sections/LogoTicker";
import { Pricing } from "@/app/sections/Pricing";
import { ProductShowcase } from "@/app/sections/ProductShowcase";
import { Testimonials } from "@/app/sections/Testimonials";


export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <LogoTicker />
      <ProductShowcase />
      <Pricing />
      <Testimonials />
      <CallToAction />
      <Footer />
    </>
  );
}