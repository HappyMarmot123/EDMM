import type { PropsWithChildren } from "react";

import { AppProviders } from "../appProviders";

export default function SearchLayout({ children }: PropsWithChildren) {
  return <AppProviders>{children}</AppProviders>;
}
