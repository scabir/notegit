import type { Profile, RepoProviderType } from "../../../shared/types";

export interface SettingsProfilesTabProps {
  profiles: Profile[];
  activeProfileId: string | null;
  loading: boolean;
  creatingProfile: boolean;
  profileCreating: boolean;
  newProfileProvider: RepoProviderType;
  newProfileName: string;
  newProfileRemoteUrl: string;
  newProfileBranch: string;
  newProfilePat: string;
  newProfileBucket: string;
  newProfileRegion: string;
  newProfilePrefix: string;
  newProfileAccessKeyId: string;
  newProfileSecretAccessKey: string;
  newProfileSessionToken: string;
  onSetCreatingProfile: (value: boolean) => void;
  onSetNewProfileProvider: (provider: RepoProviderType) => void;
  onSetNewProfileName: (value: string) => void;
  onSetNewProfileRemoteUrl: (value: string) => void;
  onSetNewProfileBranch: (value: string) => void;
  onSetNewProfilePat: (value: string) => void;
  onSetNewProfileBucket: (value: string) => void;
  onSetNewProfileRegion: (value: string) => void;
  onSetNewProfilePrefix: (value: string) => void;
  onSetNewProfileAccessKeyId: (value: string) => void;
  onSetNewProfileSecretAccessKey: (value: string) => void;
  onSetNewProfileSessionToken: (value: string) => void;
  onSelectProfile: (profileId: string, profileName: string) => void;
  onDeleteProfile: (profileId: string) => void;
  onCreateProfile: () => void;
  onCancelCreateProfile: () => void;
  getProfileSecondary: (profile: Profile) => string;
}
