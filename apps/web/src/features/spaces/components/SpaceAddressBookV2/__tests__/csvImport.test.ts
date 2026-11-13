import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { AddressBookCSVRow } from '@/components/address-book/ImportDialog'
import { Builder } from '@/tests/Builder'
import { toWorkspaceImport, validateWorkspaceRows } from '../csvImport'

const itemBuilder = () =>
  Builder.new<SpaceAddressBookItemDto>().with({
    name: faker.person.fullName(),
    address: checksumAddress(faker.finance.ethereumAddress()),
    chainIds: ['1'],
    createdBy: faker.internet.email(),
    createdByUserId: faker.number.int(),
    lastUpdatedBy: faker.internet.email(),
    lastUpdatedByUserId: faker.number.int(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  })

const newAddress = () => checksumAddress(faker.finance.ethereumAddress())
const SUPPORTED = ['1', '100']

describe('validateWorkspaceRows', () => {
  it('accepts rows with valid names on supported chains', () => {
    const rows: AddressBookCSVRow[] = [
      [newAddress(), 'Treasury', '1'],
      [newAddress(), 'Payroll', ' 100'],
    ]

    expect(validateWorkspaceRows(rows, [], SUPPORTED)).toBeUndefined()
  })

  it('names the first row on an unsupported chain', () => {
    const rows: AddressBookCSVRow[] = [
      [newAddress(), 'Treasury', '1'],
      [newAddress(), 'Payroll', '999'],
    ]

    expect(validateWorkspaceRows(rows, [], SUPPORTED)).toBe('Row 3: chain 999 is not supported')
  })

  it('names the first row whose name the workspace rejects', () => {
    const rows: AddressBookCSVRow[] = [[newAddress(), 'ab', '1']]

    expect(validateWorkspaceRows(rows, [], SUPPORTED)).toMatch(/^Row 2: /)
  })

  it('ignores the name of a saved contact, which keeps its saved name', () => {
    const saved = itemBuilder().build()
    const rows: AddressBookCSVRow[] = [[saved.address.toLowerCase(), 'ab', '100']]

    expect(validateWorkspaceRows(rows, [saved], SUPPORTED)).toBeUndefined()
  })
})

describe('toWorkspaceImport', () => {
  it('merges the rows of one address into a new contact on every chain', () => {
    const address = newAddress()
    const rows: AddressBookCSVRow[] = [
      [address, 'Treasury', '1'],
      [address.toLowerCase(), 'Treasury', '100'],
    ]

    expect(toWorkspaceImport(rows, [])).toEqual({
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

    expect(toWorkspaceImport(rows, []).items).toEqual([{ address, name: 'Second', chainIds: ['1'] }])
  })

  it('adds new chains to a saved contact and keeps its saved name and chains', () => {
    const saved = itemBuilder()
      .with({ chainIds: ['1'] })
      .build()
    const rows: AddressBookCSVRow[] = [[saved.address, faker.person.fullName(), '100']]

    expect(toWorkspaceImport(rows, [saved])).toEqual({
      items: [{ address: saved.address, name: saved.name, chainIds: ['1', '100'] }],
      newCount: 0,
      updatedCount: 1,
    })
  })

  it('leaves out a saved contact the file adds nothing to', () => {
    const saved = itemBuilder()
      .with({ chainIds: ['1', '100'] })
      .build()
    const rows: AddressBookCSVRow[] = [[saved.address, faker.person.fullName(), '100']]

    expect(toWorkspaceImport(rows, [saved])).toEqual({ items: [], newCount: 0, updatedCount: 0 })
  })

  it('ignores the tags column', () => {
    const address = newAddress()
    const rows: AddressBookCSVRow[] = [[address, 'Treasury', '1', 'Ops;Vendor']]

    expect(toWorkspaceImport(rows, []).items).toEqual([{ address, name: 'Treasury', chainIds: ['1'] }])
  })
})
