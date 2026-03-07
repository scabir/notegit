import React from "react";
import { Box, Tooltip, Button, Typography } from "@mui/material";
import { favoritesSectionSx, favoriteListSx, favoriteItemSx } from "./styles";
import type { FileTreeFavoritesBarProps } from "./types";

export function FavoritesBar({
  title,
  favorites,
  onSelect,
  onContextMenu,
}: FileTreeFavoritesBarProps) {
  if (favorites.length === 0) {
    return null;
  }

  return (
    <Box sx={favoritesSectionSx} data-testid="favorites-section">
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Box sx={favoriteListSx}>
        {favorites.map((node) => (
          <Tooltip key={node.path} title={node.path} placement="top" arrow>
            <Button
              size="small"
              variant="text"
              disableRipple
              sx={favoriteItemSx}
              onClick={() => onSelect(node)}
              onContextMenu={(event) => onContextMenu(event, node.path)}
            >
              {node.name}
            </Button>
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
}
