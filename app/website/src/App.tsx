import { Footer } from "./components/Footer";
import { NavBar } from "./components/NavBar";
import {
  aboutSection,
  branding,
  features,
  footerLinks,
  heroActions,
  heroDownloadTargets,
  heroMetrics,
  heroPreview,
  latestRelease,
  navItems,
  openSourceAction,
  openSourceHighlights,
  primaryNavAction,
  screenshots,
  sourceCodeLinks,
  tutorialLinks,
  whatItIs,
  whyItExists,
  workflowSteps
} from "./data/siteContent";
import { FeaturesSection } from "./sections/FeaturesSection";
import { HeroSection } from "./sections/HeroSection";
import { HowItWorksSection } from "./sections/HowItWorksSection";
import { AboutSection } from "./sections/AboutSection";
import { OpenSourceSection } from "./sections/OpenSourceSection";
import { ScreenshotsSection } from "./sections/ScreenshotsSection";
import { SourceCodeSection } from "./sections/SourceCodeSection";
import { TutorialsSection } from "./sections/TutorialsSection";
import { WhatItIsSection } from "./sections/WhatItIsSection";
import { WhySection } from "./sections/WhySection";

function App() {
  return (
    <div className="site-shell">
      <NavBar
        productName={branding.productName}
        navItems={navItems}
        primaryAction={primaryNavAction}
      />

      <main>
        <HeroSection
          productName={branding.productName}
          tagline={branding.tagline}
          summary={branding.summary}
          actions={heroActions}
          metrics={heroMetrics}
          preview={heroPreview}
          releasePageUrl={latestRelease.pageUrl}
          releaseApiUrl={latestRelease.apiUrl}
          downloadTargets={heroDownloadTargets}
        />
        <WhatItIsSection
          title={whatItIs.title}
          paragraphs={whatItIs.paragraphs}
          highlights={whatItIs.highlights}
        />
        <FeaturesSection items={features} />
        <ScreenshotsSection items={screenshots} />
        <WhySection items={whyItExists} />
        <HowItWorksSection steps={workflowSteps} />
        <TutorialsSection links={tutorialLinks} />
        <OpenSourceSection
          highlights={openSourceHighlights}
          action={openSourceAction}
        />
        <SourceCodeSection links={sourceCodeLinks} />
        <AboutSection
          title={aboutSection.title}
          summary={aboutSection.summary}
          details={aboutSection.details}
          madeInLabel={branding.madeInLabel}
        />
      </main>

      <Footer
        productName={branding.productName}
        links={footerLinks}
      />
    </div>
  );
}

export default App;
