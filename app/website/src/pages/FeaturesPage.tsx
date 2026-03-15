import { PageFrame } from "../components/PageFrame";
import { features } from "../data/siteContent";
import { FeaturesSection } from "../sections/FeaturesSection";

export function FeaturesPage() {
  return (
    <PageFrame>
      <FeaturesSection items={features} />
    </PageFrame>
  );
}
