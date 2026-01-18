import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Divider, Link } from '@mui/material';
import { Info as InfoIcon, GitHub as GitHubIcon, Language as WebIcon } from '@mui/icons-material';
import { APP_INFO, FEATURE_LIST, TECH_STACK } from './constants';
import {
  dialogTitleSx,
  introSectionSx,
  sectionSx,
  featureListSx,
  linksListSx,
  linkRowSx,
  techStackListSx,
  techChipSx,
} from './styles';
import type { AboutDialogProps } from './types';

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  const YEAR = new Date().getFullYear();

  const { name, version, description, author, githubUrl, websiteUrl, license } = APP_INFO;
  const hasLinks = githubUrl || websiteUrl;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={dialogTitleSx}>
        <InfoIcon color="primary" />
        About {name}
      </DialogTitle>
      <DialogContent>
        <Box sx={introSectionSx}>
          <Typography variant="h5" gutterBottom>
            {name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Version {version}
          </Typography>
        </Box>

        <Box sx={introSectionSx}>
          <Typography variant="body1" paragraph>
            {description}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={sectionSx}>
          <Typography variant="subtitle2" gutterBottom>
            Features
          </Typography>
          <Box component="ul" sx={featureListSx}>
            {FEATURE_LIST.map((feature) => (
              <li key={feature}>
                <Typography variant="body2">{feature}</Typography>
              </li>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {author && (
          <Box sx={sectionSx}>
            <Typography variant="subtitle2" gutterBottom>
              Author
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {author}
            </Typography>
          </Box>
        )}

        {hasLinks && (
          <Box sx={sectionSx}>
            <Typography variant="subtitle2" gutterBottom>
              Links
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
                  <Typography variant="body2">GitHub Repository</Typography>
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
                  <Typography variant="body2">Website</Typography>
                </Link>
              )}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={sectionSx}>
          <Typography variant="subtitle2" gutterBottom>
            Technology Stack
          </Typography>
          <Box sx={techStackListSx}>
            {TECH_STACK.map(({ label, icon: Icon }) => (
              <Box key={label} sx={techChipSx}>
                {Icon && <Icon fontSize="small" />}
                <Typography variant="caption">{label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="body2" color="text.secondary" align="center">
            {license}
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
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
