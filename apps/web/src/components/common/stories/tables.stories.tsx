import type { Meta, StoryObj } from '@storybook/react'

import {
  Family,
  Row,
  Swatch,
  StoryLink,
  LinkGroup,
  WhereUsed,
  CatalogRow,
} from '@safe-global/design-system/stories/gallery-kit'
import EnhancedTable from '@/components/common/EnhancedTable'
import TableCard from '@/components/common/TableCard'

/**
 * The app's table types — the grids built on top of the design system's `Table` shell.
 *
 * These are Safe-specific (untyped rows, chain-aware cells, tx-confirmation key/value lists), so
 * they live here rather than in the design system, whose `Design System → Tables` story covers the
 * shell itself. The review questions below are about which of these should survive.
 */
const meta = {
  title: 'Components/Common/Tables',
  parameters: {
    layout: 'padded',
    // Reference gallery — visual but partly interactive; keep it out of image snapshots.
    visualTest: { disable: true },
  },
  tags: ['skip-visual-test'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => {
    const headCells = [
      { id: 'name', label: 'Name', width: '45%' },
      { id: 'role', label: 'Role', width: '30%' },
      { id: 'threshold', label: 'Threshold', width: '25%', disableSort: true },
    ]
    const rows = [
      {
        key: 'a',
        cells: {
          name: { content: 'alice.eth', rawValue: 'alice.eth' },
          role: { content: 'Owner', rawValue: 'Owner' },
          threshold: { content: '2 of 3', rawValue: '2' },
        },
      },
      {
        key: 'b',
        cells: {
          name: { content: 'bob.eth', rawValue: 'bob.eth' },
          role: { content: 'Owner', rawValue: 'Owner' },
          threshold: { content: '2 of 3', rawValue: '2' },
        },
      },
      {
        key: 'c',
        cells: {
          name: { content: 'carol.eth', rawValue: 'carol.eth' },
          role: { content: 'Proposer', rawValue: 'Proposer' },
          threshold: { content: '—', rawValue: '' },
        },
      },
    ]
    return (
      <Family
        title="Tables"
        lead={
          <>
            We don&apos;t hand-build raw <code>Table</code>s — you pick a table <em>type</em>. Below are the ones we
            ship. The open question for the review: the two generic grids (<code>EnhancedTable</code> and{' '}
            <code>PaginatedDataTable</code>) overlap — should they unify?
          </>
        }
      >
        <Row
          label="Default grid — EnhancedTable"
          note="shown in its card wrapper (TableCard), the way it renders in the app — sortable, paginated, sticky"
        >
          <Swatch
            label="TableCard › EnhancedTable"
            use="Untyped rows + headCells. ~9 consumers (AssetsTable, OwnerList, ProposersList, NestedSafesList…). Always wrapped in a card surface — never rendered bare."
            review="Is the newer PaginatedDataTable its successor? If yes, ~9 consumers need migrating; if no, draw a clear boundary — and their pagination differs, so pick one."
            to="Components/Common/EnhancedTable"
            toLabel="EnhancedTable"
          >
            <div className="w-full max-w-2xl rounded-lg bg-[var(--color-background-main)] p-6">
              <TableCard>
                <EnhancedTable headCells={headCells} rows={rows} />
              </TableCard>
            </div>
          </Swatch>
        </Row>

        <section>
          <h3 className="mb-1 text-xs font-semibold tracking-wider text-foreground uppercase">Which table for what</h3>
          <p className="mb-2 text-xs text-muted-foreground">
            the other types we ship — open each in its own story to see it live
          </p>
          <ul className="flex flex-col">
            <CatalogRow
              name="PaginatedDataTable"
              use="Newer typed-column grid (alignment, emphasis, sticky, responsive column drop). Powers the Spaces address book, members and requests."
              to="Features/Spaces/PaginatedDataTable"
              review="The generic-grid overlap with EnhancedTable is the main thing to resolve; its own note wants the bounded column variants promoted onto the ui/table primitive."
            />
            <CatalogRow
              name="SafeAccountsTable"
              use="My accounts / Workspaces — drag-reorder + multi-chain grouping + selection. Hand-assembled, not a generic grid."
              to="Features/MyAccounts/SafeAccountsTable"
            />
            <CatalogRow
              name="AssetsTable"
              use="Balances — desktop table, mobile cards."
              to="Components/Balances/AssetsTable"
            />
            <CatalogRow
              name="NftGrid"
              use="NFT collections."
              to="Features/Nfts/NftGrid"
              review="Borrows EnhancedTable's CSS module instead of the component — render through it, or promote shared cell styles onto the primitive?"
            />
            <CatalogRow
              name="DataTable"
              use="NOT a grid — a read-only key/value list used in tx confirmations (Bridge, Swap, Vault)."
              to="Components/Common/DataTable"
              review="Naming collision with PaginatedDataTable / DataTableColumn — rename it (DataList / SummaryList)?"
            />
            <CatalogRow
              name="TableCard"
              use="The card wrapper, not a table — the single source of truth for the 'table inside a card' look (bg-card, rounded, padded, in-card row polish). Address book, Spaces team & contacts wrap their grid in it."
              review="AssetsTable uses its own Card wrapper instead — should every grid go through TableCard so the surface is consistent?"
            />
          </ul>
        </section>

        <WhereUsed>
          <LinkGroup label="Pages">
            <StoryLink title="Pages/Core/AddressBook">Address book</StoryLink>
            <StoryLink title="Pages/Core/Balances">Assets</StoryLink>
          </LinkGroup>
        </WhereUsed>
      </Family>
    )
  },
}
