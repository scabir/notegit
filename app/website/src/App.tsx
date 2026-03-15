import { PageFrame } from "./components/PageFrame";
import {
  branding,
  heroActions,
  heroDownloadTargets,
  homeExploreLinks,
  heroPreview,
  latestRelease
} from "./data/siteContent";
import { HeroSection } from "./sections/HeroSection";
import { HomeExploreSection } from "./sections/HomeExploreSection";

function App() {
  return (
    <PageFrame>
      <HeroSection
        productName={branding.productName}
        tagline={branding.tagline}
        summary={branding.summary}
        actions={heroActions}
        preview={heroPreview}
        releasePageUrl={latestRelease.pageUrl}
        releaseApiUrl={latestRelease.apiUrl}
        downloadTargets={heroDownloadTargets}
      />
      <HomeExploreSection links={homeExploreLinks} />
    </PageFrame>
  );
}

export default App;
