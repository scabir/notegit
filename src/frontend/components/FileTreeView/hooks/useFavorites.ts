import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import type { FileTreeNode } from '../../../../shared/types';
import { FAVORITES_STORAGE_KEY } from '../constants';
import { findNodeByPath } from '../utils';
import type { FavoriteMenuState } from '../types';

export function useFavorites(tree: FileTreeNode[], selectedNode: FileTreeNode | null) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteMenuState, setFavoriteMenuState] = useState<FavoriteMenuState | null>(null);
  const configApi =
    typeof window !== 'undefined' ? window.notegitApi?.config : undefined;
  const hasFavoritesApi = Boolean(configApi?.getFavorites && configApi?.updateFavorites);
  const configApiRef = useRef(configApi);
  useEffect(() => {
    configApiRef.current = configApi;
  }, [configApi]);

  const persistFavorites = useCallback(
    (next: string[]) => {
      const api = configApiRef.current;
      if (hasFavoritesApi && api?.updateFavorites) {
        api.updateFavorites(next).catch((error) => {
          console.error('Failed to persist favorites', error);
        });
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
        } catch (error) {
          console.error('Failed to persist favorites to localStorage', error);
        }
      }
    },
    [hasFavoritesApi]
  );

  useEffect(() => {
    const loadFavorites = async () => {
      if (hasFavoritesApi && configApi?.getFavorites) {
        try {
          const response = await configApi.getFavorites();
          if (response.ok && response.data) {
            setFavorites(response.data);
            return;
          }
        } catch (error) {
          console.error('Failed to load favorites', error);
        }
      }

      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              setFavorites(parsed.filter((entry) => typeof entry === 'string'));
              return;
            }
          } catch {
            // ignore invalid JSON
          }
        }
      }

      setFavorites([]);
    };

    loadFavorites();
  }, [configApi, hasFavoritesApi]);

  useEffect(() => {
    setFavorites((prev) => {
      const filtered = prev.filter((path) => Boolean(findNodeByPath(tree, path)));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [tree]);

  const favoriteNodes = useMemo(
    () =>
      favorites
        .map((path) => findNodeByPath(tree, path))
        .filter((node): node is FileTreeNode => Boolean(node)),
    [favorites, tree]
  );

  const toggleFavorite = (node?: FileTreeNode) => {
    const targetNode = node ?? selectedNode;
    if (!targetNode) return;

    setFavorites((prev) => {
      const exists = prev.includes(targetNode.path);
      const next = exists
        ? prev.filter((path) => path !== targetNode.path)
        : [...prev, targetNode.path];
      if (next !== prev) {
        persistFavorites(next);
      }
      return next;
    });
  };

  const selectedNodeIsFavorite = Boolean(selectedNode && favorites.includes(selectedNode.path));

  const handleFavoriteContextMenu = (event: MouseEvent<HTMLElement>, path: string) => {
    event.preventDefault();
    setFavoriteMenuState({
      anchorEl: event.currentTarget,
      path,
    });
  };

  const handleCloseFavoriteMenu = () => {
    setFavoriteMenuState(null);
  };

  const handleRemoveFavorite = () => {
    if (!favoriteMenuState?.path) return;
    setFavorites((prev) => {
      const next = prev.filter((path) => path !== favoriteMenuState.path);
      if (next.length !== prev.length) {
        persistFavorites(next);
      }
      return next;
    });
    handleCloseFavoriteMenu();
  };

  const updateFavoritesForPathChange = (oldPath: string, newPath: string) => {
    setFavorites((prev) => {
      let updated = false;
      const newValues = prev.map((path) => {
        if (path === oldPath) {
          updated = true;
          return newPath;
        }
        if (path.startsWith(`${oldPath}/`)) {
          updated = true;
          return path.replace(oldPath, newPath);
        }
        return path;
      });
      if (updated) {
        persistFavorites(newValues);
        return newValues;
      }
      return prev;
    });
  };

  const removeFavoritesUnderPath = (pathToRemove: string) => {
    setFavorites((prev) => {
      const filtered = prev.filter(
        (path) => path !== pathToRemove && !path.startsWith(`${pathToRemove}/`)
      );
      if (filtered.length === prev.length) {
        return prev;
      }
      persistFavorites(filtered);
      return filtered;
    });
  };

  return {
    favoriteNodes,
    favoriteMenuState,
    toggleFavorite,
    handleFavoriteContextMenu,
    handleCloseFavoriteMenu,
    handleRemoveFavorite,
    selectedNodeIsFavorite,
    updateFavoritesForPathChange,
    removeFavoritesUnderPath,
  };
}
