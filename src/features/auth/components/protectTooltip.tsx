"use client";

import MyTooltip from "@/shared/components/myTooltip";
import { useAuth } from "@/shared/providers/authProvider";

export default function ProtectTooltip({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = useAuth();

  const showTooltip = !role.favoriteInteract;

  return (
    <MyTooltip
      tooltipText={showTooltip ? "You need to login!" : ""}
      showTooltip={showTooltip}
    >
      {children}
    </MyTooltip>
  );
}
