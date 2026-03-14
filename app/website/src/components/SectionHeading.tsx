interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description
}: SectionHeadingProps) {
  return (
    <header className="section-heading">
      <p className="section-eyebrow">{eyebrow}</p>
      <span className="section-title-break" aria-hidden="true" />
      <h2 className="section-title">{title}</h2>
      {description ? <p className="section-description">{description}</p> : null}
    </header>
  );
}
