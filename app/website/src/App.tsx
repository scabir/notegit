import { PageFrame } from "./components/PageFrame";
import {
  aboutCommunityActions,
  aboutSection,
  aboutTrustSignals,
  branding,
  downloadsPageTargets,
  features,
  heroActions,
  heroPreview,
  latestRelease,
  officialDocumentationLinks,
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
import { ScreenshotsSection } from "./sections/ScreenshotsSection";
import { TutorialsSection } from "./sections/TutorialsSection";
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
        messageTitle={whatItIs.title}
        messageLead={whatItIs.lead}
        messageHighlights={whatItIs.highlights}
        messageParagraphs={whatItIs.paragraphs}
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
      <AboutSection
        title={aboutSection.title}
        summary={aboutSection.summary}
        mission={aboutSection.mission}
        proof={aboutSection.proof}
        trustSignals={aboutTrustSignals}
        links={sourceCodeLinks}
        communityActions={aboutCommunityActions}
        madeInLabel={branding.madeInLabel}
        maintainerName={branding.maintainerName}
        maintainerSocialLinks={branding.maintainerSocialLinks}
      />
    </PageFrame>
  );
}

export default App;
