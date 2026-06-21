"use client";

import { useContext } from "react";
import { AuthContext } from "@/lib/contexts/AuthContext";

export function useAuth() {
  return useContext(AuthContext);
}
