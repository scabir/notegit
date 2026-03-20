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
  const statements = [...highlights, ...paragraphs];

  return (
    <section id="what-it-is" className="section">
      <div className="container">
        <header className="section-heading">
          <h2 className="section-title">{title}</h2>
          <p className="section-description what-lead">
            Your knowledge should move with you, not stay trapped in one platform.
          </p>
        </header>

        <div className="what-statements">
          {statements.map((statement, index) => (
            <p
              key={statement}
              className="what-statement reveal"
              style={{ "--delay": `${index * 0.04}s` } as CSSProperties}
            >
              {statement}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
