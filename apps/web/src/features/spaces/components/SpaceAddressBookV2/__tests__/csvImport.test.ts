import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { CONTACT_TAG_LIMIT_MESSAGE } from '@safe-global/utils/validation/tags'
import type { AddressBookCSVRow } from '@/components/address-book/ImportDialog'
import {
  buildSpaceAddressBookTags,
  spaceAddressBookItemBuilder,
  spaceAddressBookTagBuilder,
} from '@/tests/builders/space'
import { MAX_CONTACTS_PER_WORKSPACE, toWorkspaceImport, validateWorkspaceRows } from '../csvImport'

const newAddress = () => checksumAddress(faker.finance.ethereumAddress())
const SUPPORTED = ['1', '100']

describe('validateWorkspaceRows', () => {
  it('accepts rows with valid names on supported chains', () => {
    const rows: AddressBookCSVRow[] = [
      [newAddress(), 'Treasury', '1'],
      [newAddress(), 'Payroll', ' 100'],
    ]

    expect(validateWorkspaceRows(rows, [], [], SUPPORTED)).toBeUndefined()
  })

  it('names the first row on an unsupported chain', () => {
    const rows: AddressBookCSVRow[] = [
      [newAddress(), 'Treasury', '1'],
      [newAddress(), 'Payroll', '999'],
    ]

    expect(validateWorkspaceRows(rows, [], [], SUPPORTED)).toBe('Row 3: chain 999 is not supported')
  })

  it('names the first row whose name the workspace rejects', () => {
    const rows: AddressBookCSVRow[] = [[newAddress(), 'ab', '1']]

    expect(validateWorkspaceRows(rows, [], [], SUPPORTED)).toMatch(/^Row 2: /)
  })

  it('ignores the name of a saved contact, which keeps its saved name', () => {
    const saved = spaceAddressBookItemBuilder().build()
    const rows: AddressBookCSVRow[] = [[saved.address.toLowerCase(), 'ab', '100']]

    expect(validateWorkspaceRows(rows, [saved], [], SUPPORTED)).toBeUndefined()
  })

  it('accepts a blank tags cell', () => {
    const rows: AddressBookCSVRow[] = [[newAddress(), 'Treasury', '1', '']]

    expect(validateWorkspaceRows(rows, [], [], SUPPORTED)).toBeUndefined()
  })

  it('names the first row with a tag the workspace rejects', () => {
    const rows: AddressBookCSVRow[] = [
      [newAddress(), 'Treasury', '1', 'Ops'],
      [newAddress(), 'Payroll', '1', 'Ops;Signer'],
    ]

    expect(validateWorkspaceRows(rows, [], [], SUPPORTED)).toBe(
      "Row 3: 'Signer' is added automatically and can't be used as a tag name",
    )
  })

  it('names the row that takes a contact past its tag limit, counting the saved tags', () => {
    const [ops, vendor] = buildSpaceAddressBookTags(2)
    const saved = spaceAddressBookItemBuilder()
      .with({ tagIds: [ops.id, vendor.id] })
      .build()
    const rows: AddressBookCSVRow[] = [
      [saved.address, saved.name, '1', ops.name.toUpperCase()],
      [saved.address, saved.name, '100', 'Payroll;Finance'],
    ]

    expect(validateWorkspaceRows(rows, [saved], [ops, vendor], SUPPORTED)).toBe(`Row 3: ${CONTACT_TAG_LIMIT_MESSAGE}`)
  })

  it('names the row that takes the workspace past its tag limit', () => {
    const tags = buildSpaceAddressBookTags(7)
    const rows: AddressBookCSVRow[] = [
      [newAddress(), 'Treasury', '1', tags[0].name],
      [newAddress(), 'Payroll', '1', 'Finance'],
      [newAddress(), 'Vendor', '1', 'Legal'],
    ]

    expect(validateWorkspaceRows(rows, [], tags, SUPPORTED)).toBe('Row 4: a workspace can have at most 8 tags')
  })

  it('blocks a file that takes the workspace past its contact limit', () => {
    const savedItems = Array.from({ length: MAX_CONTACTS_PER_WORKSPACE - 1 }, () =>
      spaceAddressBookItemBuilder().build(),
    )
    const rows: AddressBookCSVRow[] = [
      [savedItems[0].address, savedItems[0].name, '100'],
      [newAddress(), 'Treasury', '1'],
      [newAddress(), 'Payroll', '1'],
    ]

    expect(validateWorkspaceRows(rows, savedItems, [], SUPPORTED)).toBe(
      'This file adds 2 contacts, but the workspace has room for 1 more (at most 500)',
    )
  })
})

