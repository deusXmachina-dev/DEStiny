import { SidePanel } from "@/components/common/SidePanel";

export function EditorPanel() {
  return (
    <SidePanel>
      <SidePanel.Content>
        <div className="space-y-4">
          {/* Component Box 1 */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="h-32 bg-muted rounded flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Component A</span>
            </div>
          </div>

          {/* Component Box 2 */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="h-24 bg-muted rounded flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Component B</span>
            </div>
          </div>

          {/* Component Box 3 - Horizontal Layout */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex gap-4">
              <div className="flex-1 h-20 bg-muted rounded flex items-center justify-center">
                <span className="text-muted-foreground text-xs">Component C1</span>
              </div>
              <div className="flex-1 h-20 bg-muted rounded flex items-center justify-center">
                <span className="text-muted-foreground text-xs">Component C2</span>
              </div>
            </div>
          </div>

          {/* Component Box 4 */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="h-40 bg-muted rounded flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Component D</span>
            </div>
          </div>

          {/* Component Box 5 - Grid Layout */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="grid grid-cols-3 gap-3">
              <div className="h-16 bg-muted rounded flex items-center justify-center">
                <span className="text-muted-foreground text-xs">E1</span>
              </div>
              <div className="h-16 bg-muted rounded flex items-center justify-center">
                <span className="text-muted-foreground text-xs">E2</span>
              </div>
              <div className="h-16 bg-muted rounded flex items-center justify-center">
                <span className="text-muted-foreground text-xs">E3</span>
              </div>
            </div>
          </div>
        </div>
      </SidePanel.Content>
    </SidePanel>
  );
}
