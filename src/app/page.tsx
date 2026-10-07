import { Hero } from "@/components/hero/Hero";
import { About } from "@/components/sections/About";
import { WhatIDo } from "@/components/sections/WhatIDo";
import { TechStack } from "@/components/sections/TechStack";
import { Timeline } from "@/components/sections/Timeline";
import { Quote } from "@/components/sections/Quote";
import { Projects } from "@/components/sections/Projects";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <WhatIDo />
      <TechStack />
      <Timeline />
      <Projects />
      <Quote />
      <Contact />
    </>
  );
}
