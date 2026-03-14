import type { ActionLink } from "../data/siteContent";
import { linkTargetProps } from "../utils/links";

interface FooterProps {
  productName: string;
  links: ActionLink[];
}

export function Footer({ productName, links }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-meta">
          <p>
            {productName} is open source under MIT. © {year}
          </p>
        </div>

        <nav className="footer-links" aria-label="Footer">
          {links.map((link) => (
            <a key={link.href} href={link.href} {...linkTargetProps(link.href)}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
