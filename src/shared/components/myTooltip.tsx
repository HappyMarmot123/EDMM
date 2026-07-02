import * as React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

interface MyTooltipProps {
  children: React.ReactNode;
  tooltipText: React.ReactNode;
  showTooltip?: boolean;
  delayDuration?: number;
  sideOffset?: number;
  side?: Tooltip.TooltipContentProps["side"];
  align?: Tooltip.TooltipContentProps["align"];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const MyTooltip: React.FC<MyTooltipProps> = ({
  children,
  tooltipText,
  showTooltip = true,
  delayDuration = 200,
  sideOffset = 8,
  side,
  align,
  open,
  onOpenChange,
}) => {
  if (!tooltipText) {
    return <>{children}</>;
  }

  return (
    <Tooltip.Provider delayDuration={delayDuration}>
      <Tooltip.Root open={open} onOpenChange={onOpenChange}>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        {showTooltip && (
          <Tooltip.Portal>
            <Tooltip.Content
              side={side}
              align={align}
              sideOffset={sideOffset}
              collisionPadding={12}
              className="radix-tooltip-content-edmm"
            >
              {tooltipText}
              <Tooltip.Arrow className="radix-tooltip-arrow-edmm" />
            </Tooltip.Content>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default MyTooltip;
