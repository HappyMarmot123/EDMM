import type { ReactNode } from "react";

type RouteFeedbackShellProps = {
  children: ReactNode;
  rootClassName?: string;
  contentClassName?: string;
};

export function RouteFeedbackShell({
  children,
  rootClassName,
  contentClassName,
}: RouteFeedbackShellProps) {
  const rootClasses = [
    "min-h-screen",
    "w-full",
    "flex",
    "items-center",
    "justify-center",
    "bg-black",
    "text-white",
    "px-4",
    rootClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClasses}>
      <div className={contentClassName}>{children}</div>
    </div>
  );
}

