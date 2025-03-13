import { SignerSection } from './components/SignersList/SignersList'

export const groupedSigners: Record<string, SignerSection> = {
  imported: {
    title: 'Imported signers',
    data: [],
  },
  notImported: {
    title: 'Not imported signers',
    data: [],
  },
}
