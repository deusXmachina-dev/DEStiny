"use client";

import { useState, useRef, useEffect } from "react";

interface EditableEntityNameProps {
  entityId: string;
  name: string;
  onChange: (name: string) => void;
}

export const EditableEntityName = ({
  entityId,
  name,
  onChange,
}: EditableEntityNameProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
    setEditValue(name);
  };

  const handleBlur = () => {
    if (editValue.trim() !== "") {
      onChange(editValue.trim());
    } else {
      setEditValue(name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (editValue.trim() !== "") {
        onChange(editValue.trim());
      } else {
        setEditValue(name);
      }
      setIsEditing(false);
    } else if (e.key === "Escape") {
      setEditValue(name);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="text-xs bg-background border border-primary rounded px-1 py-0.5 text-center min-w-[60px] focus:outline-none focus:ring-1 focus:ring-primary"
        style={{
          fontFamily: "monospace",
        }}
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      className="text-xs text-white cursor-pointer hover:text-primary transition-colors select-none"
      style={{
        textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
        fontFamily: "monospace",
      }}
    >
      {name}
    </span>
  );
};
