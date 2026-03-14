import type { CSSProperties } from "react";
import { SectionHeading } from "../components/SectionHeading";

interface WhatItIsSectionProps {
  title: string;
  paragraphs: string[];
  highlights: string[];
}

export function WhatItIsSection({
  title,
  paragraphs,
  highlights
}: WhatItIsSectionProps) {
  return (
    <section id="what-it-is" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="What it is"
          title={title}
          description="A desktop-first model designed around editable files, transparent storage, and repeatable note workflows."
        />

        <div className="what-grid">
          <article className="surface-card prose-card reveal">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>

          <aside className="surface-card highlights-card reveal" style={{ "--delay": "0.05s" } as CSSProperties}>
            <h3>At a glance</h3>
            <ul>
              {highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
