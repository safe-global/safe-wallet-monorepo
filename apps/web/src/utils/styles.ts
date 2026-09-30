/**
 * Repo scrollbar convention: thin, rounded, themed thumb on a transparent track.
 * Apply to a `min-h-0` flex child that should scroll instead of growing.
 */
export const SCROLL_AREA =
  'min-h-0 flex-1 overflow-y-auto overscroll-y-none pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border'
