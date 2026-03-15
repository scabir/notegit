import type { CSSProperties } from "react";
import { SectionHeading } from "../components/SectionHeading";
import ukIcon from "../assets/icons/uk.svg";
import type { LinkItem, SocialLink } from "../data/siteContent";
import { linkTargetProps } from "../utils/links";

interface AboutSectionProps {
  title: string;
  summary: string;
  details: string[];
  links: LinkItem[];
  madeInLabel: string;
  maintainerName: string;
  maintainerSocialLinks: SocialLink[];
}

export function AboutSection({
  title,
  summary,
  details,
  links,
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

        <article className="surface-card about-panel reveal">
          <ul>
            {details.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <div className="cards-grid compact-grid about-links-grid">
          {links.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              className="surface-card source-link-card reveal"
              style={{ "--delay": `${0.06 + index * 0.03}s` } as CSSProperties}
              {...linkTargetProps(link.href)}
            >
              <div className="about-link-head">
                <span className="about-link-icon-wrap" aria-hidden="true">
                  <span className="about-link-icon material-symbols-rounded">
                    {link.icon ?? "link"}
                  </span>
                </span>
                <h3>{link.label}</h3>
              </div>
              <p>{link.description}</p>
              <span className="inline-link">Open link</span>
            </a>
          ))}
        </div>

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
