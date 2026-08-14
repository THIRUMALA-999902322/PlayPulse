import { useContext } from "react";
import { AppDataContext } from "../context/contexts";

export const useAppData = () => useContext(AppDataContext);
