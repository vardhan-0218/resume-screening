import { useContext } from "react";
import { SimpleAuthContext } from "../contexts/SimpleAuthContext";

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error("useSimpleAuth must be used within a SimpleAuthProvider");
  }
  return context;
};