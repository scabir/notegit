import { useEffect, useState, type CSSProperties } from "react";
import {
  desktopReleaseVersion,
  type ActionLink,
  type DownloadBuild,
  type DownloadTarget,
  type HeroPreview
} from "../data/siteContent";
import { linkTargetProps } from "../utils/links";

interface HeroSectionProps {
  productName: string;
  tagline: string;
  summary: string;
  actions: ActionLink[];
  preview: HeroPreview;
  releasePageUrl: string;
  releaseApiUrl: string;
  downloadTargets: DownloadTarget[];
}

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface LatestReleaseResponse {
  html_url?: string;
  assets?: ReleaseAsset[];
}

interface ResolvedDownload {
  label: string;
  icon: string;
  iconAlt: string;
  iconType: "material" | "image";
  builds: ResolvedBuild[];
  note?: string;
}

interface ResolvedBuild {
  label: string;
  href: string;
  isFallback: boolean;
}

const resolveDownloadLinks = (
  targets: DownloadTarget[],
  assets: ReleaseAsset[],
  releasePageUrl: string
): ResolvedDownload[] =>
  targets.map((target) => {
    const resolvedBuilds = target.builds.map((build: DownloadBuild) => {
      const match = assets.find((asset) =>
        new RegExp(build.assetNamePattern, "i").test(asset.name)
      );

      if (match) {
        return {
          label: build.label,
          href: match.browser_download_url,
          isFallback: false
        };
      }

      return {
        label: build.label,
        href: releasePageUrl,
        isFallback: true
      };
    });

    return {
      label: target.label,
      icon: target.icon,
      iconAlt: target.iconAlt,
      iconType: target.iconType ?? "image",
      builds: resolvedBuilds,
      note: target.note
    };
  });

export function HeroSection({
  productName,
  tagline,
  summary,
  actions,
  preview,
  releasePageUrl,
  releaseApiUrl,
  downloadTargets
}: HeroSectionProps) {
  const [downloads, setDownloads] = useState<ResolvedDownload[]>(
    resolveDownloadLinks(downloadTargets, [], releasePageUrl)
  );
  const [downloadNote, setDownloadNote] = useState(
    `Resolving release v${desktopReleaseVersion} downloads...`
  );

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const loadLatestDownloads = async () => {
      try {
        const response = await fetch(releaseApiUrl, {
          signal: controller.signal,
          headers: {
            Accept: "application/vnd.github+json"
          }
        });

        if (!response.ok) {
          throw new Error(`GitHub API responded with ${response.status}`);
        }

        const payload: LatestReleaseResponse =
          (await response.json()) as LatestReleaseResponse;
        const assets = Array.isArray(payload.assets) ? payload.assets : [];
        const releasePage =
          typeof payload.html_url === "string" && payload.html_url.length > 0
            ? payload.html_url
            : releasePageUrl;
        const resolvedDownloads = resolveDownloadLinks(
          downloadTargets,
          assets,
          releasePage
        );
        const usedFallback = resolvedDownloads.some((item) =>
          item.builds.some((build) => build.isFallback)
        );

        if (!active) {
          return;
        }

        setDownloads(resolvedDownloads);
        setDownloadNote(
          usedFallback
            ? `Some assets were not found for release v${desktopReleaseVersion}. Fallback links open the latest release page.`
            : `Direct links are mapped from GitHub release v${desktopReleaseVersion}.`
        );
      } catch {
        if (!active) {
          return;
        }

        setDownloads(resolveDownloadLinks(downloadTargets, [], releasePageUrl));
        setDownloadNote(
          `Could not load release v${desktopReleaseVersion} assets right now. Links open the latest release page.`
        );
      }
    };

    loadLatestDownloads();

    return () => {
      active = false;
      controller.abort();
    };
  }, [downloadTargets, releaseApiUrl, releasePageUrl]);

  return (
    <section id="top" className="section hero-section">
      <div className="container">
        <div className="hero-grid">
          <div className="reveal hero-copy">
            <p className="hero-kicker">{productName}</p>
            <h1>{tagline}</h1>
            <p className="hero-summary">{summary}</p>

            <div className="hero-actions">
              {actions.map((action, index) => (
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
          </div>

          <div
            className="reveal hero-preview"
            style={{ "--delay": "0.08s" } as CSSProperties}
          >
            <div className="preview-frame">
              <img src={preview.image} alt={preview.alt} loading="eager" />
              <p className="preview-caption">{preview.caption}</p>
            </div>
          </div>
        </div>

        <div
          className="downloads-panel hero-downloads-panel reveal"
          style={{ "--delay": "0.12s" } as CSSProperties}
        >
          <p className="downloads-title">{`Download release v${desktopReleaseVersion}`}</p>
          <div className="downloads-grid">
            {downloads.map((download) => (
              <article key={download.label} className="download-card">
                <span className="download-header">
                  {download.iconType === "material" ? (
                    <span
                      className="download-icon-symbol material-symbols-rounded"
                      aria-hidden="true"
                    >
                      {download.icon}
                    </span>
                  ) : (
                    <img
                      className="download-icon"
                      src={download.icon}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                    />
                  )}
                  <span className="download-label">{download.label}</span>
                </span>

                <div className="download-build-links">
                  {download.builds.map((build) => (
                    <a
                      key={`${download.label}-${build.label}`}
                      className="download-build-link"
                      href={build.href}
                      {...linkTargetProps(build.href)}
                    >
                      {build.label}
                    </a>
                  ))}
                </div>
                {download.note ? (
                  <p className="download-platform-note">{download.note}</p>
                ) : null}
              </article>
            ))}
          </div>
          <p className="downloads-note">{downloadNote}</p>
        </div>
      </div>
    </section>
  );
}
