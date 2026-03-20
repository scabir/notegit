import type { CSSProperties } from "react";

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
        <header className="section-heading">
          <h2 className="section-title">{title}</h2>
          <p className="section-description">
            Notes are assets. Assets should not be trapped.
          </p>
        </header>

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
