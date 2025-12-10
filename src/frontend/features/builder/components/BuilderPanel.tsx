"use client";

import { ClientOnly } from "@/components/common/ClientOnly";
import { SidePanel } from "@/components/common/SidePanel";

import { ChatInterface } from "./ui/ChatInterface";
import { EntityPalette } from "./ui/EntityPalette";
import { useBuilderSchemas } from "../hooks/useBuilderSchemas";

function BuilderPanelContent() {
  const { schemas, isLoading } = useBuilderSchemas();

  return (
    <SidePanel>
      <SidePanel.Content className="flex flex-col p-0">
        <EntityPalette
          schemas={schemas ?? []}
          isLoading={isLoading}
          className="h-[30%] p-4 overflow-y-auto"
        />
        <div className="border-t border-border" />
        <ChatInterface className="h-[70%] p-4" />
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
