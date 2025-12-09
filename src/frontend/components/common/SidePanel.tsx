import { cn } from "@lib/utils";
import { ReactNode } from "react";

interface SidePanelProps {
  children: ReactNode;
  className?: string;
}

interface SidePanelHeaderProps {
  children: ReactNode;
  className?: string;
}

interface SidePanelContentProps {
  children: ReactNode;
  className?: string;
}

interface SidePanelFooterProps {
  children: ReactNode;
  className?: string;
}

function SidePanelHeader({ children, className }: SidePanelHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {children}
    </div>
  );
}

function SidePanelContent({ children, className }: SidePanelContentProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto p-4", className)}>
      {children}
    </div>
  );
}

function SidePanelFooter({ children, className }: SidePanelFooterProps) {
  return (
    <div
      className={cn(
        "p-4 border-t flex items-center justify-between",
        className
      )}
    >
      {children}
    </div>
  );
}

function SidePanel({ children, className }: SidePanelProps) {
  return (
    <div
      className={cn(
        "w-full h-full flex flex-col bg-background border-l",
        className
      )}
    >
      {children}
    </div>
  );
}

// Compound component pattern
SidePanel.Header = SidePanelHeader;
SidePanel.Content = SidePanelContent;
SidePanel.Footer = SidePanelFooter;

export { SidePanel };
