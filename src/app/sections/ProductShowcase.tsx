"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import productImage from "@/assets/product-image.svg";
import SectionHeader from "@/app/components/SectionHeader";

import Image from "next/image";
import { useRef } from "react";
export const ProductShowcase = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const translateY = useTransform(scrollYProgress, [0, 1], [150, -150]);
  return (
    <section
      ref={sectionRef}
      className="bg-gradient-to-b overflow-x-clip from-[#ffffff] to-[#D2DCFF] py-24"
    >
      <div className="container  ">
        <SectionHeader
          tag="Boost your productivity"
          title="A more effective way to track progress"
          description="Effortlessly turn your ideas into a fully functional, responsive,
            no-code SaaS website in just minutes with the set of free components
            for Framer."
        />
      </div>
    </section>
  );
};