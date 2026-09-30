export const truncateSpaceName = (name: string, maxLength: number): string =>
  name.length > maxLength ? `${name.slice(0, maxLength)}...` : name

export const getSidebarItemTestId = (label: string): string =>
  `sidebar-item-${label.trim().toLowerCase().replace(/\s+/g, '-')}`

/** Action items are keyed by their stable id rather than their label, which is free to change. */
export const getSidebarActionItemTestId = (id: string): string => `sidebar-${id}-item`
