import { colorFor, initials } from "../lib/format";

/** Deterministic initial-avatar: same name always renders the same colour. */
const Avatar = ({ name, size = 24, radius = "50%", className = "", style = {} }) => {
  const color = colorFor(name || "");
  return (
    <div
      className={className}
      style={{
        width: size, height: size, borderRadius: radius,
        background: `${color}30`, color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.round(size * 0.42), fontWeight: 700, flexShrink: 0,
        ...style,
      }}
    >
      {initials(name)}
    </div>
  );
};

export default Avatar;
