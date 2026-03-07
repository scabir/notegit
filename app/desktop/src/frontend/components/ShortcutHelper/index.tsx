import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
} from "react";
import { IconButton, Tooltip, Menu, Box, Typography } from "@mui/material";
import { QuestionMarkRounded as HelpIcon } from "@mui/icons-material";
import { useI18n } from "../../i18n";
import {
  buildShortcutHelperSections,
  buildShortcutHelperText,
} from "./constants";
import {
  shortcutMenuSx,
  shortcutSectionSx,
  shortcutRowSx,
  shortcutKeySx,
} from "./styles";

export type ShortcutHelperHandle = {
  openMenu: (anchor?: HTMLElement | null) => void;
};

export const ShortcutHelper = React.forwardRef<ShortcutHelperHandle>(
  (_props, ref) => {
    const { t } = useI18n();
    const text = React.useMemo(() => buildShortcutHelperText(t), [t]);
    const sections = React.useMemo(() => buildShortcutHelperSections(t), [t]);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const fallbackRef = useRef<HTMLElement | null>(null);

    const openMenu = useCallback((anchor?: HTMLElement | null) => {
      const resolvedAnchor = anchor || buttonRef.current || fallbackRef.current;
      if (resolvedAnchor) {
        setAnchorEl(resolvedAnchor);
      }
    }, []);

    const closeMenu = useCallback(() => {
      setAnchorEl(null);
    }, []);

    useEffect(() => {
      if (!fallbackRef.current) {
        fallbackRef.current = {} as HTMLElement;
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        openMenu,
      }),
      [openMenu],
    );

    return (
      <>
        <Tooltip title={t("editorShell.tooltips.shortcuts")}>
          <IconButton
            size="small"
            ref={buttonRef}
            onClick={(event) => openMenu(event.currentTarget)}
          >
            <HelpIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <span
          ref={fallbackRef}
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            overflow: "hidden",
          }}
        />
        <Menu
          id="shortcut-helper-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={closeMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          MenuListProps={{ sx: { p: 0 } }}
        >
          <Box sx={shortcutMenuSx}>
            <Typography variant="subtitle1">{text.title}</Typography>
            {sections.map((section) => (
              <Box key={section.title} sx={shortcutSectionSx}>
                <Typography variant="subtitle2" color="text.secondary">
                  {section.title}
                </Typography>
                {section.shortcuts.map((shortcut) => (
                  <Box
                    key={`${shortcut.label}-${shortcut.keys}`}
                    sx={shortcutRowSx}
                  >
                    <Typography variant="body2">{shortcut.label}</Typography>
                    <Typography variant="body2" sx={shortcutKeySx}>
                      {shortcut.keys}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ))}
            <Typography variant="caption" color="text.secondary">
              {text.footer}
            </Typography>
          </Box>
        </Menu>
      </>
    );
  },
);

ShortcutHelper.displayName = "ShortcutHelper";
