import type { CSSProperties } from "react";
import { SectionHeading } from "../components/SectionHeading";
import type { WorkflowStep } from "../data/siteContent";

interface HowItWorksSectionProps {
  steps: WorkflowStep[];
}

export function HowItWorksSection({ steps }: HowItWorksSectionProps) {
  return (
    <section id="how-it-works" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="How it works"
          title="A provider-aware note flow in four steps"
          description="Use the same interface across Git, AWS S3, and local workflows."
        />

        <ol className="steps-grid">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="surface-card step-card reveal"
              style={{ "--delay": `${index * 0.04}s` } as CSSProperties}
            >
              <p className="step-index">{String(index + 1).padStart(2, "0")}</p>
              <h3>{step.title.replace(/^\d+\.\s*/, "")}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
