import commitAndPushScreenshot from "../assets/screenshots/commit-and-push.png";
import heroDarkWorkspace from "../assets/screenshots/hero-dark-workspace.png";
import organizeFavoritesScreenshot from "../assets/screenshots/organize-favorites.png";
import s3HistoryPanelScreenshot from "../assets/screenshots/s3-history-panel.png";
import splitViewScreenshot from "../assets/screenshots/split-view.png";
import linuxIcon from "../assets/icons/linux.svg";
import macosIcon from "../assets/icons/macos.svg";
import windowsIcon from "../assets/icons/windows.svg";

export interface NavigationItem {
  label: string;
  href: string;
}

export interface ActionLink {
  label: string;
  href: string;
}

export interface HeroMetric {
  label: string;
  value: string;
}

export interface HeroPreview {
  image: string;
  alt: string;
  caption: string;
}

export interface FeatureItem {
  title: string;
  description: string;
}

export interface ScreenshotItem {
  title: string;
  description: string;
  image: string;
  alt: string;
}

export interface WhyItem {
  title: string;
  description: string;
}

export interface WorkflowStep {
  title: string;
  description: string;
}

export interface LinkItem {
  label: string;
  href: string;
  description: string;
}

export interface AboutSectionContent {
  title: string;
  summary: string;
  details: string[];
}

export interface DownloadTarget {
  label: string;
  description: string;
  assetNamePatterns: string[];
  icon: string;
  iconAlt: string;
}

interface RepositoryConfig {
  owner: string;
  name: string;
  branch: string;
}

// Keep brand and repository metadata in one place for easy rebranding later.
const repository: RepositoryConfig = {
  owner: "scabir",
  name: "notebranch",
  branch: "main"
};

const githubBase = `https://github.com/${repository.owner}/${repository.name}`;
const githubBlobBase = `${githubBase}/blob/${repository.branch}`;
const githubLatestReleasePage = `${githubBase}/releases/latest`;
const githubLatestReleaseApi = `https://api.github.com/repos/${repository.owner}/${repository.name}/releases/latest`;

const toBlobLink = (path: string): string => `${githubBlobBase}/${path}`;

export const branding = {
  productName: "NoteBranch",
  tagline: "Markdown notes that stay in your Git, AWS S3, or local workspace.",
  summary:
    "A desktop workspace for writing, organizing, versioning, and exporting notes without locking your data into a proprietary cloud.",
  madeInLabel: "Made in UK"
};

