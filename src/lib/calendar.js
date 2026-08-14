/**
 * Builds an .ics file for a match so a player can drop it straight into
 * whatever calendar they use. Written by hand rather than pulled from a library
 * — the format is small and this avoids shipping a dependency for one feature.
 */

const pad = (n) => String(n).padStart(2, "0");

/** iCalendar wants UTC basic format: 20260729T183000Z */
const toICSDate = (date) =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
  `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;

/** Commas, semicolons and newlines are structural in iCalendar and must escape. */
const escapeText = (value = "") =>
  String(value).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Lines over 75 octets must be folded with a leading space on continuations. */
const fold = (line) => {
  if (line.length <= 73) return line;
  const parts = [line.slice(0, 73)];
  let rest = line.slice(73);
  while (rest.length > 72) {
    parts.push(` ${rest.slice(0, 72)}`);
    rest = rest.slice(72);
  }
  if (rest) parts.push(` ${rest}`);
  return parts.join("\r\n");
};

export const buildMatchICS = (match, { durationMinutes = 120 } = {}) => {
  const start = new Date(match.matchTime);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const description = [
    `${match.sport} · ${match.skill}`,
    `${match.joined}/${match.max} players`,
    match.rules || "",
    match.gear?.length ? `Gear: ${match.gear.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PlayPulse//Match//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:playpulse-${match.id}@playpulse.app`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    fold(`SUMMARY:${escapeText(match.title)}`),
    fold(`LOCATION:${escapeText(match.location)}`),
    fold(`DESCRIPTION:${escapeText(description)}`),
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Match starts in an hour",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
};

/** Triggers the download. Returns false when the match has no usable time. */
export const downloadMatchICS = (match) => {
  const ics = buildMatchICS(match);
  if (!ics) return false;

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${match.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "match"}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};
