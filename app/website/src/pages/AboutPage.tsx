import { PageFrame } from "../components/PageFrame";
import { aboutSection, branding, sourceCodeLinks } from "../data/siteContent";
import { AboutSection } from "../sections/AboutSection";

export function AboutPage() {
  return (
    <PageFrame>
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
