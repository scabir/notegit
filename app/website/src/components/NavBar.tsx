import type { ActionLink, NavigationItem } from "../data/siteContent";
import brandIcon from "../assets/brand/NoteBranch.png";
import { linkTargetProps } from "../utils/links";

interface NavBarProps {
  productName: string;
  navItems: NavigationItem[];
  primaryAction: ActionLink;
}

export function NavBar({ productName, navItems, primaryAction }: NavBarProps) {
  return (
    <header className="site-nav">
      <div className="container nav-inner">
        <a className="brand-link" href="#top">
          <img
            className="brand-icon"
            src={brandIcon}
            alt=""
            aria-hidden="true"
            loading="eager"
          />
          <span>{productName}</span>
        </a>

        <nav className="nav-links" aria-label="Primary">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="nav-link">
              {item.label}
            </a>
          ))}
        </nav>

        <a
          className="nav-cta"
          href={primaryAction.href}
          {...linkTargetProps(primaryAction.href)}
        >
          {primaryAction.label}
        </a>
      </div>
    </header>
  );
}
