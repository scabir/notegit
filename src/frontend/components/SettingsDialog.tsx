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
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import { 
  Info as InfoIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { AboutDialog } from './AboutDialog';
import type { FullConfig, AppSettings, RepoSettings, AuthMethod, Profile } from '../../shared/types';

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
  currentNoteContent?: string;
  currentNotePath?: string;
}

export function SettingsDialog({
  open,
  onClose,
  onThemeChange,
  currentNoteContent,
  currentNotePath,
}: SettingsDialogProps) {
  const [tabValue, setTabValue] = useState(0);
  const [config, setConfig] = useState<FullConfig | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [repoSettings, setRepoSettings] = useState<Partial<RepoSettings>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  
  // Profile management state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileRepo, setNewProfileRepo] = useState<Partial<RepoSettings>>({ authMethod: 'pat' as AuthMethod });

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
        setProfiles(response.data.profiles || []);
        setActiveProfileId(response.data.activeProfileId || null);
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

  // Profile management handlers
  const handleSelectProfile = async (profileId: string) => {
    if (profileId === activeProfileId) {
      return; // Already active
    }

    setLoading(true);
    setError(null);

    try {
      const response = await window.notegitApi.config.setActiveProfile(profileId);
      
      if (response.ok) {
        setSuccess('Profile switched successfully. App will restart...');
        setTimeout(async () => {
          await window.notegitApi.config.restartApp();
        }, 1500);
      } else {
        setError(response.error?.message || 'Failed to switch profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to switch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      setError('Profile name is required');
      return;
    }

    if (!newProfileRepo.remoteUrl || !newProfileRepo.branch || !newProfileRepo.localPath || !newProfileRepo.pat || !newProfileRepo.authMethod) {
      setError('All repository fields are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await window.notegitApi.config.createProfile(
        newProfileName.trim(),
        newProfileRepo as RepoSettings
      );
      
      if (response.ok && response.data) {
        setSuccess('Profile created successfully');
        setProfiles([...profiles, response.data]);
        setCreatingProfile(false);
        setNewProfileName('');
        setNewProfileRepo({ authMethod: 'pat' as AuthMethod });
      } else {
        setError(response.error?.message || 'Failed to create profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile? This will not delete the remote repository.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await window.notegitApi.config.deleteProfile(profileId);
      
      if (response.ok) {
        setSuccess('Profile deleted successfully');
        setProfiles(profiles.filter(p => p.id !== profileId));
        if (activeProfileId === profileId) {
          setActiveProfileId(null);
        }
      } else {
        setError(response.error?.message || 'Failed to delete profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete profile');
    } finally {
      setLoading(false);
    }
  };

  const handleExportNote = async (format: 'md' | 'txt') => {
    if (!currentNoteContent || !currentNotePath) {
      setError('No note is currently open');
      return;
    }

    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      // Export note - dialog is shown by the backend
      const response = await window.notegitApi.export.note(
        currentNotePath,
        currentNoteContent,
        format
      );

      if (response.ok && response.data) {
        setSuccess(`Note exported successfully to ${response.data}`);
      } else if (response.error?.message !== 'Export cancelled') {
        setError(response.error?.message || 'Failed to export note');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to export note');
    } finally {
      setExporting(false);
    }
  };

  const handleExportRepoAsZip = async () => {
    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      // Export repo - dialog is shown by the backend
      const response = await window.notegitApi.export.repoZip();

      if (response.ok && response.data) {
        setSuccess(`Repository exported successfully to ${response.data}`);
      } else if (response.error?.message !== 'Export cancelled') {
        setError(response.error?.message || 'Failed to export repository');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to export repository');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="App Settings" />
            <Tab label="Repository" />
            <Tab label="Profiles" />
            <Tab label="Export" />
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

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Profile Management</Typography>
            <Alert severity="info">
              Profiles allow you to work with multiple repositories. Only one profile is active at a time. 
              Switching profiles will restart the app with a clean state.
            </Alert>

            <Typography variant="subtitle1" sx={{ mt: 2 }}>Active Profile</Typography>
            <List>
              {profiles.map((profile) => (
                <ListItem
                  key={profile.id}
                  secondaryAction={
                    profiles.length > 1 && profile.id !== activeProfileId && (
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteProfile(profile.id)}
                        disabled={loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )
                  }
                  disablePadding
                >
                  <ListItemButton
                    selected={profile.id === activeProfileId}
                    onClick={() => handleSelectProfile(profile.id)}
                    disabled={loading || profile.id === activeProfileId}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {profile.name}
                          {profile.id === activeProfileId && (
                            <Chip label="Active" size="small" color="primary" icon={<CheckIcon />} />
                          )}
                        </Box>
                      }
                      secondary={profile.repoSettings.remoteUrl}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>

            {!creatingProfile ? (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setCreatingProfile(true)}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                Create New Profile
              </Button>
            ) : (
              <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>New Profile</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Profile Name"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="My New Repo"
                    fullWidth
                    required
                  />
                  <TextField
                    label="Remote URL"
                    value={newProfileRepo.remoteUrl || ''}
                    onChange={(e) => setNewProfileRepo({ ...newProfileRepo, remoteUrl: e.target.value })}
                    placeholder="https://github.com/user/repo.git"
                    fullWidth
                    required
                  />
                  <TextField
                    label="Branch"
                    value={newProfileRepo.branch || ''}
                    onChange={(e) => setNewProfileRepo({ ...newProfileRepo, branch: e.target.value })}
                    placeholder="main"
                    fullWidth
                    required
                  />
                  <TextField
                    label="Local Path"
                    value={newProfileRepo.localPath || ''}
                    onChange={(e) => setNewProfileRepo({ ...newProfileRepo, localPath: e.target.value })}
                    placeholder="/path/to/local/repo"
                    fullWidth
                    required
                  />
                  <TextField
                    label="Personal Access Token"
                    type="password"
                    value={newProfileRepo.pat || ''}
                    onChange={(e) => setNewProfileRepo({ ...newProfileRepo, pat: e.target.value, authMethod: 'pat' as AuthMethod })}
                    placeholder="ghp_..."
                    fullWidth
                    required
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleCreateProfile}
                      disabled={loading}
                    >
                      Create Profile
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setCreatingProfile(false);
                        setNewProfileName('');
                        setNewProfileRepo({ authMethod: 'pat' as AuthMethod });
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6">Export Current Note</Typography>
            <Typography variant="body2" color="text.secondary">
              Export the currently open note (including unsaved changes) as a standalone file.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => handleExportNote('md')}
                disabled={exporting || !currentNoteContent}
                fullWidth
              >
                Export as Markdown (.md)
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleExportNote('txt')}
                disabled={exporting || !currentNoteContent}
                fullWidth
              >
                Export as Text (.txt)
              </Button>
            </Box>
            {!currentNoteContent && (
              <Alert severity="info">
                Open a note in the editor to export it.
              </Alert>
            )}

            <Typography variant="h6" sx={{ mt: 3 }}>
              Export Repository
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Export the entire repository as a ZIP archive for backup or sharing. This includes
              all files and folders (excluding .git).
            </Typography>
            <Button
              variant="contained"
              onClick={handleExportRepoAsZip}
              disabled={exporting}
              fullWidth
            >
              {exporting ? 'Exporting...' : 'Export Repository as ZIP'}
            </Button>

            <Alert severity="info">
              <Typography variant="body2">
                Export operations do not modify your repository or trigger any Git commands.
                Your work remains safely in the repository.
              </Typography>
            </Alert>
          </Box>
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <Button
          onClick={() => setAboutDialogOpen(true)}
          startIcon={<InfoIcon />}
          color="inherit"
        >
          About
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>

      {/* About Dialog */}
      <AboutDialog
        open={aboutDialogOpen}
        onClose={() => setAboutDialogOpen(false)}
      />
    </Dialog>
  );
}

