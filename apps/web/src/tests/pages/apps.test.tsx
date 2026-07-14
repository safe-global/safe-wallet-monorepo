import { userEvent } from '@testing-library/user-event'
import React, { act } from 'react'
import { SafeAppAccessPolicyTypes } from '@safe-global/store/gateway/types'
import {
  transactionBuilderSafeApp,
  compoundSafeApp,
  ensSafeApp,
  synthetixSafeApp,
} from '@safe-global/test/msw/mockSafeApps'

import { render, screen, waitFor, fireEvent, getByRole, getByText, within, createAppNameRegex } from '../test-utils'
import AppsPage from '@/pages/apps'
import CustomSafeAppsPage from '@/pages/apps/custom'
import * as safeAppsService from '@/services/safe-apps/manifest'
import { LS_NAMESPACE } from '@/config/constants'
import * as chainHooks from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useParams: jest.fn(() => ({ safe: 'matic:0x0000000000000000000000000000000000000000' })),
}))

describe('AppsPage', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    window.localStorage.clear()

    const mockChain = chainBuilder().with({ chainId: '137', shortName: 'matic', chainName: 'Polygon' }).build()

    jest.spyOn(chainHooks, 'default').mockImplementation(() => ({
      configs: [mockChain],
      error: undefined,
      loading: false,
    }))
    jest.spyOn(chainHooks, 'useChain').mockImplementation(() => mockChain)
    jest.spyOn(chainHooks, 'useCurrentChain').mockImplementation(() => mockChain)
    jest.spyOn(chainHooks, 'useHasFeature').mockImplementation(() => true)
  })

  describe('Safe Apps List Page', () => {
    it('shows safe apps list section', async () => {
      render(<AppsPage />, {
        routerProps: {
          pathname: '/apps',
          query: {
            safe: 'matic:0x0000000000000000000000000000000000000000',
          },
        },
      })

      await waitFor(() => {
        expect(screen.getByText('Compound', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
        expect(screen.getByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
        expect(
          screen.getByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
        ).toBeInTheDocument()
        expect(screen.getByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
      })
    })

    it('shows Safe app details when you click on the Safe app card', async () => {
      render(<AppsPage />, {
        routerProps: {
          pathname: '/apps',
          query: {
            safe: 'matic:0x0000000000000000000000000000000000000000',
          },
        },
      })

      // drawer is not present
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // clicks on Transaction Builder Safe App
      await waitFor(() => {
        fireEvent.click(screen.getByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }))
      })

      await waitFor(() => {
        const safeAppPreviewDrawer = screen.getByRole('dialog')
        expect(safeAppPreviewDrawer).toBeInTheDocument()
        // Transaction Builder Safe App title
        expect(getByRole(safeAppPreviewDrawer, 'heading', { level: 4, name: 'Transaction Builder' }))
        // open app button should be present
        expect(getByText(safeAppPreviewDrawer, 'Open Safe App'))
      })
    })
  })

  describe('Bookmarked Safe apps Page', () => {
    it('shows Bookmarked safe apps section', async () => {
      // mock 2 Bookmarked Safe Apps
      const mockedBookmarkedSafeApps = {
        137: { pinned: [compopundSafeAppMock.id, transactionBuilderSafeAppMock.id] },
      }

      window.localStorage.setItem(`${LS_NAMESPACE}safeApps`, JSON.stringify(mockedBookmarkedSafeApps))

      render(<AppsPage />, {
        routerProps: {
          pathname: '/apps',
          query: {
            safe: 'matic:0x0000000000000000000000000000000000000000',
          },
        },
      })

      // pinned apps show the "Unpin" tooltip, unpinned apps show the "Pin" tooltip
      await waitFor(() => {
        expect(screen.queryByText('My pinned apps (2)')).toBeInTheDocument()
      })
      await expectBookmarkTooltip('Compound', 'Unpin Compound')
      await expectBookmarkTooltip('Transaction Builder', 'Unpin Transaction Builder')
      await expectBookmarkTooltip('ENS App', 'Pin ENS App')
      await expectBookmarkTooltip('Synthetix', 'Pin Synthetix')
    })

    it('unpin a Safe app', async () => {
      // mock 2 Bookmarked Safe Apps
      const mockedBookmarkedSafeApps = {
        137: { pinned: [compopundSafeAppMock.id, transactionBuilderSafeAppMock.id] },
      }

      window.localStorage.setItem(`${LS_NAMESPACE}safeApps`, JSON.stringify(mockedBookmarkedSafeApps))

      render(<AppsPage />, {
        routerProps: {
          pathname: '/apps',
          query: {
            safe: 'matic:0x0000000000000000000000000000000000000000',
          },
        },
      })

      // both apps start pinned (show the "Unpin" tooltip)
      await waitFor(() => {
        expect(screen.queryByText('My pinned apps (2)')).toBeInTheDocument()
      })
      await expectBookmarkTooltip('Compound', 'Unpin Compound')
      await expectBookmarkTooltip('Transaction Builder', 'Unpin Transaction Builder')

      // unpin Transaction Builder Safe App
      fireEvent.click(getBookmarkButton('Transaction Builder'))

      // Compound stays pinned, Transaction Builder is now unpinned (shows the "Pin" tooltip)
      await waitFor(() => {
        expect(screen.queryByText('My pinned apps (1)')).toBeInTheDocument()
      })
      await expectBookmarkTooltip('Compound', 'Unpin Compound')
      await expectBookmarkTooltip('Transaction Builder', 'Pin Transaction Builder')
    })

    it('shows Safe app details when you click on the Safe app card', async () => {
      // mock 2 Bookmarked Safe Apps
      const mockedBookmarkedSafeApps = {
        137: { pinned: [compopundSafeAppMock.id, transactionBuilderSafeAppMock.id] },
      }

      window.localStorage.setItem(`${LS_NAMESPACE}safeApps`, JSON.stringify(mockedBookmarkedSafeApps))

      render(<AppsPage />, {
        routerProps: {
          pathname: '/apps',
          query: {
            safe: 'matic:0x0000000000000000000000000000000000000000',
          },
        },
      })

      // drawer is not present
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // clicks on Transaction Builder Safe App
      await waitFor(() => {
        fireEvent.click(screen.getByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }))
      })

      await waitFor(() => {
        const safeAppPreviewDrawer = screen.getByRole('dialog')
        expect(safeAppPreviewDrawer).toBeInTheDocument()
        // Transaction Builder Safe App title
        expect(getByRole(safeAppPreviewDrawer, 'heading', { level: 4, name: 'Transaction Builder' }))
        // open app button should be present
        expect(getByText(safeAppPreviewDrawer, 'Open Safe App'))
      })
    })
  })

  describe('Custom Safe apps Page', () => {
    it('shows Custom safe apps section', async () => {
      render(<CustomSafeAppsPage />, {
        routerProps: {
          pathname: '/apps/custom',
          query: {
            safe: 'matic:0x0000000000000000000000000000000000000000',
          },
        },
      })

      await waitFor(() => {
        // show add custom app card
        expect(screen.getByRole('button', { name: 'Add custom Safe App' }))
      })

      // Add custom app modal is not present
      expect(screen.queryByRole('presentation')).not.toBeInTheDocument()

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Add custom Safe App' }))
      })

      // shows Add custom app modal
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: /Add custom Safe App/i })).toBeInTheDocument()

        // shows custom safe App App Url input
        const customSafeAppURLInput = screen.getByLabelText(/Safe App URL/)
        expect(customSafeAppURLInput).toBeInTheDocument()
      })
    })

    it('adds a Custom Safe App', async () => {
      const APP_URL = 'https://apps.safe.global/test-custom-app'

      jest.spyOn(safeAppsService, 'fetchSafeAppFromManifest').mockResolvedValueOnce({
        id: 12345,
        url: APP_URL,
        name: 'Custom test Safe app',
        description: 'Custom Safe app description',
        accessControl: {
          type: SafeAppAccessPolicyTypes.NoRestrictions,
        },
        tags: [],
        features: [],
        socialProfiles: [],
        developerWebsite: '',
        chainIds: ['1', '4', '137'],
        iconUrl: '',
        safeAppsPermissions: [],
        featured: false,
      })

      render(<CustomSafeAppsPage />, {
        routerProps: {
          pathname: '/apps/custom',
          query: {
            safe: 'matic:0x0000000000000000000000000000000000000000',
          },
        },
      })

      await userEvent.click(screen.getByRole('button', { name: 'Add custom Safe App' }))

      await waitFor(() => expect(screen.getByLabelText(/Safe App URL/)).toBeInTheDocument())
      const appURLInput = screen.getByLabelText(/Safe App URL/)
      fireEvent.change(appURLInput, { target: { value: APP_URL } })
      const riskCheckbox = await screen.findByRole('checkbox')
      await userEvent.click(riskCheckbox)
      await waitFor(() =>
        expect(
          screen.getByRole('heading', {
            name: /Custom test Safe app/i,
          }),
        ).toBeInTheDocument(),
      )
      await userEvent.click(screen.getByText('Add'))

      // modal is closed (shadcn Dialog unmounts the field synchronously, so wait for absence)
      await waitFor(() => expect(screen.queryByLabelText(/Safe App URL/)).not.toBeInTheDocument())

      // custom safe app is present in the list
      expect(screen.queryByText('Custom test Safe app')).toBeInTheDocument()

      // shows safe app description drawer is not present
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // clicks on Custom test Safe app Safe App
      await userEvent.click(screen.getByText('Custom test Safe app', { selector: '[data-variant="paragraph-bold"]' }))

      await waitFor(() => {
        const safeAppPreviewDrawer = screen.getByRole('dialog')
        expect(safeAppPreviewDrawer).toBeInTheDocument()
        // Custom test Safe app Safe App title
        expect(getByRole(safeAppPreviewDrawer, 'heading', { level: 4, name: 'Custom test Safe app' }))
        // open app button should be present
        expect(getByText(safeAppPreviewDrawer, 'Open Safe App'))
      })
    })

    it('Shows an error label if the app doesnt support Safe App functionality', async () => {
      const INVALID_SAFE_APP_URL = 'https://google.com'
      render(<CustomSafeAppsPage />, {
        routerProps: {
          pathname: '/apps/custom',
          query: {
            safe: 'matic:0x0000000000000000000000000000000000000000',
          },
        },
      })
      await waitFor(() => expect(screen.getByText('Add custom Safe App')).toBeInTheDocument())
      const addCustomAppButton = screen.getByText('Add custom Safe App')
      act(() => {
        fireEvent.click(addCustomAppButton)
      })
      await waitFor(() => expect(screen.getByLabelText(/Safe App URL/)).toBeInTheDocument(), { timeout: 3000 })
      const appURLInput = screen.getByLabelText(/Safe App URL/)
      fireEvent.change(appURLInput, { target: { value: INVALID_SAFE_APP_URL } })
      await waitFor(
        () => {
          expect(screen.getByText(/the app doesn't support Safe App functionality/i)).toBeInTheDocument()
        },
        { timeout: 5000 },
      )
    })

    it('Requires risk acknowledgment checkbox to add the app', async () => {
      const APP_URL = 'https://apps.safe.global/test-custom-app'

      jest.spyOn(safeAppsService, 'fetchSafeAppFromManifest').mockResolvedValueOnce({
        id: 12345,
        url: APP_URL,
        name: 'Custom test Safe app',
        description: 'Custom Safe app description',
        accessControl: {
          type: SafeAppAccessPolicyTypes.NoRestrictions,
        },
        tags: [],
        features: [],
        socialProfiles: [],
        developerWebsite: '',
        chainIds: ['1', '4', '137'],
        iconUrl: '',
        safeAppsPermissions: [],
        featured: false,
      })

      render(<CustomSafeAppsPage />, {
        routerProps: {
          pathname: '/apps/custom',
          query: {
            safe: 'matic:0x0000000000000000000000000000000000000000',
          },
        },
      })
      await waitFor(() => expect(screen.getByText('Add custom Safe App')).toBeInTheDocument())

      const addCustomAppButton = screen.getByText('Add custom Safe App')
      await userEvent.click(addCustomAppButton)

      await waitFor(() => expect(screen.getByLabelText(/Safe App URL/)).toBeInTheDocument(), { timeout: 3000 })

      const appURLInput = screen.getByLabelText(/Safe App URL/)
      await userEvent.type(appURLInput, APP_URL)

      const riskCheckbox = await screen.findByText(
        createAppNameRegex(`This Safe App is not part of {APP_NAME} and I agree to use it at my own risk\\.`),
      )

      await userEvent.click(riskCheckbox)
      await userEvent.click(riskCheckbox)

      await waitFor(() => expect(screen.getByText('Accepting the disclaimer is mandatory')).toBeInTheDocument())
    })

    it('allows removing custom apps', async () => {
      const APP_URL = 'https://apps.safe.global/test-custom-app'

      jest.spyOn(safeAppsService, 'fetchSafeAppFromManifest').mockResolvedValueOnce({
        id: 12345,
        url: APP_URL,
        name: 'Custom test Safe app',
        description: 'Custom Safe app description',
        accessControl: {
          type: SafeAppAccessPolicyTypes.NoRestrictions,
        },
        tags: [],
        features: [],
        socialProfiles: [],
        developerWebsite: '',
        chainIds: ['1', '4', '137'],
        iconUrl: '',
        safeAppsPermissions: [],
        featured: false,
      })

      render(<CustomSafeAppsPage />, {
        routerProps: {
          pathname: '/apps/custom',
          query: {
            safe: 'matic:0x0000000000000000000000000000000000000000',
          },
        },
      })

      await userEvent.click(screen.getByRole('button', { name: 'Add custom Safe App' }))

      await waitFor(() => expect(screen.getByLabelText(/Safe App URL/)).toBeInTheDocument())
      const appURLInput = screen.getByLabelText(/Safe App URL/)
      fireEvent.change(appURLInput, { target: { value: APP_URL } })
      const riskCheckbox = await screen.findByRole('checkbox')
      await userEvent.click(riskCheckbox)

      await waitFor(() =>
        expect(
          screen.getByRole('heading', {
            name: /Custom test Safe app/i,
          }),
        ).toBeInTheDocument(),
      )

      await userEvent.click(screen.getByText('Add'))

      // modal is closed (shadcn Dialog unmounts the field synchronously, so wait for absence)
      await waitFor(() => expect(screen.queryByLabelText(/Safe App URL/)).not.toBeInTheDocument())

      // The delete label moved from a MUI aria-label to a hover-only tooltip; the delete toggle is
      // the last action button on the custom app card.
      const customAppCardButtons = within(getSafeAppCard('Custom test Safe app')).getAllByRole('button')
      const removeCustomSafeAppButton = customAppCardButtons[customAppCardButtons.length - 1]

      await userEvent.click(removeCustomSafeAppButton)

      await waitFor(() => expect(screen.getByText('Confirm Safe App removal')).toBeInTheDocument())

      const confirmRemovalButton = screen.getByRole('button', { name: 'Remove' })
      await userEvent.click(confirmRemovalButton)

      await waitFor(() => expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument())
      expect(screen.queryByText('Custom test Safe app')).not.toBeInTheDocument()
    })
  })

  describe('feature gate', () => {
    it('renders nothing while the chains config is still loading (feature === undefined)', () => {
      jest.spyOn(chainHooks, 'useHasFeature').mockImplementation(() => undefined)

      render(<AppsPage />, {
        routerProps: { pathname: '/apps', query: { safe: 'matic:0x0000000000000000000000000000000000000000' } },
      })

      expect(screen.queryByText('Safe Apps are not available on this network.')).not.toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Search by name or category')).not.toBeInTheDocument()
    })

    it('shows the not-available message when Safe Apps are disabled (feature === false)', () => {
      jest.spyOn(chainHooks, 'useHasFeature').mockImplementation(() => false)

      render(<AppsPage />, {
        routerProps: { pathname: '/apps', query: { safe: 'matic:0x0000000000000000000000000000000000000000' } },
      })

      expect(screen.getByText('Safe Apps are not available on this network.')).toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Search by name or category')).not.toBeInTheDocument()
    })
  })

  describe('Safe Apps Filters', () => {
    describe('search by Safe App name and description', () => {
      it('search by Safe App name', async () => {
        render(<AppsPage />, {
          routerProps: {
            pathname: '/apps',
            query: {
              safe: 'matic:0x0000000000000000000000000000000000000000',
            },
          },
        })

        await waitFor(() => {
          expect(screen.getByText('Compound', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(
            screen.getByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
        })

        const query = 'Transaction'

        const searchInput = screen.getByPlaceholderText('Search by name or category')
        fireEvent.change(searchInput, { target: { value: query } })

        await waitFor(() => {
          expect(
            screen.queryByText('Compound', { selector: '[data-variant="paragraph-bold"]' }),
          ).not.toBeInTheDocument()
          expect(screen.queryByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).not.toBeInTheDocument()
          expect(
            screen.queryByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(
            screen.queryByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' }),
          ).not.toBeInTheDocument()
        })
      })

      it('search by Safe App description', async () => {
        render(<AppsPage />, {
          routerProps: {
            pathname: '/apps',
            query: {
              safe: 'matic:0x0000000000000000000000000000000000000000',
            },
          },
        })

        await waitFor(() => {
          expect(screen.getByText('Compound', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(
            screen.getByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
        })

        const query = transactionBuilderSafeAppMock.description

        const searchInput = screen.getByPlaceholderText('Search by name or category')
        fireEvent.change(searchInput, { target: { value: query } })

        await waitFor(() => {
          expect(
            screen.queryByText('Compound', { selector: '[data-variant="paragraph-bold"]' }),
          ).not.toBeInTheDocument()
          expect(screen.queryByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).not.toBeInTheDocument()
          expect(
            screen.queryByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(
            screen.queryByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' }),
          ).not.toBeInTheDocument()
        })
      })

      it('show zero results component', async () => {
        render(<AppsPage />, {
          routerProps: {
            pathname: '/apps',
            query: {
              safe: 'matic:0x0000000000000000000000000000000000000000',
            },
          },
        })

        await waitFor(() => {
          expect(screen.getByText('Compound', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(
            screen.getByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
        })

        const query = 'zero results'

        const searchInput = screen.getByPlaceholderText('Search by name or category')

        act(() => fireEvent.change(searchInput, { target: { value: query } }))

        await waitFor(() => {
          expect(
            screen.queryByText('Compound', { selector: '[data-variant="paragraph-bold"]' }),
          ).not.toBeInTheDocument()
          expect(screen.queryByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).not.toBeInTheDocument()
          expect(
            screen.queryByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).not.toBeInTheDocument()
          expect(
            screen.queryByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' }),
          ).not.toBeInTheDocument()

          // zero results component
          expect(screen.getByText('No Safe Apps found', { exact: false })).toBeInTheDocument()
        })
      })
    })

    describe('filter by category', () => {
      it('filters by Safe App category', async () => {
        render(<AppsPage />, {
          routerProps: {
            pathname: '/apps',
            query: {
              safe: 'matic:0x0000000000000000000000000000000000000000',
            },
          },
        })

        await waitFor(() => {
          expect(screen.getByText('Compound', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(
            screen.getByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
        })

        await userEvent.click(screen.getByRole('combobox', { name: /category/i }))

        const categoriesDropdown = within(await screen.findByRole('listbox'))

        // show only visible options in the categories dropdown
        await waitFor(() => expect(categoriesDropdown.getByText('Infrastructure')).toBeInTheDocument())

        // internal categories are not displayed
        await waitFor(() => expect(categoriesDropdown.queryByText('transaction-builder')).not.toBeInTheDocument())

        // filter by Infrastructure category
        await userEvent.click(categoriesDropdown.getByText('Infrastructure'))

        // close the dropdown
        await userEvent.keyboard('{Escape}')

        await waitFor(() => {
          // 1 categories selected label
          expect(screen.queryByText('1 categories selected')).toBeInTheDocument()
          expect(
            screen.queryByText('Compound', { selector: '[data-variant="paragraph-bold"]' }),
          ).not.toBeInTheDocument()
          expect(screen.queryByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).not.toBeInTheDocument()
          expect(
            screen.queryByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(
            screen.queryByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' }),
          ).not.toBeInTheDocument()
        })
      })

      it('clear a selected category', async () => {
        render(<AppsPage />, {
          routerProps: {
            pathname: '/apps',
            query: {
              safe: 'matic:0x0000000000000000000000000000000000000000',
            },
          },
        })

        await waitFor(() => {
          expect(screen.getByText('Compound', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(
            screen.getByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
        })

        await userEvent.click(screen.getByRole('combobox', { name: /category/i }))

        const categoriesDropdown = within(await screen.findByRole('listbox'))

        // filter by Infrastructure category
        await userEvent.click(categoriesDropdown.getByText('Infrastructure'))

        await waitFor(() => {
          expect(
            screen.queryByText('Compound', { selector: '[data-variant="paragraph-bold"]' }),
          ).not.toBeInTheDocument()
          expect(screen.queryByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).not.toBeInTheDocument()
          expect(
            screen.queryByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(
            screen.queryByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' }),
          ).not.toBeInTheDocument()
        })

        // clear active Infrastructure filter
        await userEvent.click(categoriesDropdown.getByText('Infrastructure'))

        // close the dropdown
        await userEvent.keyboard('{Escape}')

        // show all safe apps again
        await waitFor(() => {
          expect(screen.getByText('Compound', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(
            screen.getByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
        })
      })

      it('clear all selected categories', async () => {
        render(<AppsPage />, {
          routerProps: {
            pathname: '/apps',
            query: {
              safe: 'matic:0x0000000000000000000000000000000000000000',
            },
          },
        })

        await waitFor(() => {
          expect(screen.getByText('Compound', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(
            screen.getByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
        })

        await userEvent.click(screen.getByRole('combobox', { name: /category/i }))

        const categoriesDropdown = within(await screen.findByRole('listbox'))

        // filter by Infrastructure category
        await userEvent.click(categoriesDropdown.getByText('Infrastructure'))

        await waitFor(() => {
          expect(
            screen.queryByText('Compound', { selector: '[data-variant="paragraph-bold"]' }),
          ).not.toBeInTheDocument()
          expect(screen.queryByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).not.toBeInTheDocument()
          expect(
            screen.queryByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(
            screen.queryByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' }),
          ).not.toBeInTheDocument()
        })

        // close the dropdown
        await userEvent.keyboard('{Escape}')

        // clear all selected filters
        await userEvent.click(screen.getByLabelText('clear selected categories'))

        // show all safe apps again
        await waitFor(() => {
          expect(screen.getByText('Compound', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(
            screen.getByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
        })
      })
    })

    describe('filter by optimized for batch transactions', () => {
      it('filters by optimized for batch transactions', async () => {
        render(<AppsPage />, {
          routerProps: {
            pathname: '/apps',
            query: {
              safe: 'matic:0x0000000000000000000000000000000000000000',
            },
          },
        })

        await waitFor(() => {
          expect(screen.getByText('Compound', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(
            screen.getByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
        })

        // filter by optimized for batch transactions
        act(() => fireEvent.click(screen.getByRole('checkbox', { checked: false })))

        // show only transaction builder safe app
        await waitFor(() => {
          expect(
            screen.queryByText('Compound', { selector: '[data-variant="paragraph-bold"]' }),
          ).not.toBeInTheDocument()
          expect(screen.queryByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).not.toBeInTheDocument()
          expect(
            screen.queryByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(
            screen.queryByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' }),
          ).not.toBeInTheDocument()
        })
      })

      it('clears optimized for batch transactions checkbox', async () => {
        render(<AppsPage />, {
          routerProps: {
            pathname: '/apps',
            query: {
              safe: 'matic:0x0000000000000000000000000000000000000000',
            },
          },
        })

        await waitFor(() => {
          expect(screen.getByText('Compound', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(
            screen.getByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
        })

        // filter by optimized for batch transactions
        act(() => fireEvent.click(screen.getByRole('checkbox', { checked: false })))

        // clears the optimized for batch transactions filter
        act(() => fireEvent.click(screen.getByRole('checkbox', { checked: true })))

        // show all safe apps
        await waitFor(() => {
          expect(screen.getByText('Compound', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
          expect(
            screen.getByText('Transaction Builder', { selector: '[data-variant="paragraph-bold"]' }),
          ).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: '[data-variant="paragraph-bold"]' })).toBeInTheDocument()
        })
      })
    })
  })
})

// The Safe App card title renders as a shadcn Typography (paragraph-bold), not a heading.
const getSafeAppCard = (appName: string): HTMLElement => {
  const title = screen.getByText(appName, { selector: '[data-variant="paragraph-bold"]' })
  const card = title.closest('[data-slot="card"]')
  if (!card) throw new Error(`Safe App card not found: ${appName}`)
  return card as HTMLElement
}

// The bookmark toggle is the last action button on the card.
const getBookmarkButton = (appName: string): HTMLElement => {
  const buttons = within(getSafeAppCard(appName)).getAllByRole('button')
  return buttons[buttons.length - 1]
}

// Pin/Unpin labels moved from MUI aria-labels to hover-only shadcn tooltips, so the pinned state is
// asserted by hovering the bookmark toggle and reading its tooltip ("Unpin <app>" vs "Pin <app>").
const expectBookmarkTooltip = async (appName: string, expected: string): Promise<void> => {
  await userEvent.hover(getBookmarkButton(appName))
  await screen.findByText(expected, { selector: '[data-slot="tooltip-content"]' })
  await userEvent.unhover(getBookmarkButton(appName))
}

// Using centralized mock data from @safe-global/test/msw/mockSafeApps
const transactionBuilderSafeAppMock = transactionBuilderSafeApp
const compopundSafeAppMock = compoundSafeApp
const _ensSafeAppMock = ensSafeApp
const _synthetixSafeAppMock = synthetixSafeApp
