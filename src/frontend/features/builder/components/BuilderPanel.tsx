"use client";

import { ClientOnly } from "@/components/common/ClientOnly";
import { SidePanel } from "@/components/common/SidePanel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

import { useBuilderSchemas } from "../hooks/useBuilderSchemas";
import { ChatInterface } from "./ChatInterface";
import { EntityPalette } from "./ui/EntityPalette";
import { SimulationMetaMenu } from "./ui/SimulationMetaMenu";

function BuilderPanelContent() {
  const { schemas, isLoading } = useBuilderSchemas();

  console.debug("BuilderPanelContent rerender");

  return (
    <SidePanel>
      <SidePanel.Header className="justify-end p-3 border-b-0">
        <SimulationMetaMenu />
      </SidePanel.Header>
      <SidePanel.Content className="p-0">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={30}>
            <EntityPalette schemas={schemas} isLoading={isLoading} className="p-4 pt-0" />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={70}>
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
