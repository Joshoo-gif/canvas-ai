"use client";

import type { ButtonHTMLAttributes } from "react";
import { Plus } from "lucide-react";
import IconButton from "./IconButton";

type CreateWorkspaceButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  colorClass: string;
};

/**
 * Standard create-workspace action button used across the workspace shell.
 * The shape and neutral styling stay aligned with the workspace files header.
 */
export default function CreateWorkspaceButton({
  colorClass,
  className = "",
  ...rest
}: CreateWorkspaceButtonProps) {
  return (
    <IconButton
      label="Create workspace"
      sizeClass="h-8 w-8"
      shapeClass="rounded-lg"
      colorClass={`border transition-all duration-150 ${colorClass}`}
      className={className}
      {...rest}
    >
      <Plus className="h-4 w-4" />
    </IconButton>
  );
}
