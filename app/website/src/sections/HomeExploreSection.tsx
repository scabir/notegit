import type { CSSProperties } from "react";
import { SectionHeading } from "../components/SectionHeading";
import type { LinkItem } from "../data/siteContent";
import { linkTargetProps } from "../utils/links";

interface HomeExploreSectionProps {
  links: LinkItem[];
}

export function HomeExploreSection({ links }: HomeExploreSectionProps) {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Explore"
          title="Jump to what you need"
          description="Use dedicated pages for downloads, workflows, tutorials, screenshots, and project information."
        />

        <div className="cards-grid compact-grid">
          {links.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              className="surface-card tutorial-card reveal"
              style={{ "--delay": `${index * 0.03}s` } as CSSProperties}
              {...linkTargetProps(link.href)}
            >
              <div className="tutorial-card-head">
                <span className="tutorial-icon-wrap" aria-hidden="true">
                  <span className="tutorial-icon material-symbols-rounded">
                    {link.icon ?? "arrow_outward"}
                  </span>
                </span>
                <h3>{link.label}</h3>
              </div>
              <p>{link.description}</p>
              <span className="inline-link">Open page</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
