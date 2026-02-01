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
} from '@mui/material';
import {
  Info as InfoIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Check as CheckIcon,
  ContentCopy as ContentCopyIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { AboutDialog } from '../AboutDialog';
import type {
  /* FullConfig, */
  AppSettings,
  RepoSettings,
  Profile,
  RepoProviderType,
  GitRepoSettings,
  S3RepoSettings,
} from '../../../shared/types';
import { AuthMethod } from '../../../shared/types';
import { confirmProfileSwitch } from '../../utils/profileSwitch';
import { SETTINGS_TEXT } from './constants';
import { tabHeaderSx, alertSx } from './styles';
import type { TabPanelProps, SettingsDialogProps } from './types';

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

export function SettingsDialog({
  open,
  onClose,
  onThemeChange,
  onAppSettingsSaved,
  currentNoteContent,
  currentNotePath,
}: SettingsDialogProps) {
  const [tabValue, setTabValue] = useState(0);
  /* const [config, setConfig] = useState<FullConfig | null>(null); */
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
  const [newProfileProvider, setNewProfileProvider] = useState<RepoProviderType>('git');
  const [newProfileRemoteUrl, setNewProfileRemoteUrl] = useState('');
  const [newProfileBranch, setNewProfileBranch] = useState('main');
  const [newProfilePat, setNewProfilePat] = useState('');
  const [newProfileBucket, setNewProfileBucket] = useState('');
  const [newProfileRegion, setNewProfileRegion] = useState('');
  const [newProfilePrefix, setNewProfilePrefix] = useState('');
  const [newProfileAccessKeyId, setNewProfileAccessKeyId] = useState('');
  const [newProfileSecretAccessKey, setNewProfileSecretAccessKey] = useState('');
  const [newProfileSessionToken, setNewProfileSessionToken] = useState('');
  const [profileCreating, setProfileCreating] = useState(false);

  const [logsFolder, setLogsFolder] = useState<string>('');
  const [loadingLogsFolder, setLoadingLogsFolder] = useState(false);
  const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);
  const repoProvider: RepoProviderType = (repoSettings.provider as RepoProviderType) || 'git';
  const gitRepoSettings = repoSettings as Partial<GitRepoSettings>;
  const s3RepoSettings = repoSettings as Partial<S3RepoSettings>;

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
        /* setConfig(response.data); */
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
        if (onAppSettingsSaved) {
          onAppSettingsSaved(appSettings);
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
      let settingsToSave: RepoSettings;

      if (repoProvider === 'git') {
        const gitSettings = repoSettings as Partial<GitRepoSettings>;
        if (!gitSettings.remoteUrl || !gitSettings.branch || !gitSettings.pat) {
          setError('Please fill in all required Git fields');
          setLoading(false);
          return;
        }

        settingsToSave = {
          provider: 'git',
          remoteUrl: gitSettings.remoteUrl,
          branch: gitSettings.branch,
          localPath: gitSettings.localPath || '',
          pat: gitSettings.pat,
          authMethod: gitSettings.authMethod ?? AuthMethod.PAT,
        };
      } else {
        const s3Settings = repoSettings as Partial<S3RepoSettings>;
        if (!s3Settings.bucket || !s3Settings.region || !s3Settings.accessKeyId || !s3Settings.secretAccessKey) {
          setError('Please fill in all required S3 fields');
          setLoading(false);
          return;
        }

        settingsToSave = {
          provider: 's3',
          bucket: s3Settings.bucket,
          region: s3Settings.region,
          prefix: s3Settings.prefix,
          localPath: s3Settings.localPath || '',
          accessKeyId: s3Settings.accessKeyId,
          secretAccessKey: s3Settings.secretAccessKey,
          sessionToken: s3Settings.sessionToken,
        };
      }

      const response = await window.notegitApi.config.updateRepoSettings(settingsToSave);

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

  const handleSelectProfile = async (profileId: string, profileName: string) => {
    if (profileId === activeProfileId) {
      return;
    }

    if (!confirmProfileSwitch(profileName, window.confirm)) {
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

    if (newProfileProvider === 'git') {
      if (!newProfileRemoteUrl || !newProfileBranch || !newProfilePat) {
        setError('All Git repository fields are required');
        return;
      }
    } else {
      if (!newProfileBucket || !newProfileRegion || !newProfileAccessKeyId || !newProfileSecretAccessKey) {
        setError('All S3 repository fields are required');
        return;
      }
    }

    setProfileCreating(true);
    setError(null);

    try {
      const repoSettings: Partial<RepoSettings> =
        newProfileProvider === 'git'
          ? {
            provider: 'git',
            remoteUrl: newProfileRemoteUrl,
            branch: newProfileBranch,
            pat: newProfilePat,
            authMethod: AuthMethod.PAT,
          }
          : {
            provider: 's3',
            bucket: newProfileBucket,
            region: newProfileRegion,
            prefix: newProfilePrefix,
            accessKeyId: newProfileAccessKeyId,
            secretAccessKey: newProfileSecretAccessKey,
            sessionToken: newProfileSessionToken,
          };

      const response = await window.notegitApi.config.createProfile(
        newProfileName.trim(),
        repoSettings
      );

      if (response.ok && response.data) {
        setSuccess('Profile created successfully');
        setProfiles([...profiles, response.data]);
        setCreatingProfile(false);
        setNewProfileName('');
        setNewProfileProvider('git');
        setNewProfileRemoteUrl('');
        setNewProfileBranch('main');
        setNewProfilePat('');
        setNewProfileBucket('');
        setNewProfileRegion('');
        setNewProfilePrefix('');
        setNewProfileAccessKeyId('');
        setNewProfileSecretAccessKey('');
        setNewProfileSessionToken('');
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

  const loadLogsFolder = React.useCallback(async () => {
    if (!open || tabValue !== 4) {
      return;
    }
    setLoadingLogsFolder(true);
    try {
      const response = await window.notegitApi.logs.getFolder();
      if (response.ok && response.data) {
        setLogsFolder(response.data);
      } else {
        setError(response.error?.message || 'Failed to load logs folder');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load logs folder');
    } finally {
      setLoadingLogsFolder(false);
    }
  }, [open, tabValue]);

  useEffect(() => {
    loadLogsFolder();
  }, [loadLogsFolder]);

  const handleCopyLogsFolder = () => {
    if (!logsFolder) {
      return;
    }
    navigator.clipboard.writeText(logsFolder);
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

  const handleOpenLogsFolder = async () => {
    if (!logsFolder) {
      return;
    }
    const { shell } = window.require('electron');
    await shell.openPath(logsFolder);
  };

  const getProfileSecondary = (profile: Profile): string => {
    if (profile.repoSettings.provider === 's3') {
      const prefix = profile.repoSettings.prefix ? `/${profile.repoSettings.prefix}` : '';
      return `s3://${profile.repoSettings.bucket}${prefix}`;
    }

    return profile.repoSettings.remoteUrl;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{SETTINGS_TEXT.title}</DialogTitle>
      <DialogContent>
        <Box sx={tabHeaderSx}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            {SETTINGS_TEXT.tabs.map((label) => (
              <Tab key={label} label={label} />
            ))}
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={alertSx} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={alertSx} onClose={() => setSuccess(null)}>
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

              {repoProvider === 's3' && (
                <>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={appSettings.s3AutoSyncEnabled}
                        onChange={(e) =>
                          setAppSettings({
                            ...appSettings,
                            s3AutoSyncEnabled: e.target.checked,
                          })
                        }
                      />
                    }
                    label="Enable S3 Auto Sync"
                  />

                  {appSettings.s3AutoSyncEnabled && (
                    <TextField
                      label="S3 Auto Sync (in seconds)"
                      type="number"
                      value={appSettings.s3AutoSyncIntervalSec}
                      onChange={(e) =>
                        setAppSettings({
                          ...appSettings,
                          s3AutoSyncIntervalSec: parseInt(e.target.value),
                        })
                      }
                      InputProps={{ inputProps: { min: 5, max: 3600 } }}
                    />
                  )}
                </>
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
              label="Repository Type"
              value={repoProvider === 'git' ? 'Git' : 'S3'}
              fullWidth
              InputProps={{
                readOnly: true,
              }}
              variant="filled"
            />

            {repoProvider === 'git' ? (
              <>
                <TextField
                  label="Remote URL"
                  value={gitRepoSettings.remoteUrl || ''}
                  onChange={(e) =>
                    setRepoSettings({
                      ...repoSettings,
                      provider: 'git',
                      remoteUrl: e.target.value,
                    })
                  }
                  placeholder="https://github.com/user/repo.git"
                  fullWidth
                  required
                />

                <TextField
                  label="Branch"
                  value={gitRepoSettings.branch || ''}
                  onChange={(e) =>
                    setRepoSettings({
                      ...repoSettings,
                      provider: 'git',
                      branch: e.target.value,
                    })
                  }
                  placeholder="main"
                  fullWidth
                  required
                />

                <TextField
                  label="Personal Access Token"
                  type="password"
                  value={gitRepoSettings.pat || ''}
                  onChange={(e) =>
                    setRepoSettings({
                      ...repoSettings,
                      provider: 'git',
                      pat: e.target.value,
                    })
                  }
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
              </>
            ) : (
              <>
                <TextField
                  label="Bucket"
                  value={s3RepoSettings.bucket || ''}
                  onChange={(e) =>
                    setRepoSettings({
                      ...repoSettings,
                      provider: 's3',
                      bucket: e.target.value,
                    })
                  }
                  placeholder="my-notes-bucket"
                  fullWidth
                  required
                />

                <TextField
                  label="Region"
                  value={s3RepoSettings.region || ''}
                  onChange={(e) =>
                    setRepoSettings({
                      ...repoSettings,
                      provider: 's3',
                      region: e.target.value,
                    })
                  }
                  placeholder="us-east-1"
                  fullWidth
                  required
                />

                <TextField
                  label="Prefix (optional)"
                  value={s3RepoSettings.prefix || ''}
                  onChange={(e) =>
                    setRepoSettings({
                      ...repoSettings,
                      provider: 's3',
                      prefix: e.target.value,
                    })
                  }
                  placeholder="notes/"
                  fullWidth
                />

                <TextField
                  label="Access Key ID"
                  value={s3RepoSettings.accessKeyId || ''}
                  onChange={(e) =>
                    setRepoSettings({
                      ...repoSettings,
                      provider: 's3',
                      accessKeyId: e.target.value,
                    })
                  }
                  fullWidth
                  required
                />

                <TextField
                  label="Secret Access Key"
                  type="password"
                  value={s3RepoSettings.secretAccessKey || ''}
                  onChange={(e) =>
                    setRepoSettings({
                      ...repoSettings,
                      provider: 's3',
                      secretAccessKey: e.target.value,
                    })
                  }
                  fullWidth
                  required
                  helperText="Stored encrypted in the app's data directory."
                />

                <TextField
                  label="Session Token (optional)"
                  type="password"
                  value={s3RepoSettings.sessionToken || ''}
                  onChange={(e) =>
                    setRepoSettings({
                      ...repoSettings,
                      provider: 's3',
                      sessionToken: e.target.value,
                    })
                  }
                  fullWidth
                />

                <Alert severity="info">
                  <Typography variant="body2">
                    The S3 bucket must have versioning enabled to support history.
                  </Typography>
                </Alert>
              </>
            )}

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
              When creating a new profile, the app will automatically sync the repository. Switching profiles will restart the app.
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
                    onClick={() => handleSelectProfile(profile.id, profile.name)}
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
                      secondary={getProfileSecondary(profile)}
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
                        Creating profile and syncing repository... This may take a few moments.
                      </Typography>
                    </Box>
                  </Alert>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Repository type
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      value={newProfileProvider}
                      onChange={(_, value) => value && setNewProfileProvider(value)}
                      size="small"
                    >
                      <ToggleButton value="git">Git</ToggleButton>
                      <ToggleButton value="s3">S3</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
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

                  {newProfileProvider === 'git' ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <TextField
                        label="Bucket"
                        value={newProfileBucket}
                        onChange={(e) => setNewProfileBucket(e.target.value)}
                        placeholder="my-notes-bucket"
                        fullWidth
                        required
                        disabled={profileCreating}
                      />
                      <TextField
                        label="Region"
                        value={newProfileRegion}
                        onChange={(e) => setNewProfileRegion(e.target.value)}
                        placeholder="us-east-1"
                        fullWidth
                        required
                        disabled={profileCreating}
                      />
                      <TextField
                        label="Prefix (optional)"
                        value={newProfilePrefix}
                        onChange={(e) => setNewProfilePrefix(e.target.value)}
                        placeholder="notes/"
                        fullWidth
                        disabled={profileCreating}
                      />
                      <TextField
                        label="Access Key ID"
                        value={newProfileAccessKeyId}
                        onChange={(e) => setNewProfileAccessKeyId(e.target.value)}
                        fullWidth
                        required
                        disabled={profileCreating}
                      />
                      <TextField
                        label="Secret Access Key"
                        type="password"
                        value={newProfileSecretAccessKey}
                        onChange={(e) => setNewProfileSecretAccessKey(e.target.value)}
                        fullWidth
                        required
                        disabled={profileCreating}
                        helperText="Stored encrypted in the app's data directory."
                      />
                      <TextField
                        label="Session Token (optional)"
                        type="password"
                        value={newProfileSessionToken}
                        onChange={(e) => setNewProfileSessionToken(e.target.value)}
                        fullWidth
                        disabled={profileCreating}
                      />
                    </>
                  )}
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
                        setNewProfileProvider('git');
                        setNewProfileRemoteUrl('');
                        setNewProfileBranch('main');
                        setNewProfilePat('');
                        setNewProfileBucket('');
                        setNewProfileRegion('');
                        setNewProfilePrefix('');
                        setNewProfileAccessKeyId('');
                        setNewProfileSecretAccessKey('');
                        setNewProfileSessionToken('');
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
              Logs are stored locally by day and include Git/S3 operations, errors, and sync events.
            </Alert>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                label="Logs Folder"
                value={logsFolder}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <Button
                variant="outlined"
                startIcon={<FolderOpenIcon />}
                onClick={handleOpenLogsFolder}
                disabled={!logsFolder || loadingLogsFolder}
              >
                Open Folder
              </Button>
              <IconButton
                aria-label="copy logs folder"
                onClick={handleCopyLogsFolder}
                disabled={!logsFolder || loadingLogsFolder}
              >
                <ContentCopyIcon />
              </IconButton>
            </Box>
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
