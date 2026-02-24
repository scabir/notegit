import React from "react";
import {
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Chip,
  Button,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { REPO_PROVIDERS } from "../../../shared/types";
import { useI18n } from "../../i18n";
import type { SettingsProfilesTabProps } from "./types";

export function SettingsProfilesTab({
  profiles,
  activeProfileId,
  loading,
  creatingProfile,
  profileCreating,
  newProfileProvider,
  newProfileName,
  newProfileRemoteUrl,
  newProfileBranch,
  newProfilePat,
  newProfileBucket,
  newProfileRegion,
  newProfilePrefix,
  newProfileAccessKeyId,
  newProfileSecretAccessKey,
  newProfileSessionToken,
  onSetCreatingProfile,
  onSetNewProfileProvider,
  onSetNewProfileName,
  onSetNewProfileRemoteUrl,
  onSetNewProfileBranch,
  onSetNewProfilePat,
  onSetNewProfileBucket,
  onSetNewProfileRegion,
  onSetNewProfilePrefix,
  onSetNewProfileAccessKeyId,
  onSetNewProfileSecretAccessKey,
  onSetNewProfileSessionToken,
  onSelectProfile,
  onDeleteProfile,
  onCreateProfile,
  onCancelCreateProfile,
  getProfileSecondary,
}: SettingsProfilesTabProps) {
  const { t } = useI18n();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6">
        {t("settingsProfilesTab.profileManagementTitle")}
      </Typography>
      <Alert severity="info">{t("settingsProfilesTab.info")}</Alert>

      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        {t("settingsProfilesTab.activeProfileTitle")}
      </Typography>
      <List>
        {profiles.map((profile) => (
          <ListItem
            key={profile.id}
            secondaryAction={
              profiles.length > 1 &&
              profile.id !== activeProfileId && (
                <IconButton
                  edge="end"
                  aria-label={t("settingsProfilesTab.deleteAriaLabel")}
                  onClick={() => onDeleteProfile(profile.id)}
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
              onClick={() => onSelectProfile(profile.id, profile.name)}
              disabled={loading || profile.id === activeProfileId}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {profile.name}
                    {profile.id === activeProfileId && (
                      <Chip
                        label={t("settingsProfilesTab.activeChipLabel")}
                        size="small"
                        color="primary"
                        icon={<CheckIcon />}
                      />
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
          onClick={() => onSetCreatingProfile(true)}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {t("settingsProfilesTab.createNewProfileButton")}
        </Button>
      ) : (
        <Box
          sx={{
            mt: 2,
            p: 2,
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {t("settingsProfilesTab.newProfileTitle")}
          </Typography>
          {profileCreating && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">
                  {t("settingsProfilesTab.creatingProfileMessage")}
                </Typography>
              </Box>
            </Alert>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("settingsProfilesTab.repositoryTypeLabel")}
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={newProfileProvider}
                onChange={(_, value) => value && onSetNewProfileProvider(value)}
                size="small"
              >
                <ToggleButton value={REPO_PROVIDERS.git}>
                  {t("settingsProfilesTab.repoType.git")}
                </ToggleButton>
                <ToggleButton value={REPO_PROVIDERS.s3}>
                  {t("settingsProfilesTab.repoType.s3")}
                </ToggleButton>
                <ToggleButton value={REPO_PROVIDERS.local}>
                  {t("settingsProfilesTab.repoType.local")}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <TextField
              label={t("settingsProfilesTab.profileNameLabel")}
              value={newProfileName}
              onChange={(e) => onSetNewProfileName(e.target.value)}
              placeholder={t("settingsProfilesTab.profileNamePlaceholder")}
              fullWidth
              required
              disabled={profileCreating}
              helperText={t("settingsProfilesTab.profileNameHelper")}
            />

            {newProfileProvider === REPO_PROVIDERS.git ? (
              <>
                <TextField
                  label={t("settingsProfilesTab.git.remoteUrlLabel")}
                  value={newProfileRemoteUrl}
                  onChange={(e) => onSetNewProfileRemoteUrl(e.target.value)}
                  placeholder={t(
                    "settingsProfilesTab.git.remoteUrlPlaceholder",
                  )}
                  fullWidth
                  required
                  disabled={profileCreating}
                />
                <TextField
                  label={t("settingsProfilesTab.git.branchLabel")}
                  value={newProfileBranch}
                  onChange={(e) => onSetNewProfileBranch(e.target.value)}
                  placeholder={t("settingsProfilesTab.git.branchPlaceholder")}
                  fullWidth
                  required
                  disabled={profileCreating}
                />
                <TextField
                  label={t("settingsProfilesTab.git.patLabel")}
                  type="password"
                  value={newProfilePat}
                  onChange={(e) => onSetNewProfilePat(e.target.value)}
                  placeholder={t("settingsProfilesTab.git.patPlaceholder")}
                  fullWidth
                  required
                  disabled={profileCreating}
                  helperText={t("settingsProfilesTab.git.patHelperText")}
                />
              </>
            ) : newProfileProvider === REPO_PROVIDERS.s3 ? (
              <>
                <TextField
                  label={t("settingsProfilesTab.s3.bucketLabel")}
                  value={newProfileBucket}
                  onChange={(e) => onSetNewProfileBucket(e.target.value)}
                  placeholder={t("settingsProfilesTab.s3.bucketPlaceholder")}
                  fullWidth
                  required
                  disabled={profileCreating}
                />
                <TextField
                  label={t("settingsProfilesTab.s3.regionLabel")}
                  value={newProfileRegion}
                  onChange={(e) => onSetNewProfileRegion(e.target.value)}
                  placeholder={t("settingsProfilesTab.s3.regionPlaceholder")}
                  fullWidth
                  required
                  disabled={profileCreating}
                />
                <TextField
                  label={t("settingsProfilesTab.s3.prefixLabel")}
                  value={newProfilePrefix}
                  onChange={(e) => onSetNewProfilePrefix(e.target.value)}
                  placeholder={t("settingsProfilesTab.s3.prefixPlaceholder")}
                  fullWidth
                  disabled={profileCreating}
                />
                <TextField
                  label={t("settingsProfilesTab.s3.accessKeyIdLabel")}
                  value={newProfileAccessKeyId}
                  onChange={(e) => onSetNewProfileAccessKeyId(e.target.value)}
                  fullWidth
                  required
                  disabled={profileCreating}
                />
                <TextField
                  label={t("settingsProfilesTab.s3.secretAccessKeyLabel")}
                  type="password"
                  value={newProfileSecretAccessKey}
                  onChange={(e) =>
                    onSetNewProfileSecretAccessKey(e.target.value)
                  }
                  fullWidth
                  required
                  disabled={profileCreating}
                  helperText={t(
                    "settingsProfilesTab.s3.secretAccessKeyHelperText",
                  )}
                />
                <TextField
                  label={t("settingsProfilesTab.s3.sessionTokenLabel")}
                  type="password"
                  value={newProfileSessionToken}
                  onChange={(e) => onSetNewProfileSessionToken(e.target.value)}
                  fullWidth
                  disabled={profileCreating}
                />
              </>
            ) : (
              <Alert severity="info">
                {t("settingsProfilesTab.local.info")}
              </Alert>
            )}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                onClick={onCreateProfile}
                disabled={profileCreating}
              >
                {profileCreating
                  ? t("settingsProfilesTab.creatingButton")
                  : t("settingsProfilesTab.createProfileButton")}
              </Button>
              <Button
                variant="outlined"
                onClick={onCancelCreateProfile}
                disabled={profileCreating}
              >
                {t("settingsProfilesTab.cancelButton")}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
