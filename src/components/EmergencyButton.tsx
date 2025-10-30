import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { EmergencyModal } from "./EmergencyModal";

export const EmergencyButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="destructive"
        className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
        onClick={() => setOpen(true)}
      >
        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
        <span className="hidden sm:inline">💥 Emergency</span>
        <span className="sm:hidden">🚨 Help</span>
      </Button>

      <EmergencyModal open={open} onOpenChange={setOpen} />
    </>
  );
};

