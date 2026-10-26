/**
 * Assets › Positions: one section per app, with a table per position group.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test.
 */
import { type Page, type Locator } from '@playwright/test'

export class PositionsPage {
  readonly positionsTab: Locator
  readonly totalValue: Locator
  readonly appSections: Locator

  constructor(readonly page: Page) {
    this.positionsTab = page.getByRole('tab', { name: 'Positions' })
    this.totalValue = page.getByText('Total positions value')
    this.appSections = page.locator('[data-slot="accordion-item"]')
  }

  /** The collapsible section of one app, found by the name in its header */
  appSection(appName: string): Locator {
    return this.appSections.filter({
      has: this.page.locator('[data-slot="accordion-trigger"]').getByText(appName, { exact: true }),
    })
  }

  /** The position groups of an app section, one table each, in page order */
  groups(section: Locator): Locator {
    return section.getByRole('table')
  }

  /** The title of a group: the first column header of its table */
  groupTitle(group: Locator): Locator {
    return group.getByRole('columnheader').first()
  }

  positionRows(group: Locator): Locator {
    return group.getByTestId('table-row')
  }
}
