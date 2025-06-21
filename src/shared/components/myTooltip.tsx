import * as React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { MyTooltipProps } from "@/shared/types/dataType";

const MyTooltip: React.FC<MyTooltipProps> = ({
  children,
  tooltipText,
  showTooltip = true,
  delayDuration = 200,
  sideOffset = 5,
}) => {
  if (!tooltipText) {
    return <>{children}</>;
  }

  return (
    <Tooltip.Provider delayDuration={delayDuration}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        {showTooltip && (
          <Tooltip.Portal>
            <Tooltip.Content
              sideOffset={sideOffset}
              className="radix-tooltip-content-gradient"
            >
              {tooltipText}
              <Tooltip.Arrow className="radix-tooltip-arrow-gradient" />
            </Tooltip.Content>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default MyTooltip;
