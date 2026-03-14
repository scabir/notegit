import type { CSSProperties } from "react";
import { SectionHeading } from "../components/SectionHeading";
import type { ScreenshotItem } from "../data/siteContent";

interface ScreenshotsSectionProps {
  items: ScreenshotItem[];
}

export function ScreenshotsSection({ items }: ScreenshotsSectionProps) {
  return (
    <section id="screenshots" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Screenshots"
          title="Real interface snapshots from project tutorials"
          description="These screenshots come from the repository tutorial scenarios and can be replaced by editing one data file."
        />

        <div className="screenshot-grid">
          {items.map((item, index) => (
            <figure
              key={item.title}
              className="surface-card screenshot-card reveal"
              style={{ "--delay": `${index * 0.04}s` } as CSSProperties}
            >
              <img src={item.image} alt={item.alt} loading="lazy" />
              <figcaption>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
