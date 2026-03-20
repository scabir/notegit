import type { CSSProperties } from "react";
import { SectionHeading } from "../components/SectionHeading";
import ukIcon from "../assets/icons/uk.svg";
import type {
  AboutTrustSignal,
  ActionLink,
  LinkItem,
  SocialLink
} from "../data/siteContent";
import { linkTargetProps } from "../utils/links";

interface AboutSectionProps {
  title: string;
  summary: string;
  mission: string;
  proof: string;
  trustSignals: AboutTrustSignal[];
  links: LinkItem[];
  communityActions: ActionLink[];
  madeInLabel: string;
  maintainerName: string;
  maintainerSocialLinks: SocialLink[];
}

export function AboutSection({
  title,
  summary,
  mission,
  proof,
  trustSignals,
  links,
  communityActions,
  madeInLabel,
  maintainerName,
  maintainerSocialLinks
}: AboutSectionProps) {
  return (
    <section id="about" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="About"
          title={title}
          description={summary}
        />

        <p className="about-mission reveal">{mission}</p>
        <p className="about-proof reveal">{proof}</p>

        <div className="about-trust-grid">
          {trustSignals.map((signal, index) => (
            <a
              key={signal.label}
              href={signal.href}
              className="about-trust-item reveal"
              style={{ "--delay": `${0.04 + index * 0.03}s` } as CSSProperties}
              {...linkTargetProps(signal.href)}
            >
              <span className="about-trust-label">{signal.label}</span>
              {signal.badgeImageUrl ? (
                <img
                  className="about-trust-badge"
                  src={signal.badgeImageUrl}
                  alt={signal.badgeAlt ?? `${signal.label} badge`}
                  loading="lazy"
                />
              ) : (
                <strong className="about-trust-value">{signal.value}</strong>
              )}
              <span className="about-trust-description">{signal.description}</span>
            </a>
          ))}
        </div>

        <div className="about-resources-grid">
          {links.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              className="about-resource reveal"
              style={{ "--delay": `${0.06 + index * 0.03}s` } as CSSProperties}
              {...linkTargetProps(link.href)}
            >
              <div className="about-resource-head">
                <span className="about-resource-icon material-symbols-rounded" aria-hidden="true">
                  {link.icon ?? "link"}
                </span>
                <h3>{link.label}</h3>
              </div>
              <p className="about-resource-description">{link.description}</p>
            </a>
          ))}
        </div>

        <div className="about-community-actions reveal">
          {communityActions.map((action, index) => (
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

        <p className="about-community-note reveal">
          Community feedback is public: bugs in issues, ideas in discussions.
        </p>

        <p className="about-credit reveal">
          built and maintained by <strong>{maintainerName}</strong>
        </p>

        <div className="about-social-links reveal">
          {maintainerSocialLinks.map((link) => (
            <a
              key={link.href}
              className="about-social-link"
              href={link.href}
              aria-label={`${link.label} profile`}
              {...linkTargetProps(link.href)}
            >
              <img
                className="about-social-icon"
                src={link.icon}
                alt=""
                aria-hidden="true"
                loading="lazy"
              />
              <span>{link.label}</span>
            </a>
          ))}
        </div>

        <p className="about-made-in reveal">
          <img
            className="about-made-in-icon"
            src={ukIcon}
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
          <span>{madeInLabel}</span>
        </p>
      </div>
    </section>
  );
}
