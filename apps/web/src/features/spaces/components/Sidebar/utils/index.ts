export const getQuerySpaceId = (query: { spaceId?: string | string[] }): string | null => {
  const raw = query.spaceId
  return typeof raw === 'string' && raw.length > 0 ? raw : null
}

export const truncateSpaceName = (name: string, maxLength: number): string =>
  name.length > maxLength ? `${name.slice(0, maxLength)}...` : name

export const getSidebarItemTestId = (label: string): string =>
  `sidebar-item-${label.trim().toLowerCase().replace(/\s+/g, '-')}`

/** Action items are keyed by their stable id rather than their label, which is free to change. */
export const getSidebarActionItemTestId = (id: string): string => `sidebar-${id}-item`
