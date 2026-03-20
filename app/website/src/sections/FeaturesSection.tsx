import type { CSSProperties } from "react";
import { SectionHeading } from "../components/SectionHeading";
import type { FeatureItem } from "../data/siteContent";
import { linkTargetProps } from "../utils/links";

interface FeaturesSectionProps {
  items: FeatureItem[];
}

export function FeaturesSection({ items }: FeaturesSectionProps) {
  return (
    <section id="features" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Features"
          title="Everything critical. Nothing locked."
          description="Fast editing, transparent storage, visible sync, and recoverable history in one desktop workspace."
        />

        <div className="cards-grid features-grid">
          {items.map((item, index) => (
            <article
              key={item.title}
              className={`surface-card feature-card reveal${item.isWide ? " feature-card-wide" : ""}`}
              style={{ "--delay": `${index * 0.03}s` } as CSSProperties}
            >
              <div className="feature-card-head">
                <span className="feature-icon-wrap" aria-hidden="true">
                  <span className="feature-icon material-symbols-rounded">{item.icon}</span>
                </span>
                <h3>{item.title}</h3>
              </div>
              <p>{item.description}</p>

              {item.badges?.length ? (
                <div className="feature-badges">
                  {item.badges.map((badge) => (
                    <a
                      key={`${item.title}-${badge.imageUrl}`}
                      className="feature-badge-link"
                      href={badge.href}
                      {...linkTargetProps(badge.href)}
                    >
                      <img src={badge.imageUrl} alt={badge.alt} loading="lazy" />
                    </a>
                  ))}
                </div>
              ) : null}

              {item.platformIcons?.length ? (
                <div className="feature-platform-icons" aria-label="Supported platforms">
                  {item.platformIcons.map((platform) => (
                    <span
                      key={`${item.title}-${platform.iconAlt}`}
                      className="feature-platform-icon-wrap"
                      title={platform.iconAlt}
                    >
                      <img
                        className="feature-platform-icon"
                        src={platform.icon}
                        alt={platform.iconAlt}
                        loading="lazy"
                      />
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
