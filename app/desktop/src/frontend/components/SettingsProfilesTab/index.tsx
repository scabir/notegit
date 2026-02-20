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
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6">Profile Management</Typography>
      <Alert severity="info">
        Profiles allow you to work with multiple repositories. Only one profile
        is active at a time. When creating a new profile, the app will prepare
        the repository. Switching profiles will restart the app.
      </Alert>

      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Active Profile
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
                  aria-label="delete"
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
                        label="Active"
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
          Create New Profile
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
            New Profile
          </Typography>
          {profileCreating && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">
                  Creating profile and preparing repository... This may take a
                  few moments.
                </Typography>
              </Box>
            </Alert>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Repository type
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={newProfileProvider}
                onChange={(_, value) => value && onSetNewProfileProvider(value)}
                size="small"
              >
                <ToggleButton value={REPO_PROVIDERS.git}>Git</ToggleButton>
                <ToggleButton value={REPO_PROVIDERS.s3}>S3</ToggleButton>
                <ToggleButton value={REPO_PROVIDERS.local}>Local</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <TextField
              label="Profile Name"
              value={newProfileName}
              onChange={(e) => onSetNewProfileName(e.target.value)}
              placeholder="My Notes Repo"
              fullWidth
              required
              disabled={profileCreating}
              helperText="A local folder will be automatically created based on this name"
            />

            {newProfileProvider === REPO_PROVIDERS.git ? (
              <>
                <TextField
                  label="Remote URL"
                  value={newProfileRemoteUrl}
                  onChange={(e) => onSetNewProfileRemoteUrl(e.target.value)}
                  placeholder="https://github.com/user/repo.git"
                  fullWidth
                  required
                  disabled={profileCreating}
                />
                <TextField
                  label="Branch"
                  value={newProfileBranch}
                  onChange={(e) => onSetNewProfileBranch(e.target.value)}
                  placeholder="main"
                  fullWidth
                  required
                  disabled={profileCreating}
                />
                <TextField
                  label="Personal Access Token"
                  type="password"
                  value={newProfilePat}
                  onChange={(e) => onSetNewProfilePat(e.target.value)}
                  placeholder="ghp_..."
                  fullWidth
                  required
                  disabled={profileCreating}
                  helperText="Your Personal Access Token is stored encrypted"
                />
              </>
            ) : newProfileProvider === REPO_PROVIDERS.s3 ? (
              <>
                <TextField
                  label="Bucket"
                  value={newProfileBucket}
                  onChange={(e) => onSetNewProfileBucket(e.target.value)}
                  placeholder="my-notes-bucket"
                  fullWidth
                  required
                  disabled={profileCreating}
                />
                <TextField
                  label="Region"
                  value={newProfileRegion}
                  onChange={(e) => onSetNewProfileRegion(e.target.value)}
                  placeholder="us-east-1"
                  fullWidth
                  required
                  disabled={profileCreating}
                />
                <TextField
                  label="Prefix (optional)"
                  value={newProfilePrefix}
                  onChange={(e) => onSetNewProfilePrefix(e.target.value)}
                  placeholder="notes/"
                  fullWidth
                  disabled={profileCreating}
                />
                <TextField
                  label="Access Key ID"
                  value={newProfileAccessKeyId}
                  onChange={(e) => onSetNewProfileAccessKeyId(e.target.value)}
                  fullWidth
                  required
                  disabled={profileCreating}
                />
                <TextField
                  label="Secret Access Key"
                  type="password"
                  value={newProfileSecretAccessKey}
                  onChange={(e) =>
                    onSetNewProfileSecretAccessKey(e.target.value)
                  }
                  fullWidth
                  required
                  disabled={profileCreating}
                  helperText="Stored encrypted in the app's data directory."
                />
                <TextField
                  label="Session Token (optional)"
                  type="password"
                  value={newProfileSessionToken}
                  onChange={(e) => onSetNewProfileSessionToken(e.target.value)}
                  fullWidth
                  disabled={profileCreating}
                />
              </>
            ) : (
              <Alert severity="info">
                Local repositories are stored on this device only and do not
                sync.
              </Alert>
            )}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                onClick={onCreateProfile}
                disabled={profileCreating}
              >
                {profileCreating ? "Creating..." : "Create Profile"}
              </Button>
              <Button
                variant="outlined"
                onClick={onCancelCreateProfile}
                disabled={profileCreating}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
