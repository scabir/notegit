import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { NavBar } from "./NavBar";
import { branding, footerLinks, navItems } from "../data/siteContent";

interface PageFrameProps {
  children: ReactNode;
}

export function PageFrame({ children }: PageFrameProps) {
  return (
    <div className="site-shell">
      <NavBar productName={branding.productName} navItems={navItems} />
      <main>{children}</main>
      <Footer productName={branding.productName} links={footerLinks} />
    </div>
  );
}
