import { PageFrame } from "../components/PageFrame";
import {
  downloadsPageTargets,
  latestRelease,
  releasesPageUrl
} from "../data/siteContent";
import { DownloadsStackSection } from "../sections/DownloadsStackSection";

export function DownloadsPage() {
  return (
    <PageFrame>
      <DownloadsStackSection
        releasePageUrl={latestRelease.pageUrl}
        releaseApiUrl={latestRelease.apiUrl}
        releaseArchiveUrl={releasesPageUrl}
        downloadTargets={downloadsPageTargets}
      />
    </PageFrame>
  );
}
