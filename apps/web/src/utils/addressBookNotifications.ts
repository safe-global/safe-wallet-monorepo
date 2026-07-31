// Shared between the personal address book (Redux listener) and the workspace
// address book dialog so the import success wording stays in sync.
export const getImportSuccessMessage = ({
  count,
  networkCount,
  scope,
}: {
  count: number
  networkCount: number
  scope: 'personal' | 'workspace'
}): string => {
  const contactLabel = count === 1 ? 'contact' : 'contacts'
  const base = `${count} ${contactLabel} imported to your ${scope} address book`

  return networkCount > 1
    ? `${base} across ${networkCount} networks. Only contacts on the current network are shown here`
    : base
}
