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
  mission: string;
  proof: string;
}

export interface AboutTrustSignal {
  label: string;
  value: string;
  description: string;
  href: string;
  badgeImageUrl?: string;
  badgeAlt?: string;
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
  tagline: "Own your notes before they own you.",
  summary:
    "Open-source Markdown workspace with zero lock-in. Sync to Git or AWS S3, or stay local. Your notes stay under your control.",
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
  { label: "Features", href: "/features/" },
  { label: "Downloads", href: "/downloads/" },
  { label: "Workflow", href: "/workflow/" },
  { label: "Tutorials", href: "/tutorials/" },
  { label: "Screenshots", href: "/screenshots/" },
  { label: "About", href: "/about/" }
];

export const heroActions: ActionLink[] = [
  {
    label: "Get NoteBranch Free",
    href: "/downloads/"
  },
  {
    label: "See the Workflow",
    href: "/workflow/"
  }
];

export const homeExploreLinks: LinkItem[] = [
  {
    icon: "rocket_launch",
    label: "Features",
    description: "What you can do in your first 10 minutes.",
    href: "/features/"
  },
  {
    icon: "download",
    label: "Downloads",
    description: "Pick your OS and install in minutes.",
    href: "/downloads/"
  },
  {
    icon: "account_tree",
    label: "Workflow",
    description: "Connect, write, sync, restore, and export in one flow.",
    href: "/workflow/"
  },
  {
    icon: "menu_book",
    label: "Tutorials",
    description: "Guided scenarios, not vague documentation.",
    href: "/tutorials/"
  },
  {
    icon: "image",
    label: "Screenshots",
    description: "Real interface captures from tested scenarios.",
    href: "/screenshots/"
  },
  {
    icon: "info",
    label: "About",
    description: "Source, license, maintainer, and project details.",
    href: "/about/"
  }
];

export const latestRelease = {
  pageUrl: githubLatestReleasePage,
  apiUrl: githubLatestReleaseApi
};

export const desktopReleaseVersion = "2.8.5";

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
  caption: "Real NoteBranch workspace from the official scenario set."
};

export const whatItIs = {
  title: "Your notes! Your cloud!",
  lead: "We don't even offer saving your notes. Store your notes in your own cloud!",
  paragraphs: [
    "Write, search, sync, restore, and export in one desktop app."
  ],
  highlights: [
    "Storage freedom: Git, AWS S3, or no cloud on your terms",
    "Privacy-first, open-source Markdown workspace ",
    "Power without friction: visible sync, fast editing, and reliable recovery",
    "No vendor lock",
  ]
};

export const features: FeatureItem[] = [
  {
    icon: "edit_note",
    title: "Write at speed",
    description:
      "Editor, preview-only, and split view keep typing and verification in one place."
  },
  {
    icon: "cloud_sync",
    title: "Switch storage, not tools",
    description:
      "Work with Git repositories, AWS S3 buckets, or Local mode while keeping the same navigation and editing flow."
  },
  {
    icon: "lock",
    title: "No note lock-in. Period.",
    description:
      "There is no hosted NoteBranch notes cloud. Your notes stay in storage you configure and control."
  },
  {
    icon: "history",
    title: "Restore with confidence",
    description:
      "Inspect file history in Git or versioned object history in AWS S3, then restore exactly what you need."
  },
  {
    icon: "schema",
    title: "Markdown plus diagrams",
    description:
      "Write Mermaid blocks inside Markdown and preview rendered diagrams directly in the app."
  },
  {
    icon: "menu_book",
    title: "Get unblocked faster",
    description:
      "User guide, technical docs, and tutorial scenarios are maintained in-repo for setup, workflows, and troubleshooting."
  },
  {
    icon: "ios_share",
    title: "Export on demand",
    description:
      "Export the current note or the full repository as ZIP for backup, migration, and sharing."
  },
  {
    icon: "code",
    title: "Open by default",
    description:
      "MIT-licensed and free to use, with source code, docs, and tutorials maintained in the public repository."
  },
  {
    icon: "verified",
    title: "Proof, not hype",
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
    title: "Desktop-ready on every major OS",
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
    title: "Built for global teams",
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
    title: "Storage freedom",
    description:
      "Keep notes in providers you choose instead of moving your knowledge into a proprietary hosted silo."
  },
  {
    title: "Longevity over lock-in",
    description:
      "Open formats and public source make long-term access and migration simpler."
  },
  {
    title: "Power without friction",
    description:
      "Git and AWS S3 flows are visible in the UI, while Local mode keeps offline workflows straightforward."
  },
  {
    title: "Built for repeatable daily work",
    description:
      "Editing, history checks, sync operations, and exports are grouped into practical desktop actions."
  }
];

