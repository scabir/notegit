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
  Chip,
  CircularProgress,
  Snackbar,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
} from '@mui/material';
import {
  Info as InfoIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Check as CheckIcon,
  ContentCopy as ContentCopyIcon,
  FolderOpen as FolderOpenIcon,
  Refresh as RefreshIcon,
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

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileRemoteUrl, setNewProfileRemoteUrl] = useState('');
  const [newProfileBranch, setNewProfileBranch] = useState('main');
  const [newProfilePat, setNewProfilePat] = useState('');
  const [profileCreating, setProfileCreating] = useState(false);

  const [logType, setLogType] = useState<'combined' | 'error'>('combined');
  const [logContent, setLogContent] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);

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

  const handleExportNote = async (format: 'md' | 'txt') => {
    if (!currentNoteContent || !currentNotePath) {
      setError('No note is currently open');
      return;
    }

    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
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

  const handleSelectProfile = async (profileId: string) => {
    if (profileId === activeProfileId) {
      return;
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

    if (!newProfileRemoteUrl || !newProfileBranch || !newProfilePat) {
      setError('All repository fields are required');
      return;
    }

    setProfileCreating(true);
    setError(null);

    try {
      const response = await window.notegitApi.config.createProfile(
        newProfileName.trim(),
        {
          remoteUrl: newProfileRemoteUrl,
          branch: newProfileBranch,
          pat: newProfilePat,
          authMethod: 'pat',
        }
      );

      if (response.ok && response.data) {
        setSuccess('Profile created and repository cloned successfully!');
        setProfiles([...profiles, response.data]);
        setCreatingProfile(false);
        setNewProfileName('');
        setNewProfileRemoteUrl('');
        setNewProfileBranch('main');
        setNewProfilePat('');
      } else {
        setError(response.error?.message || 'Failed to create profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setProfileCreating(false);
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

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await window.notegitApi.logs.getContent(logType);
      if (response.ok && response.data) {
        setLogContent(response.data);
      } else {
        setLogContent(`Error loading logs: ${response.error?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      setLogContent(`Error loading logs: ${err.message}`);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (open && tabValue === 4) {
      loadLogs();
    }
  }, [open, tabValue, logType]);

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logContent);
    setCopySnackbarOpen(true);
  };

  const handleCopyRepoPath = () => {
    if (repoSettings.localPath) {
      navigator.clipboard.writeText(repoSettings.localPath);
      setCopySnackbarOpen(true);
    }
  };

  const handleOpenRepoFolder = async () => {
    if (repoSettings.localPath) {
      const { shell } = window.require('electron');
      await shell.openPath(repoSettings.localPath);
    }
  };

  const handleExportLogs = async () => {
    setError(null);
    setSuccess(null);

    try {
      const result = await window.notegitApi.dialog.showSaveDialog({
        title: 'Export Logs',
        defaultPath: `notegit-${logType}-logs.log`,
        filters: [
          { name: 'Log Files', extensions: ['log'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return;
      }

      const response = await window.notegitApi.logs.export(logType, result.filePath);

      if (response.ok) {
        setSuccess(`Logs exported successfully to ${result.filePath}`);
      } else {
        setError(response.error?.message || 'Failed to export logs');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to export logs');
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
            <Tab label="Logs" />
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
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                How to create a GitHub Personal Access Token:
              </Typography>
              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                1. Go to GitHub Settings → Developer settings
                <br />
                2. Click Personal access tokens → Fine Grained Tokens
                <br />
                3. Click Generate new token
                <br />
                4. Give Token Name
                <br />
                5. Set the expirationn
                <br />
                6. Select "Only select repositories" option
                <br />
                7. Selec the repository you wat to Use
                <br />
                8. CLick on "Add Permission"
                <br />
                9. Select "Ccontent" amd make sure you gave "Reand and Write" permissions
                <br />
                10. Hit Generate Token
                <br />
                11. Copy and paste the token above
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

            {repoSettings.localPath && (
              <>
                <Typography variant="h6" sx={{ mt: 4 }}>
                  Local Repository Path
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  This is where your repository is stored locally on your computer.
                </Alert>
                <TextField
                  label="Local Path"
                  value={repoSettings.localPath}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="filled"
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    onClick={handleCopyRepoPath}
                  >
                    Copy Path
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<FolderOpenIcon />}
                    onClick={handleOpenRepoFolder}
                  >
                    Open Folder
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Profile Management</Typography>
            <Alert severity="info">
              Profiles allow you to work with multiple repositories. Only one profile is active at a time.
              When creating a new profile, the app will automatically clone the repository. Switching profiles will restart the app.
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
                {profileCreating && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2">
                        Creating profile and cloning repository... This may take a few moments.
                      </Typography>
                    </Box>
                  </Alert>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Profile Name"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="My Notes Repo"
                    fullWidth
                    required
                    disabled={profileCreating}
                    helperText="A local folder will be automatically created based on this name"
                  />
                  <TextField
                    label="Remote URL"
                    value={newProfileRemoteUrl}
                    onChange={(e) => setNewProfileRemoteUrl(e.target.value)}
                    placeholder="https://github.com/user/repo.git"
                    fullWidth
                    required
                    disabled={profileCreating}
                  />
                  <TextField
                    label="Branch"
                    value={newProfileBranch}
                    onChange={(e) => setNewProfileBranch(e.target.value)}
                    placeholder="main"
                    fullWidth
                    required
                    disabled={profileCreating}
                  />
                  <TextField
                    label="Personal Access Token"
                    type="password"
                    value={newProfilePat}
                    onChange={(e) => setNewProfilePat(e.target.value)}
                    placeholder="ghp_..."
                    fullWidth
                    required
                    disabled={profileCreating}
                    helperText="Your Personal Access Token is stored encrypted"
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleCreateProfile}
                      disabled={profileCreating}
                    >
                      {profileCreating ? 'Creating...' : 'Create Profile'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setCreatingProfile(false);
                        setNewProfileName('');
                        setNewProfileRemoteUrl('');
                        setNewProfileBranch('main');
                        setNewProfilePat('');
                      }}
                      disabled={profileCreating}
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

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Application Logs</Typography>
            <Alert severity="info">
              View application logs for troubleshooting. Logs are stored locally and include Git operations, errors, and sync events.
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <ToggleButtonGroup
                value={logType}
                exclusive
                onChange={(_, newValue) => newValue && setLogType(newValue)}
                size="small"
              >
                <ToggleButton value="combined">Combined Logs</ToggleButton>
                <ToggleButton value="error">Error Logs</ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadLogs}
                disabled={loadingLogs}
                size="small"
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyLogs}
                disabled={!logContent || loadingLogs}
                size="small"
              >
                Copy to Clipboard
              </Button>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleExportLogs}
                disabled={!logContent || loadingLogs}
                size="small"
              >
                Export Logs
              </Button>
            </Box>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                maxHeight: '400px',
                overflow: 'auto',
                backgroundColor: 'background.default',
              }}
            >
              {loadingLogs ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Typography
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {logContent || 'No logs available'}
                </Typography>
              )}
            </Paper>
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

      <AboutDialog
        open={aboutDialogOpen}
        onClose={() => setAboutDialogOpen(false)}
      />

      <Snackbar
        open={copySnackbarOpen}
        autoHideDuration={2000}
        onClose={() => setCopySnackbarOpen(false)}
        message="Copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Dialog>
  );
}
