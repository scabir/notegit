import { useCallback, useEffect, useState } from "react";
import type { AppSettings, FileContent } from "../../../../shared/types";

type UseMarkdownDocumentStateParams = {
  file: FileContent | null;
  onSave: (content: string) => void;
  onChange: (content: string, hasChanges: boolean) => void;
};

export function useMarkdownDocumentState({
  file,
  onSave,
  onChange,
}: UseMarkdownDocumentStateParams) {
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const response = await window.notegitApi.config.getAppSettings();
      if (response.ok && response.data) {
        setAppSettings(response.data);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!file) return;
    setContent(file.content);
    setSavedContent(file.content);
  }, [file]);

  const hasUnsavedChanges = content !== savedContent;

  useEffect(() => {
    onChange(content, hasUnsavedChanges);
  }, [content, hasUnsavedChanges, onChange]);

  const handleSave = useCallback(() => {
    if (!hasUnsavedChanges) return;
    onSave(content);
    setSavedContent(content);
  }, [content, hasUnsavedChanges, onSave]);

  const handleExport = useCallback(async () => {
    if (!file) return;

    try {
      const response = await window.notegitApi.export.note(
        file.path,
        content,
        "md",
      );
      if (response.ok && response.data) {
        console.log("Note exported to:", response.data);
      } else if (response.error?.message !== "Export cancelled") {
        console.error("Failed to export note:", response.error);
        alert(
          `Failed to export: ${response.error?.message || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export note");
    }
  }, [content, file]);

  return {
    appSettings,
    content,
    setContent,
    hasUnsavedChanges,
    handleSave,
    handleExport,
  };
}
