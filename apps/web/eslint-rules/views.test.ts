import { RuleTester } from 'eslint'
import * as tsParser from '@typescript-eslint/parser'
import views from './views.mjs'

const ruleTester = new RuleTester({
  languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } },
})

ruleTester.run('views/no-markup-in-containers', views.rules['no-markup-in-containers'], {
  valid: [
    `import { AddressBookView } from '@views/features/address-book/AddressBookView'
     export const AddressBook = ({ rows }) => <AddressBookView rows={rows} onRemove={() => {}} />`,
    `export const Page = () => <Head><title>Safe{Wallet}</title></Head>`,
    `export const List = ({ items }) => <spaces.SpaceList key="list" items={items} />`,
    `import { Button } from '@/components/ui/input'
     export const X = () => <Button />`,
    `import type { ButtonProps } from '@/components/ui/button'`,
  ],
  invalid: [
    { code: `export const X = () => <div />`, errors: [{ messageId: 'hostElement' }] },
    { code: `export const X = () => <Card className="p-2" />`, errors: [{ messageId: 'styling' }] },
    { code: `export const X = () => <Card>Hello</Card>`, errors: [{ messageId: 'copy' }] },
    { code: `export const X = () => <Card>{'Hello'}</Card>`, errors: [{ messageId: 'copy' }] },
    { code: `export const X = () => <Card title="Owners" />`, errors: [{ messageId: 'copyProp' }] },
    { code: `import { Button } from '@/components/ui/button'`, errors: [{ messageId: 'primitive' }] },
  ],
})
