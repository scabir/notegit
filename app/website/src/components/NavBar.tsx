import { useEffect, useState, type MouseEvent } from "react";
import type { NavigationItem } from "../data/siteContent";
import brandIcon from "../assets/brand/NoteBranch.png";
import {
  INTERNAL_NAVIGATION_EVENT,
  canonicalizePath,
  normalizePath
} from "../utils/routing";

interface NavBarProps {
  productName: string;
  navItems: NavigationItem[];
}

interface ScrollSection {
  path: string;
  id: string;
}

const SCROLL_SECTIONS: ScrollSection[] = [
  { path: "/", id: "top" },
  { path: "/features/", id: "features" },
  { path: "/downloads/", id: "downloads" },
  { path: "/workflow/", id: "workflow" },
  { path: "/tutorials/", id: "tutorials" },
  { path: "/screenshots/", id: "screenshots" },
  { path: "/about/", id: "about" }
];

interface ResolvedScrollSection extends ScrollSection {
  top: number;
}

const resolveScrollSections = (): ResolvedScrollSection[] => {
  if (typeof document === "undefined") {
    return [];
  }

  return SCROLL_SECTIONS.map((section) => {
    const sectionElement = document.getElementById(section.id);
    if (!sectionElement) {
      return null;
    }

    return { ...section, top: sectionElement.offsetTop };
  }).filter((section): section is ResolvedScrollSection => section !== null);
};

const getStickyNavHeight = (): number => {
  if (typeof document === "undefined") {
    return 0;
  }

  return document.querySelector(".site-nav")?.getBoundingClientRect().height ?? 0;
};

const getActivePathForScroll = (): string => {
  if (typeof window === "undefined") {
    return "/";
  }

  const resolvedSections = resolveScrollSections();
  if (resolvedSections.length === 0) {
    return canonicalizePath(window.location.pathname);
  }

  const currentScrollLine = window.scrollY + getStickyNavHeight() + 12;
  const nearBottom =
    window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 2;

  let activePath = resolvedSections[0].path;

  for (const section of resolvedSections) {
    if (currentScrollLine >= section.top) {
      activePath = section.path;
      continue;
    }

    break;
  }

  if (nearBottom) {
    activePath = resolvedSections[resolvedSections.length - 1].path;
  }

  return canonicalizePath(activePath);
};

const shouldHandleClientNavigation = (
  event: MouseEvent<HTMLAnchorElement>
): boolean =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !event.metaKey &&
  !event.altKey &&
  !event.ctrlKey &&
  !event.shiftKey;

const handleInternalLinkClick = (
  event: MouseEvent<HTMLAnchorElement>,
  href: string
) => {
  if (!href.startsWith("/") || typeof window === "undefined") {
    return;
  }

  if (!shouldHandleClientNavigation(event)) {
    return;
  }

  event.preventDefault();

  if (normalizePath(window.location.pathname) === normalizePath(href)) {
    return;
  }

  window.history.pushState({}, "", href);
  window.dispatchEvent(new Event(INTERNAL_NAVIGATION_EVENT));
};

export function NavBar({ productName, navItems }: NavBarProps) {
  const [activePath, setActivePath] = useState<string>(() =>
    canonicalizePath(typeof window === "undefined" ? "/" : window.location.pathname)
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncFromLocation = () => {
      setActivePath(canonicalizePath(window.location.pathname));
      window.requestAnimationFrame(() => {
        setActivePath(getActivePathForScroll());
      });
    };

    const syncFromScroll = () => {
      setActivePath((currentPath) => {
        const nextPath = getActivePathForScroll();
        return currentPath === nextPath ? currentPath : nextPath;
      });
    };

    window.addEventListener("popstate", syncFromLocation);
    window.addEventListener(INTERNAL_NAVIGATION_EVENT, syncFromLocation);
    window.addEventListener("scroll", syncFromScroll, { passive: true });
    window.addEventListener("resize", syncFromScroll);

    syncFromScroll();

    return () => {
      window.removeEventListener("popstate", syncFromLocation);
      window.removeEventListener(INTERNAL_NAVIGATION_EVENT, syncFromLocation);
      window.removeEventListener("scroll", syncFromScroll);
      window.removeEventListener("resize", syncFromScroll);
    };
  }, []);

  return (
    <header className="site-nav">
      <div className="container nav-inner">
        <a
          className="brand-link"
          href="/"
          onClick={(event) => handleInternalLinkClick(event, "/")}
        >
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
              canonicalizePath(item.href) === activePath;

            return (
              <a
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? "nav-link-active" : ""}`}
                onClick={(event) => handleInternalLinkClick(event, item.href)}
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
