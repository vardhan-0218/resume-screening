import { createContext, useContext, useState, ReactNode } from "react";

interface SimpleAuthContextType {
  isAuthenticated: boolean;
  userRole: "candidate" | "hr";
  login: (role: "candidate" | "hr") => void;
  logout: () => void;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export const SimpleAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"candidate" | "hr">("candidate");

  const login = (role: "candidate" | "hr") => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole("candidate");
  };

  return (
    <SimpleAuthContext.Provider value={{ isAuthenticated, userRole, login, logout }}>
      {children}
    </SimpleAuthContext.Provider>
  );
};

