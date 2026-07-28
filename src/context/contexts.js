import { createContext } from "react";

// Context objects live apart from their providers so the provider modules
// export components only — that keeps Vite's fast refresh working.
export const AuthContext = createContext({});
export const AppDataContext = createContext({});
