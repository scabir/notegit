import type { ActionLink } from "../data/siteContent";
import { SectionHeading } from "../components/SectionHeading";
import { linkTargetProps } from "../utils/links";

interface OpenSourceSectionProps {
  highlights: string[];
  action: ActionLink;
}

export function OpenSourceSection({ highlights, action }: OpenSourceSectionProps) {
  return (
    <section id="open-source" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Open source"
          title="Open-source-first by design"
          description="Code, docs, tests, and tutorial assets are all part of the same repository history."
        />

        <div className="surface-card open-source-panel reveal">
          <ul>
            {highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>

          <a
            className="button button-primary"
            href={action.href}
            {...linkTargetProps(action.href)}
          >
            {action.label}
          </a>
        </div>
      </div>
    </section>
  );
}
