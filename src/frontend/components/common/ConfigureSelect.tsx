"use client";

import { Settings2 } from "lucide-react";

import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ConfigureSelectProps {
  title: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function ConfigureSelect({ title, open, onOpenChange, children }: ConfigureSelectProps) {
  return (
    <Select open={open} onOpenChange={onOpenChange}>
      <SelectTrigger className="w-auto gap-2">
        <Settings2 className="h-4 w-4" />
        <SelectValue placeholder="Configure" />
      </SelectTrigger>
      <SelectContent className="w-80" align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
        <div className="p-2">
          <div className="text-sm font-semibold mb-3 px-2">{title}</div>
          {children}
        </div>
      </SelectContent>
    </Select>
  );
}
