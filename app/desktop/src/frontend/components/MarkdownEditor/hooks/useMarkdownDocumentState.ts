import { useCallback, useEffect, useState } from "react";
import {
  EXPORT_CANCELLED_REASON,
  type AppSettings,
  type FileContent,
} from "../../../../shared/types";

type UseMarkdownDocumentStateParams = {
  file: FileContent | null;
  onSave: (content: string) => void;
  onChange: (content: string, hasChanges: boolean) => void;
  messages: {
    failedExport: (message: string) => string;
    failedExportNote: string;
    unknownError: string;
  };
};

export function useMarkdownDocumentState({
  file,
  onSave,
  onChange,
  messages,
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
      const errorDetails =
        response.error?.details &&
        typeof response.error.details === "object" &&
        !Array.isArray(response.error.details)
          ? (response.error.details as Record<string, unknown>)
          : null;
      const isExportCancelled =
        errorDetails?.reason === EXPORT_CANCELLED_REASON;

      if (response.ok && response.data) {
        console.log("Note exported to:", response.data);
      } else if (!isExportCancelled) {
        console.error("Failed to export note:", response.error);
        alert(
          messages.failedExport(
            response.error?.message || messages.unknownError,
          ),
        );
      }
    } catch (error) {
      console.error("Export error:", error);
      alert(messages.failedExportNote);
    }
  }, [content, file, messages]);

  return {
    appSettings,
    content,
    setContent,
    hasUnsavedChanges,
    handleSave,
    handleExport,
  };
}
