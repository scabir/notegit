export const formatRelativeDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes === 0 ? "just now" : `${minutes}m ago`;
    }
    return `${hours}h ago`;
  }
  if (days === 1) {
    return "yesterday";
  }
  if (days < 7) {
    return `${days} days ago`;
  }
  return d.toLocaleDateString();
};

export const getFileName = (filePath: string | null): string => {
  if (!filePath) return "";
  return filePath.split("/").pop() || filePath;
};