export const aboutSection: AboutSectionContent = {
  title: "Built in the open. Controlled by you.",
  summary:
    "No private NoteBranch notes cloud, no hidden lock-in layer. Your knowledge stays portable because your files stay in storage you own.",
  mission: "Open note workflows, no data captivity.",
  proof: "Code, docs, tests, and release assets are public and auditable."
};

export const aboutTrustSignals: AboutTrustSignal[] = [
  {
    label: "Latest release",
    value: `v${desktopReleaseVersion}`,
    description: "Desktop builds are published on GitHub Releases.",
    href: githubLatestReleasePage
  },
  {
    label: "License",
    value: "MIT",
    description: "Permissive terms for use, extension, and redistribution.",
    href: toBlobLink("LICENSE")
  },
  {
    label: "Coverage",
    value: "Coverage",
    description: "Coverage status is published by CI workflows.",
    href: coverageWorkflowUrl,
    badgeImageUrl: coverageBadgeImageUrl,
    badgeAlt: "Coverage status badge"
  },
  {
    label: "Integration",
    value: "Integration",
    description: "End-to-end scenario checks run in CI.",
    href: integrationWorkflowUrl,
    badgeImageUrl: integrationBadgeImageUrl,
    badgeAlt: "Integration status badge"
  }
];

export const aboutCommunityActions: ActionLink[] = [
  {
    label: "Report an issue",
    href: `${githubBase}/issues`
  },
  {
    label: "Share an idea",
    href: `${githubBase}/discussions`
  }
];

export const workflowSteps: WorkflowStep[] = [
  {
    title: "1. Connect a provider",
    icon: "settings_input_component",
    description:
      "Start with Git, AWS S3, or Local and save provider-specific settings in one setup flow. Profiles let you switch repositories without repeating setup."
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
      "Sync through a consistent status bar flow: commit/pull/push for Git, pending-to-synced uploads for AWS S3, and local-only persistence for Local mode."
  },
  {
    title: "4. Review history and export",
    icon: "history",
    description:
      "Open the history panel to inspect earlier versions and restore the content you need. Export single notes or full repository ZIP archives for sharing or backup."
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
  "Source code is public on GitHub under the MIT license.",
  "Docs, user guide, and tutorial scenarios are versioned with the codebase.",
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
    icon: "bug_report",
    label: "Report Issues",
    description: "Report bugs and track fixes in the project issue tracker.",
    href: `${githubBase}/issues`
  },
  {
    icon: "new_releases",
    label: "Releases",
    description: "Download desktop builds and track release history.",
    href: `${githubBase}/releases`
  },
  {
    icon: "forum",
    label: "Ideas and Discussions",
    description: "Share ideas, ask questions, and join product discussions.",
    href: `${githubBase}/discussions`
  },
  {
    icon: "menu_book",
    label: "User Guide",
    description: "End-user setup steps, workflows, and troubleshooting.",
    href: toBlobLink("docs/USER_GUIDE.md")
  },
  {
    icon: "school",
    label: "Tutorial Hub",
    description: "Playwright-generated tutorials with step-by-step screenshots.",
    href: toBlobLink("tutorials/README.md")
  },
  {
    icon: "description",
    label: "Technical Documentation",
    description: "Architecture, security model, development, and test reference.",
    href: toBlobLink("docs/tech/README.md")
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
  { label: "Features", href: "/features/" },
  { label: "Downloads", href: "/downloads/" },
  { label: "Workflow", href: "/workflow/" },
  { label: "Tutorials", href: "/tutorials/" },
  { label: "GitHub", href: githubBase },
  { label: "Releases", href: releasesPageUrl },
  { label: "License", href: toBlobLink("LICENSE") }
];
