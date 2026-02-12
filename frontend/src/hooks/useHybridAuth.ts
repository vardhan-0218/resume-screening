import { useContext } from "react";
import { HybridAuthContext } from "../contexts/HybridAuthContextTypes";

export const useHybridAuth = () => {
  const context = useContext(HybridAuthContext);
  if (context === undefined) {
    throw new Error("useHybridAuth must be used within a HybridAuthProvider");
  }
  return context;
};