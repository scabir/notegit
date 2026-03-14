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
          eyebrow="Why this exists"
          title="Built to keep notes open, portable, and understandable"
          description="The project philosophy is practical: control your data, keep workflows visible, and avoid unnecessary lock-in."
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
