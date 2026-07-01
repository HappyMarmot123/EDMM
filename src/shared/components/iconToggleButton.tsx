"use client";

import React from "react";
import type { LucideProps } from "lucide-react";
import { PlayerControlButton } from "./playerControlBtn";

interface IconToggleButtonProps {
  id: string;
  condition: boolean;
  IconOnTrue: React.ComponentType<LucideProps>;
  IconOnFalse: React.ComponentType<LucideProps>;
  onClick: () => void | Promise<void>;
  label: string;
  iconProps?: React.SVGProps<SVGSVGElement>;
  className?: string;
  disabled?: boolean;
}

export const IconToggleButton: React.FC<IconToggleButtonProps> = ({
  id,
  condition,
  IconOnTrue,
  IconOnFalse,
  onClick,
  label,
  iconProps = {},
  className,
  disabled,
}) => {
  const commonIconProps = {
    className:
      "block m-auto transition-colors duration-200 ease-[ease] text-[#fd6d94]",
    width: 20,
    fill: "#fd6d94",
    "aria-hidden": true,
    ...iconProps,
  };

  return (
    <PlayerControlButton
      id={id}
      onClick={onClick}
      aria-label={label}
      className={className}
      disabled={disabled}
    >
      {condition ? (
        <IconOnTrue {...commonIconProps} />
      ) : (
        <IconOnFalse {...commonIconProps} />
      )}
    </PlayerControlButton>
  );
};
