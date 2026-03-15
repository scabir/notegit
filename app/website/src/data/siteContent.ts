import commitAndPushScreenshot from "../assets/screenshots/commit-and-push.png";
import heroDarkWorkspace from "../assets/screenshots/hero-dark-workspace.png";
import organizeFavoritesScreenshot from "../assets/screenshots/organize-favorites.png";
import s3HistoryPanelScreenshot from "../assets/screenshots/s3-history-panel.png";
import splitViewScreenshot from "../assets/screenshots/split-view.png";
import linuxIcon from "../assets/icons/linux.svg";
import macosIcon from "../assets/icons/macos.svg";
import windowsIcon from "../assets/icons/windows.svg";
import githubIcon from "../assets/icons/github.svg";
import linkedinIcon from "../assets/icons/linkedin.svg";
import awsS3Icon from "../assets/icons/aws-s3.svg";

export interface NavigationItem {
  label: string;
  href: string;
}

export interface ActionLink {
  label: string;
  href: string;
}

export interface HeroPreview {
  image: string;
  alt: string;
  caption: string;
}

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
  badges?: FeatureBadge[];
  platformIcons?: FeaturePlatformIcon[];
  isWide?: boolean;
}

export interface FeatureBadge {
  alt: string;
  imageUrl: string;
  href: string;
}

export interface FeaturePlatformIcon {
  icon: string;
  iconAlt: string;
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
  icon: string;
  description: string;
}

export interface LinkItem {
  label: string;
  href: string;
  description: string;
  icon?: string;
}

export interface OfficialDocumentationLink {
  label: string;
  href: string;
  description: string;
  icon: string;
  iconAlt: string;
}

export interface AboutSectionContent {
  title: string;
  summary: string;
  details: string[];
}

export interface SocialLink {
  label: string;
  href: string;
  icon: string;
  iconAlt: string;
}

export interface DownloadTarget {
  label: string;
  icon: string;
  iconAlt: string;
  iconType?: "material" | "image";
  builds: DownloadBuild[];
  note?: string;
}

export interface DownloadBuild {
  label: string;
  assetNamePattern: string;
  details?: string;
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
const coverageBadgeImageUrl =
  "https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/scabir/NoteBranch/main/badges/coverage.json";
const integrationBadgeImageUrl =
  "https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/scabir/NoteBranch/main/badges/integration.json";
const coverageWorkflowUrl = `${githubBase}/actions/workflows/coverage.yml`;
const integrationWorkflowUrl = `${githubBase}/actions/workflows/integration.yml`;

const toBlobLink = (path: string): string => `${githubBlobBase}/${path}`;

export const branding = {
  productName: "NoteBranch",
  tagline: "Markdown notes that stay in your Git, AWS S3, or local workspace.",
  summary:
    "Free and open source: a desktop workspace for writing, organizing, versioning, and exporting notes without locking your data into a proprietary cloud.",
  madeInLabel: "made in UK",
  maintainerName: "Suleyman Cabir Ataman",
  maintainerSocialLinks: [
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/scabir",
      icon: linkedinIcon,
      iconAlt: "LinkedIn"
    },
    {
      label: "GitHub",
      href: "https://github.com/scabir",
      icon: githubIcon,
      iconAlt: "GitHub"
    }
  ] as SocialLink[]
};

export const navItems: NavigationItem[] = [
  { label: "Home", href: "/" },
  { label: "Downloads", href: "/downloads/" },
  { label: "Features", href: "/features/" },
  { label: "Workflow", href: "/workflow/" },
  { label: "Tutorials", href: "/tutorials/" },
  { label: "Screenshots", href: "/screenshots/" },
  { label: "About", href: "/about/" }
];

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

