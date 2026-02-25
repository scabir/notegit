import { Code as CodeIcon } from "@mui/icons-material";
import type { TechStackItem } from "./types";
import versionInfo from "../../../../version.json";
import { getDefaultTranslation } from "../../i18n/defaultTranslations";

export const ABOUT_DIALOG_KEYS = {
  titlePrefix: "aboutDialog.titlePrefix",
  versionPrefix: "aboutDialog.versionPrefix",
  description: "aboutDialog.description",
  sectionsFeatures: "aboutDialog.sections.features",
  sectionsAuthor: "aboutDialog.sections.author",
  sectionsLinks: "aboutDialog.sections.links",
  sectionsTechStack: "aboutDialog.sections.techStack",
  linksGithubRepository: "aboutDialog.links.githubRepository",
  linksWebsite: "aboutDialog.links.website",
  close: "aboutDialog.close",
  license: "aboutDialog.license",
} as const;

const defaultText = (key: string): string => getDefaultTranslation(key);

export const APP_INFO = {
  name: "notegit",
  version: versionInfo.version,
  description: defaultText(ABOUT_DIALOG_KEYS.description),
  author: "Suleyman Cabir Ataman",
  githubUrl: "https://github.com/scabir",
  websiteUrl: "",
  license: defaultText(ABOUT_DIALOG_KEYS.license),
} as const;

export const FEATURE_KEYS = [
  "aboutDialog.features.markdownLivePreview",
  "aboutDialog.features.gitOrS3History",
  "aboutDialog.features.fileAndFolderManagement",
  "aboutDialog.features.fullTextSearch",
  "aboutDialog.features.darkModeSupport",
  "aboutDialog.features.autoSaveAndSync",
  "aboutDialog.features.fileHistoryAndVersionViewing",
] as const;

export const TECH_STACK: TechStackItem[] = [
  { labelKey: "aboutDialog.techStack.electron", icon: CodeIcon },
  { labelKey: "aboutDialog.techStack.react" },
  { labelKey: "aboutDialog.techStack.typeScript" },
  { labelKey: "aboutDialog.techStack.materialUi" },
  { labelKey: "aboutDialog.techStack.codeMirror" },
  { labelKey: "aboutDialog.techStack.git" },
];
