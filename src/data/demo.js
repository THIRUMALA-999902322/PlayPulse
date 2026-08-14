// Offline safety net: if the network or database is unreachable the app still
// renders a believable board instead of an empty screen. Ids are strings so they
// never collide with the uuids Postgres hands out.

const inHours = (h) => new Date(Date.now() + h * 3600000).toISOString();

export const demoMatches = [
  {
    id: "demo-1", kind: "pickup", sport: "Cricket", title: "Evening T10 at Westside Ground",
    location: "Westside Community Ground", matchTime: inHours(0.5), status: "live",
    skill: "Intermediate", joined: 12, max: 14, lat: null, lng: null,
    streamUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw", approvalMode: false,
    gear: ["Ball"], rules: "Fair play rules apply. Ball provided.", createdBy: null, leagueId: null,
  },
  {
    id: "demo-2", kind: "pickup", sport: "Football", title: "Sunday 5-a-side — need 2 players",
    location: "Central Park Pitch 3", matchTime: inHours(3), status: "open",
    skill: "All levels", joined: 8, max: 10, lat: null, lng: null,
    streamUrl: null, approvalMode: false, gear: ["Ball", "Bibs"], rules: "", createdBy: null, leagueId: null,
  },
  {
    id: "demo-3", kind: "pickup", sport: "Basketball", title: "3v3 Pickup — Main Court",
    location: "Campus Sports Complex", matchTime: inHours(5), status: "soon",
    skill: "Beginner friendly", joined: 4, max: 6, lat: null, lng: null,
    streamUrl: null, approvalMode: false, gear: ["Ball"], rules: "", createdBy: null, leagueId: null,
  },
  {
    id: "demo-4", kind: "league", sport: "Cricket", title: "Campus T20 League — Round 5",
    location: "University Oval", matchTime: inHours(48), status: "soon",
    skill: "League players", joined: 18, max: 22, lat: null, lng: null,
    streamUrl: null, approvalMode: true, gear: ["Ball"], rules: "", createdBy: null, leagueId: "demo-l1",
  },
  {
    id: "demo-5", kind: "practice", sport: "Badminton", title: "Doubles Practice — Hall B",
    location: "Union Sports Hall", matchTime: inHours(24), status: "practice",
    skill: "All levels", joined: 4, max: 4, lat: null, lng: null,
    streamUrl: null, approvalMode: false, gear: ["Net"], rules: "", createdBy: null, leagueId: null,
  },
];

export const demoLeagues = [
  {
    id: "demo-l1", name: "Campus T20 League", emoji: "🏏", sport: "Cricket",
    season: "Spring 2026 · Round 5 of 8", members: 48,
    standings: [
      { team: "Phoenix CC", played: 5, won: 4, lost: 1, points: 8 },
      { team: "Bolts XI", played: 5, won: 3, lost: 2, points: 6 },
      { team: "Eagles", played: 5, won: 2, lost: 3, points: 4 },
      { team: "Union Stars", played: 5, won: 1, lost: 4, points: 2 },
    ],
    fixtures: [
      { home: "Phoenix CC", away: "Eagles", time: inHours(48), venue: "University Oval" },
      { home: "Bolts XI", away: "Union Stars", time: inHours(52), venue: "Westside Ground" },
    ],
  },
  {
    id: "demo-l2", name: "Sunday Football Cup", emoji: "⚽", sport: "Football",
    season: "Knockout · Quarter-finals", members: 30,
    standings: [
      { team: "Red Wolves", played: 3, won: 3, lost: 0, points: 9 },
      { team: "Campus FC", played: 3, won: 2, lost: 1, points: 6 },
      { team: "North Hall", played: 3, won: 1, lost: 2, points: 3 },
      { team: "The Misfits", played: 3, won: 0, lost: 3, points: 0 },
    ],
    fixtures: [{ home: "Red Wolves", away: "Campus FC", time: inHours(72), venue: "Central Park Pitch 1" }],
  },
  {
    id: "demo-l3", name: "Hoop Kings 3v3", emoji: "🏀", sport: "Basketball",
    season: "Season 2 · Week 4", members: 18,
    standings: [
      { team: "Ballers", played: 4, won: 4, lost: 0, points: 8 },
      { team: "Dunk Squad", played: 4, won: 2, lost: 2, points: 4 },
      { team: "Net Gains", played: 4, won: 0, lost: 4, points: 0 },
    ],
    fixtures: [{ home: "Ballers", away: "Dunk Squad", time: inHours(96), venue: "Campus Sports Complex" }],
  },
];

export const demoCommentary = [
  { id: "c1", over: "8.4", kind: "six",    headline: "SIX!",    body: " Rohit steps out and hammers it over long-on." },
  { id: "c2", over: "8.3", kind: "normal", headline: null,      body: "Single taken to mid-wicket. Batters cross." },
  { id: "c3", over: "8.2", kind: "four",   headline: "FOUR!",   body: " Driven hard through covers, nobody moves." },
  { id: "c4", over: "8.1", kind: "wicket", headline: "WICKET!", body: " Clean bowled! Off stump out of the ground." },
  { id: "c5", over: "7.6", kind: "normal", headline: null,      body: "Dot ball. Tight line on off stump, no run." },
];

export const demoScore = [
  { name: "Phoenix", score: "112/3", detail: "7.4 overs" },
  { name: "Bolts",   score: "89/5",  detail: "8.0 overs" },
];

/** Portfolio shown before a player has any recorded matches of their own. */
export const samplePortfolio = {
  Cricket: {
    summary: "Right-hand bat · Medium pace",
    official: [["34","Matches"],["1,248","Runs"],["36.7","Average"],["124","Strike Rate"],["98","4s"],["42","6s"],["11","Wickets"],["7.2","Economy"],["15","Catches"]],
    practice: [["12","Sessions"],["310","Runs"],["28.2","Average"],["108","Strike Rate"],["22","4s"],["9","6s"],["4","Wickets"],["8.1","Economy"],["6","Catches"]],
  },
  Football: {
    summary: "Centre Forward · Campus FC",
    official: [["18","Matches"],["CF","Position"],["11","Goals"],["7","Assists"],["3","Clean Sheets"],["2","Yellow Cards"]],
    practice: [["6","Sessions"],["CF","Position"],["5","Goals"],["3","Assists"],["1","Clean Sheets"],["0","Yellow Cards"]],
  },
  Basketball: {
    summary: "Point Guard · Hoop Kings",
    official: [["9","Matches"],["14.2","Points/Game"],["5.1","Assists"],["3.8","Rebounds"],["1.4","Steals"],["0.6","Blocks"]],
    practice: [["4","Sessions"],["11.0","Points/Game"],["4.2","Assists"],["3.1","Rebounds"],["1.0","Steals"],["0.3","Blocks"]],
  },
};

export const sampleAchievements = [
  { id: "a1", icon: "🏆", title: "Campus T20 — Player of the Match", subtitle: "Round 3 · 45 runs off 28 balls" },
  { id: "a2", icon: "🥇", title: "Sunday Football Cup — Top Scorer",  subtitle: "Season 1 · 11 goals" },
  { id: "a3", icon: "⭐", title: "100% Reliability Streak",           subtitle: "Checked in to 20 matches in a row" },
];

export const sampleTeamHistory = [
  { id: "t1", emoji: "🏏", team: "Phoenix CC", role: "Opening batter", span: "2025 — present" },
  { id: "t2", emoji: "⚽", team: "Campus FC",  role: "Centre Forward", span: "2024 — present" },
  { id: "t3", emoji: "🏀", team: "Hoop Kings", role: "Point Guard",    span: "2026 — present" },
];
