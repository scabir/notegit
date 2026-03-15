import { useEffect, useState, type CSSProperties } from "react";
import { SectionHeading } from "../components/SectionHeading";
import {
  desktopReleaseVersion,
  type DownloadBuild,
  type DownloadTarget
} from "../data/siteContent";
import { linkTargetProps } from "../utils/links";

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface LatestReleaseResponse {
  html_url?: string;
  assets?: ReleaseAsset[];
}

interface ResolvedBuild {
  label: string;
  href: string;
  isFallback: boolean;
  details?: string;
}

interface ResolvedDownload {
  label: string;
  icon: string;
  iconAlt: string;
  iconType: "material" | "image";
  builds: ResolvedBuild[];
  note?: string;
}

interface DownloadsStackSectionProps {
  releasePageUrl: string;
  releaseApiUrl: string;
  releaseArchiveUrl: string;
  downloadTargets: DownloadTarget[];
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
          isFallback: false,
          details: build.details
        };
      }

      return {
        label: build.label,
        href: releasePageUrl,
        isFallback: true,
        details: build.details
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

export function DownloadsStackSection({
  releasePageUrl,
  releaseApiUrl,
  releaseArchiveUrl,
  downloadTargets
}: DownloadsStackSectionProps) {
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
    <section className="section downloads-standalone-section">
      <div className="container">
        <SectionHeading
          eyebrow="Downloads"
          title="Choose your desktop build"
          description={`Installers for NoteBranch v${desktopReleaseVersion} are mapped from GitHub release assets for macOS, Linux, and Windows.`}
        />

        <div className="downloads-stack">
          {downloads.map((download, index) => (
            <article
              key={download.label}
              className="surface-card download-stack-card reveal"
              style={{ "--delay": `${index * 0.04}s` } as CSSProperties}
            >
              <div className="download-stack-head">
                {download.iconType === "material" ? (
                  <span
                    className="download-icon-symbol material-symbols-rounded"
                    aria-hidden="true"
                  >
                    {download.icon}
                  </span>
                ) : (
                  <img
                    className="download-stack-icon"
                    src={download.icon}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                )}
                <h3 className="download-stack-title">{download.label}</h3>
              </div>

              <div className="download-stack-items">
                {download.builds.map((build) => (
                  <div key={`${download.label}-${build.label}`} className="download-stack-item">
                    <a
                      className="download-stack-link"
                      href={build.href}
                      {...linkTargetProps(build.href)}
                    >
                      {build.label}
                    </a>
                    {build.details ? (
                      <p className="download-stack-details">{build.details}</p>
                    ) : null}
                  </div>
                ))}
              </div>

              {download.note ? (
                <p className="download-stack-note">{download.note}</p>
              ) : null}
            </article>
          ))}
        </div>

        <div className="downloads-archive reveal" style={{ "--delay": "0.14s" } as CSSProperties}>
          <a className="button button-ghost" href={releaseArchiveUrl} {...linkTargetProps(releaseArchiveUrl)}>
            Browse previous releases on GitHub
          </a>
          <p className="downloads-note">{downloadNote}</p>
        </div>
      </div>
    </section>
  );
}