describe('toWorkspaceImport', () => {
  it('merges the rows of one address into a new contact on every chain', () => {
    const address = newAddress()
    const rows: AddressBookCSVRow[] = [
      [address, 'Treasury', '1'],
      [address.toLowerCase(), 'Treasury', '100'],
    ]

    expect(toWorkspaceImport(rows, [], [])).toEqual({
      items: [{ address, name: 'Treasury', chainIds: ['1', '100'] }],
      newCount: 1,
      updatedCount: 0,
    })
  })

  it('keeps the last name when the file names an address twice', () => {
    const address = newAddress()
    const rows: AddressBookCSVRow[] = [
      [address, 'First', '1'],
      [address, 'Second', '1'],
    ]

    expect(toWorkspaceImport(rows, [], []).items).toEqual([{ address, name: 'Second', chainIds: ['1'] }])
  })

  it('adds new chains to a saved contact and keeps its saved name and chains', () => {
    const saved = spaceAddressBookItemBuilder()
      .with({ chainIds: ['1'] })
      .build()
    const rows: AddressBookCSVRow[] = [[saved.address, faker.person.fullName(), '100']]

    expect(toWorkspaceImport(rows, [saved], [])).toEqual({
      items: [{ address: saved.address, name: saved.name, chainIds: ['1', '100'] }],
      newCount: 0,
      updatedCount: 1,
    })
  })

  it('leaves out a saved contact the file adds nothing to', () => {
    const tag = spaceAddressBookTagBuilder().build()
    const saved = spaceAddressBookItemBuilder()
      .with({ chainIds: ['1', '100'], tagIds: [tag.id] })
      .build()
    const rows: AddressBookCSVRow[] = [[saved.address, faker.person.fullName(), '100', tag.name.toLowerCase()]]

    expect(toWorkspaceImport(rows, [saved], [tag])).toEqual({ items: [], newCount: 0, updatedCount: 0 })
  })

  it("gives a new contact the file's tags from all its rows", () => {
    const address = newAddress()
    const rows: AddressBookCSVRow[] = [
      [address, 'Treasury', '1', 'Ops; Vendor'],
      [address, 'Treasury', '100', 'Ops;Vendor;'],
    ]

    expect(toWorkspaceImport(rows, [], []).items).toEqual([
      { address, name: 'Treasury', chainIds: ['1', '100'], tags: ['Ops', 'Vendor'] },
    ])
  })

  it('spells a tag the workspace has the way the workspace does', () => {
    const tag = spaceAddressBookTagBuilder().with({ name: 'Vendor' }).build()
    const address = newAddress()
    const rows: AddressBookCSVRow[] = [[address, 'Treasury', '1', 'vendor']]

    expect(toWorkspaceImport(rows, [], [tag]).items[0].tags).toEqual(['Vendor'])
  })

  it('adds the file tags to the saved ones, and sends no tags when they are unchanged', () => {
    const [team, ops] = buildSpaceAddressBookTags(2)
    const tagged = spaceAddressBookItemBuilder()
      .with({ chainIds: ['1'], tagIds: [team.id] })
      .build()
    const untouched = spaceAddressBookItemBuilder()
      .with({ chainIds: ['1'], tagIds: [team.id] })
      .build()
    const rows: AddressBookCSVRow[] = [
      [tagged.address, tagged.name, '1', `${ops.name};Payroll`],
      [untouched.address, untouched.name, '100', ''],
    ]

    expect(toWorkspaceImport(rows, [tagged, untouched], [team, ops])).toEqual({
      items: [
        { address: tagged.address, name: tagged.name, chainIds: ['1'], tags: [team.name, ops.name, 'Payroll'] },
        { address: untouched.address, name: untouched.name, chainIds: ['1', '100'] },
      ],
      newCount: 0,
      updatedCount: 2,
    })
  })
})
