/** Renders `backtick` spans of plain text as <code> */
export const withCode = (text: string) =>
  text
    .split(/(`[^`]+`)/)
    .map((part, index) =>
      part.startsWith('`') && part.endsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : part,
    )
