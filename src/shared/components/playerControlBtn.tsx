import React from "react";
import clsx from "clsx";

export const PlayerControlButton: React.FC<
  React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>
> = ({ children, className, ...props }) => {
  return (
    <button
      {...props}
      className={clsx(
        "rounded-full p-2 transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd6d94] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        className
      )}
    >
      {children}
    </button>
  );
};
