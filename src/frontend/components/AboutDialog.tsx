import React from 'react';
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
} from '@mui/material';
import {
  Info as InfoIcon,
  Code as CodeIcon,
  GitHub as GitHubIcon,
  Language as WebIcon,
} from '@mui/icons-material';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  const APP_NAME = 'notegit';
  const APP_VERSION = '1.2.0';
  const APP_DESCRIPTION = 'A Git-backed Markdown note-taking desktop application built with Electron';
  const AUTHOR_NAME = 'Suleyman Cabir Ataman, PhD';
  const GITHUB_URL = 'https://github.com/scabir';
  const WEBSITE_URL = ''; // TODO: Add your website URL (optional)
  const LICENSE = 'MIT License';
  const YEAR = new Date().getFullYear();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InfoIcon color="primary" />
        About {APP_NAME}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {APP_NAME}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Version {APP_VERSION}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" paragraph>
            {APP_DESCRIPTION}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Features
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>
              <Typography variant="body2">Markdown editing with live preview</Typography>
            </li>
            <li>
              <Typography variant="body2">Git-based version control</Typography>
            </li>
            <li>
              <Typography variant="body2">File and folder management</Typography>
            </li>
            <li>
              <Typography variant="body2">Full-text search across notes</Typography>
            </li>
            <li>
              <Typography variant="body2">Dark mode support</Typography>
            </li>
            <li>
              <Typography variant="body2">Auto-save and sync</Typography>
            </li>
            <li>
              <Typography variant="body2">File history and version viewing</Typography>
            </li>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {AUTHOR_NAME && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Author
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {AUTHOR_NAME}
            </Typography>
          </Box>
        )}

        {(GITHUB_URL || WEBSITE_URL) && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {GITHUB_URL && (
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <GitHubIcon fontSize="small" />
                  <Typography variant="body2">GitHub Repository</Typography>
                </Link>
              )}
              {WEBSITE_URL && (
                <Link
                  href={WEBSITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <WebIcon fontSize="small" />
                  <Typography variant="body2">Website</Typography>
                </Link>
              )}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Technology Stack
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            <Box
              sx={{
                px: 1,
                py: 0.5,
                bgcolor: 'action.hover',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <CodeIcon fontSize="small" />
              <Typography variant="caption">Electron</Typography>
            </Box>
            <Box
              sx={{
                px: 1,
                py: 0.5,
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            >
              <Typography variant="caption">React</Typography>
            </Box>
            <Box
              sx={{
                px: 1,
                py: 0.5,
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            >
              <Typography variant="caption">TypeScript</Typography>
            </Box>
            <Box
              sx={{
                px: 1,
                py: 0.5,
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            >
              <Typography variant="caption">Material-UI</Typography>
            </Box>
            <Box
              sx={{
                px: 1,
                py: 0.5,
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            >
              <Typography variant="caption">CodeMirror</Typography>
            </Box>
            <Box
              sx={{
                px: 1,
                py: 0.5,
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            >
              <Typography variant="caption">Git</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="body2" color="text.secondary" align="center">
            {LICENSE}
          </Typography>
          {AUTHOR_NAME && (
            <Typography variant="body2" color="text.secondary" align="center">
              © {YEAR} {AUTHOR_NAME}
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

