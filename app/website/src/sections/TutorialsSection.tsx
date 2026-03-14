import type { CSSProperties } from "react";
import { SectionHeading } from "../components/SectionHeading";
import type { LinkItem } from "../data/siteContent";
import { linkTargetProps } from "../utils/links";

interface TutorialsSectionProps {
  links: LinkItem[];
}

export function TutorialsSection({ links }: TutorialsSectionProps) {
  return (
    <section id="tutorials" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Tutorials"
          title="Step-by-step guides from real app runs"
          description="Tutorial pages and images are generated from Playwright scenarios in this repository."
        />

        <div className="cards-grid compact-grid">
          {links.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              className="surface-card tutorial-card reveal"
              style={{ "--delay": `${index * 0.02}s` } as CSSProperties}
              {...linkTargetProps(link.href)}
            >
              <div className="tutorial-card-head">
                <span className="tutorial-icon-wrap" aria-hidden="true">
                  <span className="tutorial-icon material-symbols-rounded">
                    {link.icon ?? "menu_book"}
                  </span>
                </span>
                <h3>{link.label}</h3>
              </div>
              <p>{link.description}</p>
              <span className="inline-link">Open tutorial</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
