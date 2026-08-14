/**
 * Props that turn a tappable <div> into something a keyboard can reach.
 * Cards can't be real <button>s because several contain their own buttons
 * (Join, Approve), and nesting buttons is invalid HTML.
 */
export const tappable = (onActivate, label) => ({
  role: "button",
  tabIndex: 0,
  "aria-label": label,
  onClick: onActivate,
  onKeyDown: (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    // Let nested controls handle their own keys rather than firing the card too.
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    onActivate(e);
  },
});
