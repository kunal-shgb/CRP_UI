import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";
// We will transition away from mock-data entirely later, but for now we'll redefine User here to match the API

export type UserRole = "BRANCH" | "REGIONAL_OFFICE" | "HEAD_OFFICE" | "ADMIN";

export interface User {
  id: number;
  username: string;
  role: UserRole;
  branch?: { id: number; name: string; code: string };
  regionalOffice?: { id: number; name: string; code: string };
  branchId?: number;
  regionalOfficeId?: number;
  productType?: string;
  iat?: number;
  exp?: number;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.get<{id: number, username: string, role: string, branchId?: number, regionalOfficeId?: number}>("/auth/profile");
          const fetchedUser = res.data;
          // Normalize role to uppercase for consistent comparisons in the UI
          if (fetchedUser && typeof fetchedUser === "object") {
            (fetchedUser as any).role = (fetchedUser as any).role?.toUpperCase() || '';
          }
          setUser(fetchedUser as unknown as User);
        } catch (error) {
          console.error("Failed to load user profile", error);
          localStorage.removeItem("token");
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("token", token);
    if (userData.role) {
      userData.role = userData.role as UserRole;
    }
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