export const homeExploreLinks: LinkItem[] = [
  {
    icon: "download",
    label: "Downloads",
    description: "Direct links for macOS, Linux, and Windows release builds.",
    href: "/downloads/"
  },
  {
    icon: "rocket_launch",
    label: "Features",
    description: "Core capabilities, data ownership, and platform support.",
    href: "/features/"
  },
  {
    icon: "account_tree",
    label: "Workflow",
    description: "Provider-aware flow from setup to sync, history, and export.",
    href: "/workflow/"
  },
  {
    icon: "menu_book",
    label: "Tutorials",
    description: "Step-by-step guides for Git, AWS S3, and local workflows.",
    href: "/tutorials/"
  },
  {
    icon: "image",
    label: "Screenshots",
    description: "Real interface snapshots from repository tutorial scenarios.",
    href: "/screenshots/"
  },
  {
    icon: "info",
    label: "About",
    description: "Project links, license, maintainer details, and open-source context.",
    href: "/about/"
  }
];

export const latestRelease = {
  pageUrl: githubLatestReleasePage,
  apiUrl: githubLatestReleaseApi
};

export const desktopReleaseVersion = "2.8.4";

export const releasesPageUrl = `${githubBase}/releases`;

export const heroDownloadTargets: DownloadTarget[] = [
  {
    label: "macOS",
    icon: macosIcon,
    iconAlt: "macOS",
    iconType: "image",
    builds: [
      {
        label: "Apple Silicon (.dmg)",
        assetNamePattern: "NoteBranch-macos-arm64-.*\\.dmg$"
      },
      {
        label: "Intel x64 (.dmg)",
        assetNamePattern: "NoteBranch-macos-x64-.*\\.dmg$"
      }
    ]
  },
  {
    label: "Linux",
    icon: linuxIcon,
    iconAlt: "Linux",
    iconType: "image",
    builds: [
      {
        label: "AMD64 (.deb)",
        assetNamePattern: "NoteBranch-linux-amd64-.*\\.deb$"
      },
      {
        label: "x86_64 (.rpm)",
        assetNamePattern: "NoteBranch-linux-x86_64-.*\\.rpm$"
      }
    ]
  },
  {
    label: "Windows",
    icon: windowsIcon,
    iconAlt: "Windows",
    iconType: "image",
    builds: [
      {
        label: "x64 installer (.exe)",
        assetNamePattern: "NoteBranch-windows-x64-setup-.*\\.exe$"
      }
    ]
  }
];

