"use client";

import { useContext } from "react";
import { LocaleContext } from "@/lib/contexts/LocaleContext";

export function useLocale() {
  return useContext(LocaleContext);
}
