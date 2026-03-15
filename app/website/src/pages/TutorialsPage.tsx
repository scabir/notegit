import { PageFrame } from "../components/PageFrame";
import { tutorialLinks } from "../data/siteContent";
import { TutorialsSection } from "../sections/TutorialsSection";

export function TutorialsPage() {
  return (
    <PageFrame>
      <TutorialsSection links={tutorialLinks} />
    </PageFrame>
  );
}
