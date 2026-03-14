import type { CSSProperties } from "react";
import { SectionHeading } from "../components/SectionHeading";
import type { FeatureItem } from "../data/siteContent";

interface FeaturesSectionProps {
  items: FeatureItem[];
}

export function FeaturesSection({ items }: FeaturesSectionProps) {
  return (
    <section id="features" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Features"
          title="Core workflows without hidden storage rules"
          description="Everything listed below maps directly to the current app documentation, tutorials, and test scenarios."
        />

        <div className="cards-grid">
          {items.map((item, index) => (
            <article
              key={item.title}
              className="surface-card feature-card reveal"
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
