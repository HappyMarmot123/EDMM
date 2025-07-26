import React from "react";

export const PlayerControlButton: React.FC<
  React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>
> = ({ children, ...props }) => {
  return (
    <button
      {...props}
      className="p-2 rounded-full transition-colors duration-200 hover:bg-gray-200"
    >
      {children}
    </button>
  );
};