export const navItems: NavigationItem[] = [
  { label: "Features", href: "#features" },
  { label: "Screenshots", href: "#screenshots" },
  { label: "Why", href: "#why" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Tutorials", href: "#tutorials" },
  { label: "Source Code", href: "#source-code" },
  { label: "About", href: "#about" }
];

export const primaryNavAction: ActionLink = {
  label: "View GitHub",
  href: githubBase
};

export const heroActions: ActionLink[] = [
  {
    label: "View Source",
    href: githubBase
  },
  {
    label: "Read User Guide",
    href: toBlobLink("docs/USER_GUIDE.md")
  }
];

export const latestRelease = {
  pageUrl: githubLatestReleasePage,
  apiUrl: githubLatestReleaseApi
};

export const heroDownloadTargets: DownloadTarget[] = [
  {
    label: "Windows",
    description: "x64 installer (.exe)",
    assetNamePatterns: ["NoteBranch-windows-x64-setup-.*\\.exe$"],
    icon: windowsIcon,
    iconAlt: "Windows"
  },
  {
    label: "macOS",
    description: "Apple Silicon (.dmg)",
    assetNamePatterns: [
      "NoteBranch-macos-arm64-.*\\.dmg$",
      "NoteBranch-macos-x64-.*\\.dmg$"
    ],
    icon: macosIcon,
    iconAlt: "macOS"
  },
  {
    label: "Linux",
    description: ".deb package",
    assetNamePatterns: [
      "NoteBranch-linux-amd64-.*\\.deb$",
      "NoteBranch-linux-x86_64-.*\\.rpm$"
    ],
    icon: linuxIcon,
    iconAlt: "Linux"
  }
];

export const heroMetrics: HeroMetric[] = [
  {
    label: "License",
    value: "MIT"
  },
  {
    label: "Storage",
    value: "Git, AWS S3, Local"
  },
  {
    label: "Platforms",
    value: "macOS, Windows, Linux"
  },
  {
    label: "Languages",
    value: "17 UI locales"
  }
];

export const heroPreview: HeroPreview = {
  image: heroDarkWorkspace,
  alt: "NoteBranch dark workspace preview",
  caption: "Dark mode workspace from the official tutorial set."
};

export const whatItIs = {
  title: "A practical Markdown workspace for real project notes",
  paragraphs: [
    "NoteBranch is a desktop note and knowledge app designed around files you control. You connect a provider, open a workspace, and work directly with Markdown files in a structured tree.",
    "The same app supports Git repositories, AWS S3 buckets, and local-only repositories, so workflows can stay consistent from personal notes to team documentation.",
    "It combines editing, preview, history, search, and export tools in one interface without hiding data behind a closed format."
  ],
  highlights: [
    "Markdown editor with preview-only and split-view modes",
    "Repository-aware workflows for Git, AWS S3, and Local",
    "Open file model that stays compatible with your tooling"
  ]
};

export const features: FeatureItem[] = [
  {
    title: "Markdown editing built for long sessions",
    description:
      "Create and edit Markdown with dedicated preview and split-view modes for docs-first workflows."
  },
  {
    title: "Structured note organization",
    description:
      "Manage files and folders with create, rename, move, duplicate, import, and favorites support."
  },
  {
    title: "Provider choice without workflow changes",
    description:
      "Connect to Git repositories, AWS S3 buckets (with optional prefix), or local repositories."
  },
  {
    title: "Repository-wide find and replace",
    description:
      "Search inside the current file or across the repository with case-sensitive and regex options."
  },
  {
    title: "Version history and restore references",
    description:
      "Inspect file history for Git and AWS S3 versioned objects, then restore the content reference you need."
  },
  {
    title: "Export and portability",
    description:
      "Export the current note or the full repository as ZIP when sharing or backing up work."
  },
  {
    title: "Language and workflow settings",
    description:
      "Switch app language, tune autosave/sync intervals, and keep preferences across restarts."
  },
  {
    title: "Local credential protection",
    description:
      "Sensitive credentials are stored locally with encryption in the desktop app environment."
  }
];

export const screenshots: ScreenshotItem[] = [
  {
    title: "Markdown split view",
    description: "Write and preview side by side while editing.",
    image: splitViewScreenshot,
    alt: "Markdown split view in NoteBranch"
  },
  {
    title: "File organization and favorites",
    description: "Organize notes quickly and pin frequently used files.",
    image: organizeFavoritesScreenshot,
    alt: "Organize files and add favorites in NoteBranch"
  },
  {
    title: "Git sync actions",
    description: "Commit and push changes directly from the status bar workflow.",
    image: commitAndPushScreenshot,
    alt: "Commit and push from NoteBranch status bar"
  },
  {
    title: "AWS S3 history panel",
    description: "Inspect versioned object history when bucket versioning is enabled.",
    image: s3HistoryPanelScreenshot,
    alt: "AWS S3 history panel in NoteBranch"
  }
];

export const whyItExists: WhyItem[] = [
  {
    title: "Ownership by default",
    description:
      "Notes stay in providers you choose, instead of being trapped in a proprietary hosted silo."
  },
  {
    title: "Less lock-in, more transparency",
    description:
      "The app, docs, and tutorials are versioned in public source, with a clear file-based data model."
  },
  {
    title: "Developer-friendly without being complex",
    description:
      "Git and AWS S3 flows are visible in the UI, while local mode keeps offline workflows simple."
  },
  {
    title: "Built for repeatable daily work",
    description:
      "Editing, history checks, sync operations, and exports are grouped into practical desktop actions."
  }
];

export const aboutSection: AboutSectionContent = {
  title: "About the project",
  summary:
    "NoteBranch is maintained as an open-source desktop tool focused on practical note workflows and transparent storage choices.",
  details: [
    "The product direction is documented in public guides, tutorial scenarios, and technical docs that ship with the repository.",
    "The goal is a dependable, file-first note workflow that works across Git, AWS S3, and local repositories."
  ]
};

export const workflowSteps: WorkflowStep[] = [
  {
    title: "1. Connect a provider",
    description:
      "Start with Git, AWS S3, or Local. Enter only the settings needed for that provider."
  },
  {
    title: "2. Write and organize notes",
    description:
      "Create Markdown files, structure folders, and use preview modes while saving changes."
  },
  {
    title: "3. Sync in provider-specific mode",
    description:
      "Git mode uses commit/pull/push actions, AWS S3 mode tracks pending-to-synced uploads, Local mode stays offline."
  },
  {
    title: "4. Review history and export",
    description:
      "Open the history panel for previous versions and export notes or full repository ZIPs when needed."
  }
];

export const tutorialLinks: LinkItem[] = [
  {
    label: "Connect Git Repository",
    description:
      "Step-by-step setup for connecting a remote Git repository and verifying workspace state.",
    href: toBlobLink("tutorials/scenarios/connect-git-repository/README.md")
  },
  {
    label: "Connect AWS S3 Bucket with Prefix",
    description:
      "Configure bucket, region, prefix, and credentials for an AWS S3-backed workspace.",
    href: toBlobLink("tutorials/scenarios/connect-s3-bucket-with-prefix/README.md")
  },
  {
    label: "Create Local Repository and Work Offline",
    description:
      "Run the same editor and file workflows with local-only storage and no remote sync.",
    href: toBlobLink(
      "tutorials/scenarios/create-local-repository-and-work-offline/README.md"
    )
  },
  {
    label: "Create and Edit Markdown (Preview + Split)",
    description:
      "Build notes with markdown preview controls and split layout for faster iteration.",
    href: toBlobLink(
      "tutorials/scenarios/create-and-edit-markdown-preview-split/README.md"
    )
  },
  {
    label: "Search and Replace (File + Repository)",
    description:
      "Find text in current file or across repository scope using search controls.",
    href: toBlobLink(
      "tutorials/scenarios/search-and-replace-file-and-repo/README.md"
    )
  },
  {
    label: "Commit, Pull, Push from Status Bar",
    description:
      "Use Git status actions in sequence for practical day-to-day repository sync.",
    href: toBlobLink(
      "tutorials/scenarios/commit-pull-push-from-status-bar/README.md"
    )
  },
  {
    label: "View History and Restore Reference",
    description:
      "Inspect past versions and restore the content reference you want to continue from.",
    href: toBlobLink(
      "tutorials/scenarios/view-history-and-restore-reference/README.md"
    )
  },
  {
    label: "Export Note and Repository ZIP",
    description:
      "Export the current note or full repository archive directly from settings.",
    href: toBlobLink(
      "tutorials/scenarios/export-note-and-export-repository-zip/README.md"
    )
  }
];

export const openSourceHighlights: string[] = [
  "Source code is publicly available on GitHub under the MIT license.",
  "Technical docs, user guide, and tutorial scenarios are versioned with the codebase.",
  "Community contributions are handled with issues and pull requests.",
  "Release artifacts are published for macOS, Windows, and Linux."
];

export const openSourceAction: ActionLink = {
  label: "Open Repository",
  href: githubBase
};

export const sourceCodeLinks: LinkItem[] = [
  {
    label: "GitHub Repository",
    description: "Browse source, issues, pull requests, and release notes.",
    href: githubBase
  },
  {
    label: "Releases",
    description: "Download desktop builds and track release history.",
    href: `${githubBase}/releases`
  },
  {
    label: "User Guide",
    description: "End-user setup steps, workflows, and troubleshooting.",
    href: toBlobLink("docs/USER_GUIDE.md")
  },
  {
    label: "Technical Documentation",
    description: "Architecture, security model, development, and test reference.",
    href: toBlobLink("docs/tech/README.md")
  },
  {
    label: "Tutorial Hub",
    description: "Playwright-generated tutorials with step-by-step screenshots.",
    href: toBlobLink("tutorials/README.md")
  },
  {
    label: "License",
    description: "MIT license terms for using and extending the project.",
    href: toBlobLink("LICENSE")
  }
];

export const footerLinks: ActionLink[] = [
  { label: "GitHub", href: githubBase },
  { label: "Tutorials", href: toBlobLink("tutorials/README.md") },
  { label: "Releases", href: `${githubBase}/releases` },
  { label: "License", href: toBlobLink("LICENSE") }
];