export const downloadsPageTargets: DownloadTarget[] = [
  {
    label: "macOS",
    icon: macosIcon,
    iconAlt: "macOS",
    iconType: "image",
    builds: [
      {
        label: "Apple Silicon (.dmg)",
        assetNamePattern: "NoteBranch-macos-arm64-.*\\.dmg$",
        details:
          "For Macs with Apple chips (M1, M2, M3, M4; generally late-2020 and newer). Recommended on macOS 12 Monterey or newer."
      },
      {
        label: "Intel x64 (.dmg)",
        assetNamePattern: "NoteBranch-macos-x64-.*\\.dmg$",
        details:
          "For Intel-based Macs (generally 2020 and earlier). Use the latest Intel-supported macOS on your device (commonly Monterey, Ventura, or Sonoma)."
      }
    ],
    note: "Unsigned macOS build: after downloading, open the app once, then allow it under System Settings > Privacy & Security. If macOS blocks launch, click “Open Anyway”, confirm, and reopen the app."
  },
  {
    label: "Linux",
    icon: linuxIcon,
    iconAlt: "Linux",
    iconType: "image",
    builds: [
      {
        label: "AMD64 (.deb)",
        assetNamePattern: "NoteBranch-linux-amd64-.*\\.deb$",
        details:
          "Debian-based distros: Ubuntu, Linux Mint, Debian, Pop!_OS, elementary OS, Zorin OS, and similar."
      },
      {
        label: "x86_64 (.rpm)",
        assetNamePattern: "NoteBranch-linux-x86_64-.*\\.rpm$",
        details:
          "RPM-based distros: Fedora, Red Hat Enterprise Linux (RHEL), CentOS Stream, Rocky Linux, AlmaLinux, openSUSE, and similar."
      }
    ]
  },
  {
    label: "Windows",
    icon: windowsIcon,
    iconAlt: "Windows",
    iconType: "image",
    builds: [
      {
        label: "x64 installer (.exe)",
        assetNamePattern: "NoteBranch-windows-x64-setup-.*\\.exe$",
        details:
          "Supported for modern 64-bit Windows desktop installations."
      }
    ]
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
    icon: "edit_note",
    title: "Power of Markdown",
    description:
      "Write in Markdown with editor, preview-only, and split view modes built for real day-to-day documentation."
  },
  {
    icon: "cloud_sync",
    title: "Store in local, or cloud safely",
    description:
      "Utilize GitHub repositories, or AWS S3 buckets, or just Local mode without changing your core workflow."
  },
  {
    icon: "lock",
    title: "Full privacy and ownership",
    description:
      "We never get involved into your data. There is no hosted NoteBranch notes cloud. Your notes stay in storage you configure and control."
  },
  {
    icon: "history",
    title: "History and restore",
    description:
      "Inspect file history in Git or versioned objects in AWS S3, then restore the reference you need."
  },
  {
    icon: "schema",
    title: "Diagram support (Mermaid)",
    description:
      "Create Mermaid diagrams inside Markdown blocks and preview rendered diagrams directly in the app."
  },
  {
    icon: "menu_book",
    title: "Strong help documentation",
    description:
      "User guide, technical docs, and tutorial scenarios are maintained in-repo for setup, workflows, and troubleshooting."
  },
  {
    icon: "ios_share",
    title: "Export",
    description:
      "Export the current note or the full repository as ZIP for backup, migration, or sharing."
  },
  {
    icon: "code",
    title: "Open source and transparent",
    description:
      "MIT-licensed and free to use. Source code, technical docs, user guide, and tutorial scenarios are maintained in the public repository."
  },
  {
    icon: "verified",
    title: "High-quality codebase",
    description:
      "Current CI reports 92% coverage and 110/110 integration scenarios passing.",
    badges: [
      {
        alt: "Coverage badge (92%)",
        imageUrl: coverageBadgeImageUrl,
        href: coverageWorkflowUrl
      },
      {
        alt: "Integration badge (110/110 passing)",
        imageUrl: integrationBadgeImageUrl,
        href: integrationWorkflowUrl
      }
    ]
  },
  {
    icon: "devices",
    title: "All desktop platforms supported",
    description:
      "Release artifacts are built for macOS, Linux, and Windows, including .dmg, .deb, .rpm, and .exe formats.",
    platformIcons: [
      { icon: macosIcon, iconAlt: "macOS" },
      { icon: linuxIcon, iconAlt: "Linux" },
      { icon: windowsIcon, iconAlt: "Windows" }
    ]
  },
  {
    icon: "translate",
    title: "Strong localization",
    description:
      "Supported languages: English (English), Chinese (中文), Hindi (हिन्दी), Spanish (Español), German (Deutsch), Arabic (العربية), French (Français), Russian (Русский), Portuguese (Português), Japanese (日本語), Turkish (Türkçe), Italian (Italiano), Polish (Polski), Ukrainian (Українська), Kurdish (Kurdî), Swedish (Svenska), Greek (Ελληνικά).",
    isWide: true
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
    "The goal is a dependable, file-first note workflow that works across Git, AWS S3, and local repositories."
  ]
};

export const workflowSteps: WorkflowStep[] = [
  {
    title: "1. Connect a provider",
    icon: "settings_input_component",
    description:
      "Start with Git, AWS S3, or Local, then save provider-specific settings in one setup flow. Profiles let you switch between repositories without repeating setup."
  },
  {
    title: "2. Write and organize notes",
    icon: "edit_note",
    description:
      "Create Markdown files, organize folders, and move through editor, preview, or split view as you work. Search, replace, and favorites keep larger workspaces manageable."
  },
  {
    title: "3. Sync",
    icon: "sync",
    description:
      "Sync changes through a consistent status bar flow: commit/pull/push for Git, pending-to-synced uploads for AWS S3, and local-only persistence for Local mode."
  },
  {
    title: "4. Review history and export",
    icon: "history",
    description:
      "Open the history panel to inspect earlier versions and restore the content you need. Export single notes or full repository ZIP archives when sharing or backing up."
  }
];

