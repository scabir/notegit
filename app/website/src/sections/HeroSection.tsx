import { type CSSProperties } from "react";
import { type ActionLink, type HeroPreview } from "../data/siteContent";
import { linkTargetProps } from "../utils/links";

interface HeroSectionProps {
  productName: string;
  tagline: string;
  summary: string;
  actions: ActionLink[];
  preview: HeroPreview;
  messageTitle: string;
  messageLead: string;
  messageHighlights: string[];
  messageParagraphs: string[];
}

export function HeroSection({
  productName,
  tagline,
  summary,
  actions,
  preview,
  messageTitle,
  messageLead,
  messageHighlights,
  messageParagraphs
}: HeroSectionProps) {
  const messageLines = [...messageHighlights, ...messageParagraphs];

  return (
    <section id="top" className="section hero-section">
      <div className="container">
        <div className="hero-grid">
          <div className="reveal hero-copy">
            <p className="hero-kicker">{productName}</p>
            <h1>{tagline}</h1>
            <p className="hero-summary">{summary}</p>

            <div className="hero-actions">
              {actions.map((action, index) => (
                <a
                  key={action.href}
                  href={action.href}
                  className={index === 0 ? "button button-primary" : "button button-ghost"}
                  {...linkTargetProps(action.href)}
                >
                  {action.label}
                </a>
              ))}
            </div>

            <div className="hero-message reveal" style={{ "--delay": "0.04s" } as CSSProperties}>
              <h2 className="hero-message-title">{messageTitle}</h2>
              <p className="hero-message-lead">{messageLead}</p>
              <div className="hero-message-lines">
                {messageLines.map((line) => (
                  <p key={line} className="hero-message-line">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div
            className="reveal hero-preview"
            style={{ "--delay": "0.08s" } as CSSProperties}
          >
            <div className="preview-frame">
              <img src={preview.image} alt={preview.alt} loading="eager" />
              <p className="preview-caption">{preview.caption}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
