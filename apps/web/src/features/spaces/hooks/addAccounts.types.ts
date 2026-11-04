export type AddAccountsFormValues = {
  selectedSafes: Record<string, boolean>
  /** Workspace name per lowercased address, collected in the naming step. */
  names: Record<string, string>
}
