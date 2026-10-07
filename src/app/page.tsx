import { IntroChapter } from "@/components/chapters/IntroChapter";
import { FeaturesChapter } from "@/components/chapters/FeaturesChapter";
import { ProductChapter } from "@/components/chapters/ProductChapter";
import { ContactChapter } from "@/components/chapters/ContactChapter";

export default function Home() {
  return (
    <>
      <IntroChapter />
      <FeaturesChapter />
      <ProductChapter />
      <ContactChapter />
    </>
  );
}
