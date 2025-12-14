"use client";

import { ClientOnly } from "@/components/common/ClientOnly";
import { SidePanel } from "@/components/common/SidePanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { useBuilderSchemas } from "../hooks/useBuilderSchemas";
import { ChatInterface } from "./ui/ChatInterface";
import { EntityPalette } from "./ui/EntityPalette";

function BuilderPanelContent() {
  const { schemas, isLoading } = useBuilderSchemas();

  console.debug("BuilderPanelContent rerender");

  return (
    <SidePanel>
      <SidePanel.Content className="p-0">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={25}>
            <EntityPalette
              schemas={schemas}
              isLoading={isLoading}
              className="p-4"
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={75}>
            <ChatInterface />
          </ResizablePanel>
        </ResizablePanelGroup>
      </SidePanel.Content>
    </SidePanel>
  );
}

export function BuilderPanel() {
  return (
    <ClientOnly>
      <BuilderPanelContent />
    </ClientOnly>
  );
}
