import { Opening } from "@/components/sections/Opening";
import { Experience } from "@/components/sections/Experience";
import { Education } from "@/components/sections/Education";
import { Work } from "@/components/sections/Work";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Opening />
      <Experience />
      <Education />
      <Work />
      <Contact />
    </>
  );
}
