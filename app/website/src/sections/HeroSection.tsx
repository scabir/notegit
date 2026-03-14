import { useEffect, useState, type CSSProperties } from "react";
import type {
  ActionLink,
  DownloadTarget,
  HeroMetric,
  HeroPreview
} from "../data/siteContent";
import { linkTargetProps } from "../utils/links";

interface HeroSectionProps {
  productName: string;
  tagline: string;
  summary: string;
  actions: ActionLink[];
  metrics: HeroMetric[];
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
  description: string;
  icon: string;
  iconAlt: string;
  href: string;
  isFallback: boolean;
}

const resolveDownloadLinks = (
  targets: DownloadTarget[],
  assets: ReleaseAsset[],
  releasePageUrl: string
): ResolvedDownload[] =>
  targets.map((target) => {
    const match = assets.find((asset) =>
      target.assetNamePatterns.some((pattern) => new RegExp(pattern, "i").test(asset.name))
    );

    if (match) {
      return {
        label: target.label,
        description: target.description,
        icon: target.icon,
        iconAlt: target.iconAlt,
        href: match.browser_download_url,
        isFallback: false
      };
    }

    return {
      label: target.label,
      description: target.description,
      icon: target.icon,
      iconAlt: target.iconAlt,
      href: releasePageUrl,
      isFallback: true
    };
  });

export function HeroSection({
  productName,
  tagline,
  summary,
  actions,
  metrics,
  preview,
  releasePageUrl,
  releaseApiUrl,
  downloadTargets
}: HeroSectionProps) {
  const [downloads, setDownloads] = useState<ResolvedDownload[]>(
    resolveDownloadLinks(downloadTargets, [], releasePageUrl)
  );
  const [downloadNote, setDownloadNote] = useState(
    "Resolving latest release downloads..."
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
        const usedFallback = resolvedDownloads.some((item) => item.isFallback);

        if (!active) {
          return;
        }

        setDownloads(resolvedDownloads);
        setDownloadNote(
          usedFallback
            ? "Some assets were not found in the latest release. Fallback links open the latest release page."
            : "Direct links are mapped from the latest published GitHub release."
        );
      } catch {
        if (!active) {
          return;
        }

        setDownloads(resolveDownloadLinks(downloadTargets, [], releasePageUrl));
        setDownloadNote(
          "Could not load release assets right now. Links open the latest release page."
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
      <div className="container hero-grid">
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

          <div className="downloads-panel">
            <p className="downloads-title">Download latest</p>
            <div className="downloads-grid">
              {downloads.map((download) => (
                <a
                  key={download.label}
                  className="download-link"
                  href={download.href}
                  {...linkTargetProps(download.href)}
                >
                  <span className="download-header">
                    <img
                      className="download-icon"
                      src={download.icon}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                    />
                    <span className="download-label">{download.label}</span>
                  </span>
                  <span className="download-description">{download.description}</span>
                </a>
              ))}
            </div>
            <p className="downloads-note">{downloadNote}</p>
          </div>

          <div className="metrics-grid">
            {metrics.map((metric) => (
              <div key={metric.label} className="metric-chip">
                <p className="metric-value">{metric.value}</p>
                <p className="metric-label">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="reveal hero-preview" style={{ "--delay": "0.08s" } as CSSProperties}>
          <div className="preview-frame">
            <img src={preview.image} alt={preview.alt} loading="eager" />
            <p className="preview-caption">{preview.caption}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
