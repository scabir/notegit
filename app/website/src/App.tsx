import { Footer } from "./components/Footer";
import { NavBar } from "./components/NavBar";
import {
  aboutSection,
  branding,
  features,
  footerLinks,
  heroActions,
  heroDownloadTargets,
  heroPreview,
  latestRelease,
  navItems,
  officialDocumentationLinks,
  primaryNavAction,
  screenshots,
  sourceCodeLinks,
  tutorialLinks,
  workflowSteps
} from "./data/siteContent";
import { FeaturesSection } from "./sections/FeaturesSection";
import { HeroSection } from "./sections/HeroSection";
import { HowItWorksSection } from "./sections/HowItWorksSection";
import { AboutSection } from "./sections/AboutSection";
import { ScreenshotsSection } from "./sections/ScreenshotsSection";
import { TutorialsSection } from "./sections/TutorialsSection";

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
          preview={heroPreview}
          releasePageUrl={latestRelease.pageUrl}
          releaseApiUrl={latestRelease.apiUrl}
          downloadTargets={heroDownloadTargets}
        />
        <FeaturesSection items={features} />
        <HowItWorksSection
          steps={workflowSteps}
          documentationLinks={officialDocumentationLinks}
        />
        <TutorialsSection links={tutorialLinks} />
        <ScreenshotsSection items={screenshots} />
        <AboutSection
          title={aboutSection.title}
          summary={aboutSection.summary}
          details={aboutSection.details}
          links={sourceCodeLinks}
          madeInLabel={branding.madeInLabel}
          maintainerIntro={branding.maintainerIntro}
          maintainerName={branding.maintainerName}
          maintainerSocialLinks={branding.maintainerSocialLinks}
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
