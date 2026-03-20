import type { CSSProperties } from "react";
import { SectionHeading } from "../components/SectionHeading";
import type { OfficialDocumentationLink, WorkflowStep } from "../data/siteContent";
import { linkTargetProps } from "../utils/links";

interface WorkflowSectionProps {
  steps: WorkflowStep[];
  documentationLinks: OfficialDocumentationLink[];
}

export function WorkflowSection({
  steps,
  documentationLinks
}: WorkflowSectionProps) {
  return (
    <section id="workflow" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Workflow"
          title="Four moves: connect, write, sync, recover"
          description="Run the same practical flow across Git, AWS S3, and Local workspaces."
        />

        <ol className="steps-grid">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="surface-card step-card reveal"
              style={{ "--delay": `${index * 0.04}s` } as CSSProperties}
            >
              <div className="step-card-head">
                <span className="step-icon-wrap" aria-hidden="true">
                  <span className="step-icon material-symbols-rounded">{step.icon}</span>
                </span>
                <h3>{step.title.replace(/^\d+\.\s*/, "")}</h3>
              </div>
              <p className="step-index">{String(index + 1).padStart(2, "0")}</p>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>

        <div className="section-subgroup">
          <h3 className="section-subtitle">Official provider documentation</h3>
          <div className="cards-grid how-doc-grid">
            {documentationLinks.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                className="surface-card how-doc-link reveal"
                style={{ "--delay": `${0.08 + index * 0.03}s` } as CSSProperties}
                {...linkTargetProps(link.href)}
              >
                <span className="how-doc-head">
                  <span className="how-doc-icon-wrap" aria-hidden="true">
                    <img
                      className="how-doc-icon"
                      src={link.icon}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                    />
                  </span>
                  <span>{link.label}</span>
                </span>
                <p>{link.description}</p>
                <span className="inline-link">Open documentation</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
