export const isExternalHref = (href: string): boolean =>
  /^https?:\/\//.test(href);

export const linkTargetProps = (href: string): Record<string, string> =>
  isExternalHref(href)
    ? { target: "_blank", rel: "noreferrer" }
    : {};
