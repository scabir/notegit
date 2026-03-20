import { PageFrame } from "./components/PageFrame";
import {
  aboutSection,
  branding,
  downloadsPageTargets,
  features,
  heroActions,
  heroPreview,
  latestRelease,
  officialDocumentationLinks,
  openSourceAction,
  openSourceHighlights,
  releasesPageUrl,
  screenshots,
  sourceCodeLinks,
  tutorialLinks,
  whatItIs,
  workflowSteps
} from "./data/siteContent";
import { AboutSection } from "./sections/AboutSection";
import { DownloadsStackSection } from "./sections/DownloadsStackSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { HeroSection } from "./sections/HeroSection";
import { OpenSourceSection } from "./sections/OpenSourceSection";
import { ScreenshotsSection } from "./sections/ScreenshotsSection";
import { TutorialsSection } from "./sections/TutorialsSection";
import { WhatItIsSection } from "./sections/WhatItIsSection";
import { WorkflowSection } from "./sections/WorkflowSection";

function App() {
  return (
    <PageFrame>
      <HeroSection
        productName={branding.productName}
        tagline={branding.tagline}
        summary={branding.summary}
        actions={heroActions}
        preview={heroPreview}
      />
      <WhatItIsSection
        title={whatItIs.title}
        paragraphs={whatItIs.paragraphs}
        highlights={whatItIs.highlights}
      />
      <FeaturesSection items={features} />
      <DownloadsStackSection
        releasePageUrl={latestRelease.pageUrl}
        releaseApiUrl={latestRelease.apiUrl}
        releaseArchiveUrl={releasesPageUrl}
        downloadTargets={downloadsPageTargets}
        standalone={false}
      />
      <WorkflowSection
        steps={workflowSteps}
        documentationLinks={officialDocumentationLinks}
      />
      <TutorialsSection links={tutorialLinks} />
      <ScreenshotsSection items={screenshots} />
      <OpenSourceSection highlights={openSourceHighlights} action={openSourceAction} />
      <AboutSection
        title={aboutSection.title}
        summary={aboutSection.summary}
        details={aboutSection.details}
        links={sourceCodeLinks}
        madeInLabel={branding.madeInLabel}
        maintainerName={branding.maintainerName}
        maintainerSocialLinks={branding.maintainerSocialLinks}
      />
    </PageFrame>
  );
}

export default App;
