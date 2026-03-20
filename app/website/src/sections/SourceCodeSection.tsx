import type { CSSProperties } from "react";
import { SectionHeading } from "../components/SectionHeading";
import type { LinkItem } from "../data/siteContent";
import { linkTargetProps } from "../utils/links";

interface SourceCodeSectionProps {
  links: LinkItem[];
}

export function SourceCodeSection({ links }: SourceCodeSectionProps) {
  return (
    <section id="source-code" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Source code links"
          title="Project links for code, docs, and releases"
          description="Everything below points to maintained repository resources."
        />

        <div className="cards-grid compact-grid">
          {links.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              className="surface-card source-link-card reveal"
              style={{ "--delay": `${index * 0.03}s` } as CSSProperties}
              {...linkTargetProps(link.href)}
            >
              <h3>{link.label}</h3>
              <p>{link.description}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
