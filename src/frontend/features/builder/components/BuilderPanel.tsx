"use client";

import { ClientOnly } from "@/components/common/ClientOnly";
import { SidePanel } from "@/components/common/SidePanel";

import { useBuilderSchemas } from "../hooks/useBuilderSchemas";
import type { BuilderEntitySchema } from "../types";
import { EntityPalette } from "./ui/EntityPalette";
import { ExportBlueprintButton } from "./ui/ExportBlueprintButton";
import { ChatInterface } from "./ui/ChatInterface";

function BuilderPanelContent() {
  const { schemas, isLoading, error } = useBuilderSchemas();

  return (
    <SidePanel>
      <SidePanel.Content className="flex flex-col p-0">
        {!isLoading && !error && (
          <>
            <EntityPalette schemas={schemas} className="h-[30%] p-4" />
            <div className="border-t border-border" />
            <ChatInterface className="h-[70%] p-4" />
          </>
        )}
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
