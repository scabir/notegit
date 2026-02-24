import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Link,
} from "@mui/material";
import {
  Info as InfoIcon,
  GitHub as GitHubIcon,
  Language as WebIcon,
} from "@mui/icons-material";
import { useI18n } from "../../i18n";
import {
  ABOUT_DIALOG_KEYS,
  APP_INFO,
  FEATURE_KEYS,
  TECH_STACK,
} from "./constants";
import {
  dialogTitleSx,
  introSectionSx,
  sectionSx,
  featureListSx,
  linksListSx,
  linkRowSx,
  techStackListSx,
  techChipSx,
} from "./styles";
import type { AboutDialogProps } from "./types";

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  const { t } = useI18n();
  const YEAR = new Date().getFullYear();

  const { name, version, author, githubUrl, websiteUrl } = APP_INFO;
  const hasLinks = githubUrl || websiteUrl;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={dialogTitleSx}>
        <InfoIcon color="primary" />
        {t(ABOUT_DIALOG_KEYS.titlePrefix)} {name}
      </DialogTitle>
      <DialogContent>
        <Box sx={introSectionSx}>
          <Typography variant="h5" gutterBottom>
            {name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t(ABOUT_DIALOG_KEYS.versionPrefix)} {version}
          </Typography>
        </Box>

        <Box sx={introSectionSx}>
          <Typography variant="body1" paragraph>
            {t(ABOUT_DIALOG_KEYS.description)}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={sectionSx}>
          <Typography variant="subtitle2" gutterBottom>
            {t(ABOUT_DIALOG_KEYS.sectionsFeatures)}
          </Typography>
          <Box component="ul" sx={featureListSx}>
            {FEATURE_KEYS.map((featureKey) => (
              <li key={featureKey}>
                <Typography variant="body2">{t(featureKey)}</Typography>
              </li>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {author && (
          <Box sx={sectionSx}>
            <Typography variant="subtitle2" gutterBottom>
              {t(ABOUT_DIALOG_KEYS.sectionsAuthor)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {author}
            </Typography>
          </Box>
        )}

        {hasLinks && (
          <Box sx={sectionSx}>
            <Typography variant="subtitle2" gutterBottom>
              {t(ABOUT_DIALOG_KEYS.sectionsLinks)}
            </Typography>
            <Box sx={linksListSx}>
              {githubUrl && (
                <Link
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={linkRowSx}
                >
                  <GitHubIcon fontSize="small" />
                  <Typography variant="body2">
                    {t(ABOUT_DIALOG_KEYS.linksGithubRepository)}
                  </Typography>
                </Link>
              )}
              {websiteUrl && (
                <Link
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={linkRowSx}
                >
                  <WebIcon fontSize="small" />
                  <Typography variant="body2">
                    {t(ABOUT_DIALOG_KEYS.linksWebsite)}
                  </Typography>
                </Link>
              )}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={sectionSx}>
          <Typography variant="subtitle2" gutterBottom>
            {t(ABOUT_DIALOG_KEYS.sectionsTechStack)}
          </Typography>
          <Box sx={techStackListSx}>
            {TECH_STACK.map(({ labelKey, icon: Icon }) => (
              <Box key={labelKey} sx={techChipSx}>
                {Icon && <Icon fontSize="small" />}
                <Typography variant="caption">{t(labelKey)}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="body2" color="text.secondary" align="center">
            {t(ABOUT_DIALOG_KEYS.license)}
          </Typography>
          {author && (
            <Typography variant="body2" color="text.secondary" align="center">
              © {YEAR} {author}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          {t(ABOUT_DIALOG_KEYS.close)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
