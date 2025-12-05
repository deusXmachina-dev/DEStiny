import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ChartLayoutProps {
  title: string;
  badge?: string | number | null;
  isEmpty: boolean;
  children: ReactNode;
}

/**
 * Shared layout component for metric charts.
 * Provides consistent card structure, header with optional badge, and empty state handling.
 */
export function ChartLayout({ title, badge, isEmpty, children }: ChartLayoutProps) {
  if (isEmpty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {badge !== null && badge !== undefined && (
            <Badge
              variant="outline"
              className="text-xl font-bold tabular-nums bg-accent"
            >
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
