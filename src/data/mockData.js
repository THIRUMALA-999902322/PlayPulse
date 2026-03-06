export const mockMatches = [
  {
    id: 1, sport: "Cricket", emoji: "🏏",
    title: "Evening T10 at Westside Ground",
    location: "Westside Community Ground", distance: "0.4 mi",
    time: "Today 5:30 PM", status: "live",
    teams: [{ name: "Phoenix", score: "112/3", overs: "7.4" }, { name: "Bolts", score: "89/5", overs: "8.0" }],
    players: [{ color: "#FF6B6B", letter: "A" }, { color: "#4ECDC4", letter: "B" }, { color: "#45B7D1", letter: "C" }, { color: "#96CEB4", letter: "D" }],
    joined: 12, max: 14, needFill: false,
  },
  {
    id: 2, sport: "Football", emoji: "⚽",
    title: "Sunday 5-a-side — Need 2 players",
    location: "Central Park Pitch 3", distance: "0.9 mi",
    time: "Today 6:00 PM", status: "open",
    teams: [], players: [{ color: "#A29BFE", letter: "J" }, { color: "#FD79A8", letter: "M" }, { color: "#FDCB6E", letter: "R" }],
    joined: 8, max: 10, needFill: true, need: 2,
  },
  {
    id: 3, sport: "Basketball", emoji: "🏀",
    title: "3v3 Pickup — Main Court",
    location: "Campus Sports Complex", distance: "0.2 mi",
    time: "Today 7:00 PM", status: "soon",
    teams: [], players: [{ color: "#55EFC4", letter: "K" }, { color: "#FDCB6E", letter: "L" }],
    joined: 4, max: 6, needFill: true, need: 2,
  },
  {
    id: 4, sport: "Badminton", emoji: "🏸",
    title: "Mixed Doubles — Hall B",
    location: "Union Sports Hall", distance: "1.2 mi",
    time: "Tomorrow 9:00 AM", status: "full",
    teams: [], players: [{ color: "#E17055", letter: "P" }, { color: "#74B9FF", letter: "Q" }, { color: "#A29BFE", letter: "S" }, { color: "#FD79A8", letter: "T" }],
    joined: 4, max: 4, needFill: false,
  },
];

export const mockCommentary = [
  { over: "8.4", type: "six", text: "<strong>SIX!</strong> Rohit steps out and absolutely hammers it over long-on." },
  { over: "8.3", type: "normal", text: "Single taken to mid-wicket. Batters cross." },
  { over: "8.2", type: "four", text: "<strong>FOUR!</strong> Driven hard through covers. Races away to the boundary." },
  { over: "8.1", type: "wicket", text: "<strong>WICKET!</strong> Clean bowled! Off stump cartwheels out of the ground." },
  { over: "7.6", type: "normal", text: "Dot ball. Tight line on off stump, no run." },
  { over: "7.5", type: "normal", text: "Two runs. Hit to deep mid-wicket, they run back for two." },
];

export const mockLeagues = [
  { id: 1, name: "Campus T20 League", emoji: "🏏", members: 48, matches: 12, sport: "Cricket" },
  { id: 2, name: "Sunday Football Cup", emoji: "⚽", members: 30, matches: 8, sport: "Football" },
  { id: 3, name: "Hoop Kings 3v3", emoji: "🏀", members: 18, matches: 6, sport: "Basketball" },
];
