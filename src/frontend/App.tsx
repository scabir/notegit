import React, { useState, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline, useMediaQuery } from '@mui/material';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { RepoSetupDialog } from './components/RepoSetupDialog';
import { Workspace } from './components/Workspace';

function App() {
  const [loading, setLoading] = useState(true);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [gitInstalled, setGitInstalled] = useState<boolean | null>(null);
  const [hasRepo, setHasRepo] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  const theme = useMemo(() => {
    const mode = themeMode === 'system' 
      ? (prefersDarkMode ? 'dark' : 'light')
      : themeMode;
      
    const lightBackground = {
      default: '#f5f6f8',
      paper: '#eef0f3',
    };

    return createTheme({
      palette: {
        mode,
        ...(mode === 'light'
          ? {
              background: lightBackground,
              divider: '#d7dbe2',
            }
          : {}),
      },
    });
  }, [themeMode, prefersDarkMode]);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    setLoading(true);

    try {
      const gitResponse = await window.notegitApi.config.checkGitInstalled();
      if (gitResponse.ok && gitResponse.data !== undefined) {
        setGitInstalled(gitResponse.data);
      }

      const configResponse = await window.notegitApi.config.getFull();
      if (configResponse.ok && configResponse.data?.repoSettings) {
        setHasRepo(true);
      } else {
        setHasRepo(false);
      }
      
      if (configResponse.ok && configResponse.data?.appSettings?.theme) {
        setThemeMode(configResponse.data.appSettings.theme as 'light' | 'dark' | 'system');
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setThemeMode(newTheme);
    
    try {
      await window.notegitApi.config.updateAppSettings({ theme: newTheme });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const handleRepoSetupSuccess = () => {
    setHasRepo(true);
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  if (gitInstalled === false) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: 2,
            p: 3,
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom>
            notegit
          </Typography>
          <Alert severity="error" sx={{ maxWidth: 600 }}>
            <Typography variant="body2">
              Git is not installed on your system. Please install Git to use notegit.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Visit{' '}
              <a
                href="https://git-scm.com/downloads"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://git-scm.com/downloads
              </a>{' '}
              to download Git.
            </Typography>
          </Alert>
        </Box>
      </ThemeProvider>
    );
  }

  if (!hasRepo) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: 2,
            p: 3,
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom>
            notegit
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Git-backed Markdown note-taking application
          </Typography>

          <Alert severity="info" sx={{ maxWidth: 600, mt: 2 }}>
            <Typography variant="body2">
              Welcome to notegit! To get started, connect to a Git repository.
            </Typography>
          </Alert>

          <Button
            variant="contained"
            onClick={() => setSetupDialogOpen(true)}
            sx={{ mt: 2 }}
            size="large"
          >
            Connect to Repository
          </Button>

          <RepoSetupDialog
            open={setupDialogOpen}
            onClose={() => setSetupDialogOpen(false)}
            onSuccess={handleRepoSetupSuccess}
          />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Workspace onThemeChange={handleThemeChange} />
    </ThemeProvider>
  );
}

export default App;
