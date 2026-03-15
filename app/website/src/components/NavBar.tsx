import type { NavigationItem } from "../data/siteContent";
import brandIcon from "../assets/brand/NoteBranch.png";

interface NavBarProps {
  productName: string;
  navItems: NavigationItem[];
}

const normalizePath = (value: string): string => {
  const withoutIndex = value.replace(/\/index\.html$/, "/");
  const withLeading = withoutIndex.startsWith("/") ? withoutIndex : `/${withoutIndex}`;
  const collapsed = withLeading.replace(/\/{2,}/g, "/");

  if (collapsed === "/") {
    return "/";
  }

  return collapsed.endsWith("/") ? collapsed : `${collapsed}/`;
};

export function NavBar({ productName, navItems }: NavBarProps) {
  const activePath = normalizePath(
    typeof window === "undefined" ? "/" : window.location.pathname
  );

  return (
    <header className="site-nav">
      <div className="container nav-inner">
        <a className="brand-link" href="/">
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
          {navItems.map((item) => {
            const isActive =
              item.href.startsWith("/") &&
              normalizePath(item.href) === activePath;

            return (
              <a
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? "nav-link-active" : ""}`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
