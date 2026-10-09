/** A CTA is either a navigation link (`href`) or an in-app action (`onClick`, e.g. open a tx flow). */
export type Cta = { label: string } & ({ href: string } | { onClick: () => void })
