import { useEffect } from "react";

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const metaMatch = shortcut.metaKey ? event.metaKey : !event.metaKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch
        ) {
          event.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
};

export const SHORTCUTS = {
  ADD_WARRANTY: { key: "n", ctrlKey: true, description: "Add new warranty" },
  SEARCH: { key: "/", description: "Focus search" },
  EMERGENCY: { key: "e", shiftKey: true, description: "Open emergency mode" },
  NOTIFICATIONS: { key: "n", shiftKey: true, description: "Open notifications" },
  EXPORT: { key: "e", ctrlKey: true, description: "Export warranties" },
  HELP: { key: "?", description: "Show keyboard shortcuts" },
};

