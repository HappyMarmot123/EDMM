"use client";

import React from "react";
import { PlayerControlButton } from "./playerControlBtn";
import { IconToggleButtonProps } from "@/shared/types/dataType";

export const IconToggleButton: React.FC<IconToggleButtonProps> = ({
  id,
  condition,
  IconOnTrue,
  IconOnFalse,
  onClick,
  label,
  iconProps = {},
  className,
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
    >
      {condition ? (
        <IconOnTrue {...commonIconProps} />
      ) : (
        <IconOnFalse {...commonIconProps} />
      )}
    </PlayerControlButton>
  );
};
