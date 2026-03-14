import { SectionHeading } from "../components/SectionHeading";
import ukIcon from "../assets/icons/uk.svg";

interface AboutSectionProps {
  title: string;
  summary: string;
  details: string[];
  madeInLabel: string;
}

export function AboutSection({
  title,
  summary,
  details,
  madeInLabel
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
          <p className="about-made-in">
            <img
              className="about-made-in-icon"
              src={ukIcon}
              alt=""
              aria-hidden="true"
              loading="lazy"
            />
            <span>{madeInLabel}</span>
          </p>
        </article>
      </div>
    </section>
  );
}
