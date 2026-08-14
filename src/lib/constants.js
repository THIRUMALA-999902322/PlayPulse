import { theme } from "../styles/theme";

export const SPORTS = [
  ["🏏", "Cricket"], ["⚽", "Football"], ["🏀", "Basketball"], ["🏸", "Badminton"],
  ["🎾", "Tennis"],  ["🏐", "Volleyball"], ["🏑", "Hockey"],  ["🏓", "Table Tennis"],
];

export const sportEmoji = {
  All: "🌐", Cricket: "🏏", Football: "⚽", Basketball: "🏀", Badminton: "🏸",
  Tennis: "🎾", Volleyball: "🏐", Hockey: "🏑", "Table Tennis": "🏓",
};

export const sportColor = {
  Cricket: theme.accent, Football: "#FF6B6B", Basketball: "#FFB800",
  Badminton: "#A29BFE", Tennis: "#55EFC4", Volleyball: "#FD79A8",
  Hockey: "#74B9FF", "Table Tennis": "#E17055", default: "#74B9FF",
};

export const CHECK_STEPS = ["Registered", "Confirmed", "On The Way", "Arrived", "Checked In"];

export const SKILL_LEVELS = ["All levels", "Beginner", "Intermediate", "Advanced"];
export const MATCH_TYPES  = ["Friendly", "League", "Practice", "Tournament"];
export const GEAR_OPTIONS = ["Ball", "Cones", "Net", "Bibs"];
// "Friends" is gone: there is no social graph, so it could only ever have been
// a second word for "Public". Both of these are enforced by database policy.
export const PRIVACY_OPTIONS = ["Public", "Invite Only"];
export const RECURRENCE_OPTIONS = ["Once", "Weekly", "Biweekly", "Monthly"];

export const AVATAR_COLORS = [
  "#00F5A0", "#FF6B6B", "#4ECDC4", "#FFB800", "#A29BFE",
  "#FD79A8", "#55EFC4", "#74B9FF", "#E17055", "#FDCB6E",
];
