import { PageFrame } from "../components/PageFrame";
import {
  aboutCommunityActions,
  aboutSection,
  aboutTrustSignals,
  branding,
  sourceCodeLinks
} from "../data/siteContent";
import { AboutSection } from "../sections/AboutSection";

export function AboutPage() {
  return (
    <PageFrame>
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
