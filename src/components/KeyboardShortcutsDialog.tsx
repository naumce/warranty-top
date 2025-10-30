import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["Ctrl/⌘", "N"], description: "Add new warranty", category: "Actions" },
  { keys: ["/"], description: "Focus search", category: "Navigation" },
  { keys: ["Shift", "E"], description: "Open emergency mode", category: "Actions" },
  { keys: ["Shift", "N"], description: "Open notifications", category: "Navigation" },
  { keys: ["Ctrl/⌘", "E"], description: "Export warranties", category: "Actions" },
  { keys: ["?"], description: "Show this help", category: "Help" },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KeyboardShortcutsDialog = ({ open, onOpenChange }: KeyboardShortcutsDialogProps) => {
  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>Speed up your workflow with these shortcuts</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {categories.map((category) => (
            <div key={category}>
              <h4 className="font-semibold text-sm mb-3">{category}</h4>
              <div className="space-y-2">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                    >
                      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, i) => (
                          <Badge key={i} variant="outline" className="font-mono text-xs">
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center pb-2">
          Press <Badge variant="outline" className="font-mono mx-1">?</Badge> anytime to show this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
};

