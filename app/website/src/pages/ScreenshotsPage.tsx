import { PageFrame } from "../components/PageFrame";
import { screenshots } from "../data/siteContent";
import { ScreenshotsSection } from "../sections/ScreenshotsSection";

export function ScreenshotsPage() {
  return (
    <PageFrame>
      <ScreenshotsSection items={screenshots} />
    </PageFrame>
  );
}