export const officialDocumentationLinks: OfficialDocumentationLink[] = [
  {
    label: "GitHub Documentation",
    description:
      "Official guides for repositories, authentication, and collaboration workflows used in Git mode.",
    href: "https://docs.github.com/en",
    icon: githubIcon,
    iconAlt: "GitHub"
  },
  {
    label: "AWS S3 Documentation",
    description:
      "Official AWS S3 user guide for buckets, versioning, permissions, and storage operations.",
    href: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html",
    icon: awsS3Icon,
    iconAlt: "AWS S3"
  }
];

export const tutorialLinks: LinkItem[] = [
  {
    icon: "account_tree",
    label: "Connect Git Repository",
    description:
      "Step-by-step setup for connecting a remote Git repository and verifying workspace state.",
    href: toBlobLink("tutorials/scenarios/connect-git-repository/README.md")
  },
  {
    icon: "cloud_sync",
    label: "Connect AWS S3 Bucket with Prefix",
    description:
      "Configure bucket, region, prefix, and credentials for an AWS S3-backed workspace.",
    href: toBlobLink("tutorials/scenarios/connect-s3-bucket-with-prefix/README.md")
  },
  {
    icon: "folder",
    label: "Create Local Repository and Work Offline",
    description:
      "Run the same editor and file workflows with local-only storage and no remote sync.",
    href: toBlobLink(
      "tutorials/scenarios/create-local-repository-and-work-offline/README.md"
    )
  },
  {
    icon: "edit_note",
    label: "Create and Edit Markdown (Preview + Split)",
    description:
      "Build notes with markdown preview controls and split layout for faster iteration.",
    href: toBlobLink(
      "tutorials/scenarios/create-and-edit-markdown-preview-split/README.md"
    )
  },
  {
    icon: "manage_search",
    label: "Search and Replace (File + Repository)",
    description:
      "Find text in current file or across repository scope using search controls.",
    href: toBlobLink(
      "tutorials/scenarios/search-and-replace-file-and-repo/README.md"
    )
  },
  {
    icon: "sync_alt",
    label: "Commit, Pull, Push from Status Bar",
    description:
      "Use Git status actions in sequence for practical day-to-day repository sync.",
    href: toBlobLink(
      "tutorials/scenarios/commit-pull-push-from-status-bar/README.md"
    )
  },
  {
    icon: "history",
    label: "View History and Restore Reference",
    description:
      "Inspect past versions and restore the content reference you want to continue from.",
    href: toBlobLink(
      "tutorials/scenarios/view-history-and-restore-reference/README.md"
    )
  },
  {
    icon: "ios_share",
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
  "Release artifacts are published for macOS, Linux, and Windows."
];

export const openSourceAction: ActionLink = {
  label: "Open Repository",
  href: githubBase
};

export const sourceCodeLinks: LinkItem[] = [
  {
    icon: "code",
    label: "GitHub Repository",
    description: "Browse source, issues, pull requests, and release notes.",
    href: githubBase
  },
  {
    icon: "new_releases",
    label: "Releases",
    description: "Download desktop builds and track release history.",
    href: `${githubBase}/releases`
  },
  {
    icon: "menu_book",
    label: "User Guide",
    description: "End-user setup steps, workflows, and troubleshooting.",
    href: toBlobLink("docs/USER_GUIDE.md")
  },
  {
    icon: "description",
    label: "Technical Documentation",
    description: "Architecture, security model, development, and test reference.",
    href: toBlobLink("docs/tech/README.md")
  },
  {
    icon: "school",
    label: "Tutorial Hub",
    description: "Playwright-generated tutorials with step-by-step screenshots.",
    href: toBlobLink("tutorials/README.md")
  },
  {
    icon: "gavel",
    label: "License",
    description: "MIT license terms for using and extending the project.",
    href: toBlobLink("LICENSE")
  }
];

export const footerLinks: ActionLink[] = [
  { label: "Home", href: "/" },
  { label: "Downloads", href: "/downloads/" },
  { label: "Features", href: "/features/" },
  { label: "Workflow", href: "/workflow/" },
  { label: "Tutorials", href: "/tutorials/" },
  { label: "GitHub", href: githubBase },
  { label: "Releases", href: releasesPageUrl },
  { label: "License", href: toBlobLink("LICENSE") }
];
