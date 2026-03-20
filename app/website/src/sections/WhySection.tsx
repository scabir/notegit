import type { CSSProperties } from "react";
import { SectionHeading } from "../components/SectionHeading";
import type { WhyItem } from "../data/siteContent";

interface WhySectionProps {
  items: WhyItem[];
}

export function WhySection({ items }: WhySectionProps) {
  return (
    <section id="why" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Why switch"
          title="Why people leave locked-in note apps"
          description="The mission is simple: keep your data portable, your workflow visible, and your future options open."
        />

        <div className="cards-grid compact-grid">
          {items.map((item, index) => (
            <article
              key={item.title}
              className="surface-card reason-card reveal"
              style={{ "--delay": `${index * 0.03}s` } as CSSProperties}
            >
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
