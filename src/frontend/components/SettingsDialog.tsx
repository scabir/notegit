import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import type { FullConfig, AppSettings, RepoSettings, AuthMethod } from '../../shared/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
}

export function SettingsDialog({ open, onClose, onThemeChange }: SettingsDialogProps) {
  const [tabValue, setTabValue] = useState(0);
  const [config, setConfig] = useState<FullConfig | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [repoSettings, setRepoSettings] = useState<Partial<RepoSettings>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await window.notegitApi.config.getFull();
      
      if (response.ok && response.data) {
        setConfig(response.data);
        setAppSettings(response.data.appSettings);
        setRepoSettings(response.data.repoSettings || {});
      } else {
        setError(response.error?.message || 'Failed to load configuration');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppSettings = async () => {
    if (!appSettings) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await window.notegitApi.config.updateAppSettings(appSettings);
      
      if (response.ok) {
        setSuccess('App settings saved successfully');
        // Notify parent about theme change
        if (onThemeChange) {
          onThemeChange(appSettings.theme);
        }
      } else {
        setError(response.error?.message || 'Failed to save app settings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save app settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRepoSettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!repoSettings.remoteUrl || !repoSettings.branch || !repoSettings.pat) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const response = await window.notegitApi.config.updateRepoSettings(repoSettings as RepoSettings);
      
      if (response.ok) {
        setSuccess('Repository settings saved successfully');
      } else {
        setError(response.error?.message || 'Failed to save repository settings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save repository settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="App Settings" />
            <Tab label="Repository" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <TabPanel value={tabValue} index={0}>
          {appSettings && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={appSettings.theme}
                  label="Theme"
                  onChange={(e) =>
                    setAppSettings({ ...appSettings, theme: e.target.value as any })
                  }
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={appSettings.autoSaveEnabled}
                    onChange={(e) =>
                      setAppSettings({ ...appSettings, autoSaveEnabled: e.target.checked })
                    }
                  />
                }
                label="Enable Auto-save"
              />

              {appSettings.autoSaveEnabled && (
                <TextField
                  label="Auto-save Interval (seconds)"
                  type="number"
                  value={appSettings.autoSaveIntervalSec}
                  onChange={(e) =>
                    setAppSettings({
                      ...appSettings,
                      autoSaveIntervalSec: parseInt(e.target.value),
                    })
                  }
                  InputProps={{ inputProps: { min: 10, max: 300 } }}
                />
              )}

              <Typography variant="h6" sx={{ mt: 2 }}>
                Editor Preferences
              </Typography>

              <TextField
                label="Font Size"
                type="number"
                value={appSettings.editorPrefs.fontSize}
                onChange={(e) =>
                  setAppSettings({
                    ...appSettings,
                    editorPrefs: {
                      ...appSettings.editorPrefs,
                      fontSize: parseInt(e.target.value),
                    },
                  })
                }
                InputProps={{ inputProps: { min: 10, max: 24 } }}
              />

              <TextField
                label="Tab Size"
                type="number"
                value={appSettings.editorPrefs.tabSize}
                onChange={(e) =>
                  setAppSettings({
                    ...appSettings,
                    editorPrefs: {
                      ...appSettings.editorPrefs,
                      tabSize: parseInt(e.target.value),
                    },
                  })
                }
                InputProps={{ inputProps: { min: 2, max: 8 } }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={appSettings.editorPrefs.lineNumbers}
                    onChange={(e) =>
                      setAppSettings({
                        ...appSettings,
                        editorPrefs: {
                          ...appSettings.editorPrefs,
                          lineNumbers: e.target.checked,
                        },
                      })
                    }
                  />
                }
                label="Show Line Numbers"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={appSettings.editorPrefs.wordWrap}
                    onChange={(e) =>
                      setAppSettings({
                        ...appSettings,
                        editorPrefs: {
                          ...appSettings.editorPrefs,
                          wordWrap: e.target.checked,
                        },
                      })
                    }
                  />
                }
                label="Word Wrap"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={appSettings.editorPrefs.showPreview}
                    onChange={(e) =>
                      setAppSettings({
                        ...appSettings,
                        editorPrefs: {
                          ...appSettings.editorPrefs,
                          showPreview: e.target.checked,
                        },
                      })
                    }
                  />
                }
                label="Show Markdown Preview"
              />

              <Button
                variant="contained"
                onClick={handleSaveAppSettings}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                Save App Settings
              </Button>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Remote URL"
              value={repoSettings.remoteUrl || ''}
              onChange={(e) => setRepoSettings({ ...repoSettings, remoteUrl: e.target.value })}
              placeholder="https://github.com/user/repo.git"
              fullWidth
              required
            />

            <TextField
              label="Branch"
              value={repoSettings.branch || ''}
              onChange={(e) => setRepoSettings({ ...repoSettings, branch: e.target.value })}
              placeholder="main"
              fullWidth
              required
            />

            <TextField
              label="Personal Access Token"
              type="password"
              value={repoSettings.pat || ''}
              onChange={(e) => setRepoSettings({ ...repoSettings, pat: e.target.value })}
              placeholder="ghp_..."
              fullWidth
              required
              helperText="Your Personal Access Token is stored encrypted in the app's data directory, not in your operating system's keychain."
            />

            <Alert severity="info">
              <Typography variant="body2">
                To generate a GitHub Personal Access Token:
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                1. Go to GitHub Settings → Developer settings → Personal access tokens
              </Typography>
              <Typography variant="body2">
                2. Click "Generate new token"
              </Typography>
              <Typography variant="body2">
                3. Select scopes: repo (full control)
              </Typography>
              <Typography variant="body2">
                4. Copy the token and paste it above
              </Typography>
            </Alert>

            <Button
              variant="contained"
              onClick={handleSaveRepoSettings}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Save Repository Settings
            </Button>
          </Box>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

