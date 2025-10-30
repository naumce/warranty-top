import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface WarrantyDurationPickerProps {
  purchaseDate: string;
  onWarrantyEndDateChange: (endDate: string) => void;
  defaultDuration?: number;
  defaultUnit?: 'days' | 'months' | 'years';
}

export const WarrantyDurationPicker = ({ 
  purchaseDate, 
  onWarrantyEndDateChange,
  defaultDuration = 12,
  defaultUnit = 'months'
}: WarrantyDurationPickerProps) => {
  const [duration, setDuration] = React.useState(defaultDuration);
  const [unit, setUnit] = React.useState<'days' | 'months' | 'years'>(defaultUnit);
  const [calculatedEndDate, setCalculatedEndDate] = React.useState('');

  React.useEffect(() => {
    if (!purchaseDate || !duration) {
      setCalculatedEndDate('');
      return;
    }

    const startDate = new Date(purchaseDate);
    if (isNaN(startDate.getTime())) {
      setCalculatedEndDate('');
      return;
    }

    let endDate = new Date(startDate);

    switch (unit) {
      case 'days':
        endDate.setDate(endDate.getDate() + duration);
        break;
      case 'months':
        endDate.setMonth(endDate.getMonth() + duration);
        break;
      case 'years':
        endDate.setFullYear(endDate.getFullYear() + duration);
        break;
    }

    const formattedEndDate = endDate.toISOString().split('T')[0];
    setCalculatedEndDate(formattedEndDate);
    onWarrantyEndDateChange(formattedEndDate);
  }, [purchaseDate, duration, unit, onWarrantyEndDateChange]);

  const handleDurationChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setDuration(numValue);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Warranty Duration *</Label>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Duration Input */}
        <div>
          <Input
            type="number"
            min="1"
            placeholder="12"
            value={duration}
            onChange={(e) => handleDurationChange(e.target.value)}
            className="text-base"
          />
        </div>

        {/* Unit Selector */}
        <div>
          <Select value={unit} onValueChange={(value: 'days' | 'months' | 'years') => setUnit(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="months">Months</SelectItem>
              <SelectItem value="years">Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Show calculated end date */}
      {calculatedEndDate && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-muted-foreground">Warranty expires on: </span>
            <span className="font-semibold">
              {new Date(calculatedEndDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      )}

      {!purchaseDate && (
        <p className="text-xs text-muted-foreground">
          Set purchase date first to calculate warranty end date
        </p>
      )}
    </div>
  );
};

