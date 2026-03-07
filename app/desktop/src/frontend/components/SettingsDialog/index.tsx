import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Tab,
  Tabs,
} from "@mui/material";
import type {
  AppSettings,
  GitRepoSettings,
  Profile,
  RepoProviderType,
  RepoSettings,
  S3RepoSettings,
} from "../../../shared/types";
import {
  AuthMethod,
  DEFAULT_APP_LANGUAGE,
  REPO_PROVIDERS,
} from "../../../shared/types";
import { SettingsAppSettingsTab } from "../SettingsAppSettingsTab";
import { SettingsExportTab } from "../SettingsExportTab";
import { SettingsLogsTab } from "../SettingsLogsTab";
import { SettingsProfilesTab } from "../SettingsProfilesTab";
import { SettingsRepositoryTab } from "../SettingsRepositoryTab";
import { useI18n } from "../../i18n";
import { SETTINGS_KEYS } from "./constants";
import { alertSx, tabHeaderSx } from "./styles";
import type { SettingsDialogProps, TabPanelProps } from "./types";

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
  const { t, reload } = useI18n();
  const [tabValue, setTabValue] = useState(0);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [repoSettings, setRepoSettings] = useState<Partial<RepoSettings>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileProvider, setNewProfileProvider] =
    useState<RepoProviderType>(REPO_PROVIDERS.git);
  const [newProfileRemoteUrl, setNewProfileRemoteUrl] = useState("");
  const [newProfileBranch, setNewProfileBranch] = useState("main");
  const [newProfilePat, setNewProfilePat] = useState("");
  const [newProfileBucket, setNewProfileBucket] = useState("");
  const [newProfileRegion, setNewProfileRegion] = useState("");
  const [newProfilePrefix, setNewProfilePrefix] = useState("");
  const [newProfileAccessKeyId, setNewProfileAccessKeyId] = useState("");
  const [newProfileSecretAccessKey, setNewProfileSecretAccessKey] =
    useState("");
  const [newProfileSessionToken, setNewProfileSessionToken] = useState("");
  const [profileCreating, setProfileCreating] = useState(false);

  const [logsFolder, setLogsFolder] = useState("");
  const [loadingLogsFolder, setLoadingLogsFolder] = useState(false);
  const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);
  const [supportedLocales, setSupportedLocales] = useState<string[]>([
    DEFAULT_APP_LANGUAGE,
  ]);

  const repoProvider: RepoProviderType =
    (repoSettings.provider as RepoProviderType) || REPO_PROVIDERS.git;
  const gitRepoSettings = repoSettings as Partial<GitRepoSettings>;
  const s3RepoSettings = repoSettings as Partial<S3RepoSettings>;
  const exportCancelledMessage = t(SETTINGS_KEYS.exportCancelledMessage);

  const resetNewProfileForm = () => {
    setNewProfileName("");
    setNewProfileProvider(REPO_PROVIDERS.git);
    setNewProfileRemoteUrl("");
    setNewProfileBranch("main");
    setNewProfilePat("");
    setNewProfileBucket("");
    setNewProfileRegion("");
    setNewProfilePrefix("");
    setNewProfileAccessKeyId("");
    setNewProfileSecretAccessKey("");
    setNewProfileSessionToken("");
  };

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const i18nMetaResponse = await window.notegitApi.i18n.getMeta();
      if (i18nMetaResponse.ok && i18nMetaResponse.data) {
        const locales = i18nMetaResponse.data.supportedLocales.filter(
          (locale) => locale && locale.trim().length > 0,
        );
        setSupportedLocales(
          locales.length > 0 ? locales : [DEFAULT_APP_LANGUAGE],
        );
      } else {
        setSupportedLocales([DEFAULT_APP_LANGUAGE]);
      }

      const response = await window.notegitApi.config.getFull();

      if (response.ok && response.data) {
        setAppSettings({
          ...response.data.appSettings,
          language: response.data.appSettings.language || DEFAULT_APP_LANGUAGE,
        });
        setRepoSettings(response.data.repoSettings || {});
        setProfiles(response.data.profiles || []);
        setActiveProfileId(response.data.activeProfileId || null);
      } else {
        setError(response.error?.message || t(SETTINGS_KEYS.failedLoadConfig));
      }
    } catch (err: any) {
      setError(err.message || t(SETTINGS_KEYS.failedLoadConfig));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (open) {
      void loadConfig();
    }
  }, [loadConfig, open]);

  const handleSaveAppSettings = async () => {
    if (!appSettings) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response =
        await window.notegitApi.config.updateAppSettings(appSettings);

      if (response.ok) {
        const selectedLanguage =
          appSettings.language?.trim() || DEFAULT_APP_LANGUAGE;
        const setLanguageResponse =
          await window.notegitApi.i18n.setLanguage(selectedLanguage);
        if (!setLanguageResponse.ok) {
          setError(
            setLanguageResponse.error?.message ||
              t(SETTINGS_KEYS.failedSetLanguage),
          );
          setLoading(false);
          return;
        }

        await reload();
        setSuccess(t(SETTINGS_KEYS.appSettingsSaved));
        if (onThemeChange) {
          onThemeChange(appSettings.theme);
        }
        if (onAppSettingsSaved) {
          onAppSettingsSaved(appSettings);
        }
      } else {
        setError(
          response.error?.message || t(SETTINGS_KEYS.failedSaveAppSettings),
        );
      }
    } catch (err: any) {
      setError(err.message || t(SETTINGS_KEYS.failedSaveAppSettings));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRepoSettings = async () => {
    if (repoProvider === REPO_PROVIDERS.local) {
      setError(null);
      setSuccess(t(SETTINGS_KEYS.localRepoNoSync));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let settingsToSave: RepoSettings;

      if (repoProvider === REPO_PROVIDERS.git) {
        const gitSettings = repoSettings as Partial<GitRepoSettings>;
        if (!gitSettings.remoteUrl || !gitSettings.branch || !gitSettings.pat) {
          setError(t(SETTINGS_KEYS.gitFieldsRequired));
          setLoading(false);
          return;
        }

        settingsToSave = {
          provider: REPO_PROVIDERS.git,
          remoteUrl: gitSettings.remoteUrl,
          branch: gitSettings.branch,
          localPath: gitSettings.localPath || "",
          pat: gitSettings.pat,
          authMethod: gitSettings.authMethod ?? AuthMethod.PAT,
        };
      } else {
        const s3Settings = repoSettings as Partial<S3RepoSettings>;
        if (
          !s3Settings.bucket ||
          !s3Settings.region ||
          !s3Settings.accessKeyId ||
          !s3Settings.secretAccessKey
        ) {
          setError(t(SETTINGS_KEYS.s3FieldsRequired));
          setLoading(false);
          return;
        }

        settingsToSave = {
          provider: REPO_PROVIDERS.s3,
          bucket: s3Settings.bucket,
          region: s3Settings.region,
          prefix: s3Settings.prefix,
          localPath: s3Settings.localPath || "",
          accessKeyId: s3Settings.accessKeyId,
          secretAccessKey: s3Settings.secretAccessKey,
          sessionToken: s3Settings.sessionToken,
        };
      }

      const response =
        await window.notegitApi.config.updateRepoSettings(settingsToSave);

      if (response.ok) {
        setSuccess(t(SETTINGS_KEYS.repoSettingsSaved));
      } else {
        setError(
          response.error?.message || t(SETTINGS_KEYS.failedSaveRepoSettings),
        );
      }
    } catch (err: any) {
      setError(err.message || t(SETTINGS_KEYS.failedSaveRepoSettings));
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(null);
  };

  const handleExportNote = async (format: "md" | "txt") => {
    if (!currentNoteContent || !currentNotePath) {
      setError(t(SETTINGS_KEYS.noOpenNote));
      return;
    }

    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await window.notegitApi.export.note(
        currentNotePath,
        currentNoteContent,
        format,
      );

      if (response.ok && response.data) {
        setSuccess(`${t(SETTINGS_KEYS.noteExportedPrefix)} ${response.data}`);
      } else if (response.error?.message !== exportCancelledMessage) {
        setError(response.error?.message || t(SETTINGS_KEYS.failedExportNote));
      }
    } catch (err: any) {
      setError(err.message || t(SETTINGS_KEYS.failedExportNote));
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
        setSuccess(
          `${t(SETTINGS_KEYS.repositoryExportedPrefix)} ${response.data}`,
        );
      } else if (response.error?.message !== exportCancelledMessage) {
        setError(
          response.error?.message || t(SETTINGS_KEYS.failedExportRepository),
        );
      }
    } catch (err: any) {
      setError(err.message || t(SETTINGS_KEYS.failedExportRepository));
    } finally {
      setExporting(false);
    }
  };

  const handleSelectProfile = async (
    profileId: string,
    profileName: string,
  ) => {
    if (profileId === activeProfileId) {
      return;
    }

    const displayName =
      profileName?.trim() || t(SETTINGS_KEYS.switchProfileFallbackName);
    const switchMessage = `${t(SETTINGS_KEYS.switchProfilePrefix)} "${displayName}"? ${t(SETTINGS_KEYS.switchProfileSuffix)}`;
    if (!window.confirm(switchMessage)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response =
        await window.notegitApi.config.setActiveProfile(profileId);

      if (response.ok) {
        setSuccess(t(SETTINGS_KEYS.profileSwitched));
        setTimeout(async () => {
          await window.notegitApi.config.restartApp();
        }, 1500);
      } else {
        setError(
          response.error?.message || t(SETTINGS_KEYS.failedSwitchProfile),
        );
      }
    } catch (err: any) {
      setError(err.message || t(SETTINGS_KEYS.failedSwitchProfile));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      setError(t(SETTINGS_KEYS.profileNameRequired));
      return;
    }

    if (newProfileProvider === REPO_PROVIDERS.git) {
      if (!newProfileRemoteUrl || !newProfileBranch || !newProfilePat) {
        setError(t(SETTINGS_KEYS.allGitFieldsRequired));
        return;
      }
    } else if (newProfileProvider === REPO_PROVIDERS.s3) {
      if (
        !newProfileBucket ||
        !newProfileRegion ||
        !newProfileAccessKeyId ||
        !newProfileSecretAccessKey
      ) {
        setError(t(SETTINGS_KEYS.allS3FieldsRequired));
        return;
      }
    }

    setProfileCreating(true);
    setError(null);

    try {
      const newRepoSettings: Partial<RepoSettings> =
        newProfileProvider === REPO_PROVIDERS.git
          ? {
              provider: REPO_PROVIDERS.git,
              remoteUrl: newProfileRemoteUrl,
              branch: newProfileBranch,
              pat: newProfilePat,
              authMethod: AuthMethod.PAT,
            }
          : newProfileProvider === REPO_PROVIDERS.s3
            ? {
                provider: REPO_PROVIDERS.s3,
                bucket: newProfileBucket,
                region: newProfileRegion,
                prefix: newProfilePrefix,
                accessKeyId: newProfileAccessKeyId,
                secretAccessKey: newProfileSecretAccessKey,
                sessionToken: newProfileSessionToken,
              }
            : {
                provider: REPO_PROVIDERS.local,
              };

      const response = await window.notegitApi.config.createProfile(
        newProfileName.trim(),
        newRepoSettings,
      );

      if (response.ok && response.data) {
        setSuccess(t(SETTINGS_KEYS.profileCreated));
        setProfiles([...profiles, response.data]);
        setCreatingProfile(false);
        resetNewProfileForm();
      } else {
        setError(
          response.error?.message || t(SETTINGS_KEYS.failedCreateProfile),
        );
      }
    } catch (err: any) {
      setError(err.message || t(SETTINGS_KEYS.failedCreateProfile));
    } finally {
      setProfileCreating(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm(t(SETTINGS_KEYS.deleteProfileConfirm))) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await window.notegitApi.config.deleteProfile(profileId);

      if (response.ok) {
        setSuccess(t(SETTINGS_KEYS.profileDeleted));
        setProfiles(profiles.filter((p) => p.id !== profileId));
        if (activeProfileId === profileId) {
          setActiveProfileId(null);
        }
      } else {
        setError(
          response.error?.message || t(SETTINGS_KEYS.failedDeleteProfile),
        );
      }
    } catch (err: any) {
      setError(err.message || t(SETTINGS_KEYS.failedDeleteProfile));
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
        setError(
          response.error?.message || t(SETTINGS_KEYS.failedLoadLogsFolder),
        );
      }
    } catch (err: any) {
      setError(err.message || t(SETTINGS_KEYS.failedLoadLogsFolder));
    } finally {
      setLoadingLogsFolder(false);
    }
  }, [open, t, tabValue]);

  useEffect(() => {
    void loadLogsFolder();
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

  const openFolderInExplorer = async (
    folderPath: string,
    fallbackMessage: string,
  ) => {
    const response = await window.notegitApi.dialog.openFolder(folderPath);
    if (!response.ok) {
      setError(response.error?.message || fallbackMessage);
    }
  };

  const handleOpenRepoFolder = async () => {
    if (repoSettings.localPath) {
      await openFolderInExplorer(
        repoSettings.localPath,
        t(SETTINGS_KEYS.failedOpenRepositoryFolder),
      );
    }
  };

  const handleOpenLogsFolder = async () => {
    if (!logsFolder) {
      return;
    }
    await openFolderInExplorer(
      logsFolder,
      t(SETTINGS_KEYS.failedOpenLogsFolder),
    );
  };

  const getProfileSecondary = (profile: Profile): string => {
    if (profile.repoSettings.provider === REPO_PROVIDERS.s3) {
      const prefix = profile.repoSettings.prefix
        ? `/${profile.repoSettings.prefix}`
        : "";
      return `s3://${profile.repoSettings.bucket}${prefix}`;
    }

    if (profile.repoSettings.provider === REPO_PROVIDERS.local) {
      return (
        profile.repoSettings.localPath ||
        t(SETTINGS_KEYS.localRepoSecondaryLabel)
      );
    }

    return profile.repoSettings.remoteUrl;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      data-testid="settings-dialog"
    >
      <DialogTitle data-testid="settings-dialog-title">
        {t(SETTINGS_KEYS.title)}
      </DialogTitle>
      <DialogContent>
        <Box sx={tabHeaderSx}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab
              data-testid="settings-tab-app-settings"
              label={t(SETTINGS_KEYS.tabAppSettings)}
            />
            <Tab label={t(SETTINGS_KEYS.tabRepository)} />
            <Tab label={t(SETTINGS_KEYS.tabProfiles)} />
            <Tab label={t(SETTINGS_KEYS.tabExport)} />
            <Tab label={t(SETTINGS_KEYS.tabLogs)} />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={alertSx} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={alertSx}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        <TabPanel value={tabValue} index={0}>
          <SettingsAppSettingsTab
            appSettings={appSettings}
            repoProvider={repoProvider}
            supportedLocales={supportedLocales}
            loading={loading}
            onAppSettingsChange={setAppSettings}
            onSaveAppSettings={() => {
              void handleSaveAppSettings();
            }}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <SettingsRepositoryTab
            repoProvider={repoProvider}
            repoSettings={repoSettings}
            gitRepoSettings={gitRepoSettings}
            s3RepoSettings={s3RepoSettings}
            loading={loading}
            onRepoSettingsChange={setRepoSettings}
            onSaveRepoSettings={() => {
              void handleSaveRepoSettings();
            }}
            onCopyRepoPath={handleCopyRepoPath}
            onOpenRepoFolder={() => {
              void handleOpenRepoFolder();
            }}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <SettingsProfilesTab
            profiles={profiles}
            activeProfileId={activeProfileId}
            loading={loading}
            creatingProfile={creatingProfile}
            profileCreating={profileCreating}
            newProfileProvider={newProfileProvider}
            newProfileName={newProfileName}
            newProfileRemoteUrl={newProfileRemoteUrl}
            newProfileBranch={newProfileBranch}
            newProfilePat={newProfilePat}
            newProfileBucket={newProfileBucket}
            newProfileRegion={newProfileRegion}
            newProfilePrefix={newProfilePrefix}
            newProfileAccessKeyId={newProfileAccessKeyId}
            newProfileSecretAccessKey={newProfileSecretAccessKey}
            newProfileSessionToken={newProfileSessionToken}
            onSetCreatingProfile={setCreatingProfile}
            onSetNewProfileProvider={setNewProfileProvider}
            onSetNewProfileName={setNewProfileName}
            onSetNewProfileRemoteUrl={setNewProfileRemoteUrl}
            onSetNewProfileBranch={setNewProfileBranch}
            onSetNewProfilePat={setNewProfilePat}
            onSetNewProfileBucket={setNewProfileBucket}
            onSetNewProfileRegion={setNewProfileRegion}
            onSetNewProfilePrefix={setNewProfilePrefix}
            onSetNewProfileAccessKeyId={setNewProfileAccessKeyId}
            onSetNewProfileSecretAccessKey={setNewProfileSecretAccessKey}
            onSetNewProfileSessionToken={setNewProfileSessionToken}
            onSelectProfile={(profileId, profileName) => {
              void handleSelectProfile(profileId, profileName);
            }}
            onDeleteProfile={(profileId) => {
              void handleDeleteProfile(profileId);
            }}
            onCreateProfile={() => {
              void handleCreateProfile();
            }}
            onCancelCreateProfile={() => {
              setCreatingProfile(false);
              resetNewProfileForm();
            }}
            getProfileSecondary={getProfileSecondary}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <SettingsExportTab
            currentNoteContent={currentNoteContent}
            exporting={exporting}
            onExportNote={(format) => {
              void handleExportNote(format);
            }}
            onExportRepoAsZip={() => {
              void handleExportRepoAsZip();
            }}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <SettingsLogsTab
            logsFolder={logsFolder}
            loadingLogsFolder={loadingLogsFolder}
            onOpenLogsFolder={() => {
              void handleOpenLogsFolder();
            }}
            onCopyLogsFolder={handleCopyLogsFolder}
          />
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "flex-end", px: 3 }}>
        <Button
          data-testid="settings-close-button"
          onClick={onClose}
          variant="contained"
        >
          {t(SETTINGS_KEYS.close)}
        </Button>
      </DialogActions>

      <Snackbar
        open={copySnackbarOpen}
        autoHideDuration={2000}
        onClose={() => setCopySnackbarOpen(false)}
        message={t(SETTINGS_KEYS.copySnackbar)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Dialog>
  );
}
