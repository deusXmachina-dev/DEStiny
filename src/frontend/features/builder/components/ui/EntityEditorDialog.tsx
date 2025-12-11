"use client";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { BlueprintEntity } from "../../types";

interface EntityEditorDialogProps {
  entity: BlueprintEntity;
  formId: string;
  onDelete: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Dialog wrapper for entity editor with header, footer, and common UI elements.
 * Handles Enter key submission and close button.
 */
export const EntityEditorDialog = ({
  entity,
  formId,
  onDelete,
  onClose: _onClose,
  children,
}: EntityEditorDialogProps) => {
  const handleSave = () => {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit Entity: {entity.entityType}</DialogTitle>
        <DialogDescription>
          Modify the parameters for this entity or remove it from the blueprint.
        </DialogDescription>
      </DialogHeader>
      {children}
      <DialogFooter className="flex-row justify-between">
        <Button type="button" variant="destructive" onClick={onDelete}>
          Delete Entity
        </Button>
        <Button type="button" onClick={handleSave}>
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
