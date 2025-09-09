import { userEvent } from '@testing-library/user-event'
import React, { act } from 'react'
import * as safeAppsGatewaySDK from '@safe-global/safe-gateway-typescript-sdk'
import { SafeAppFeatures } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'

import {
  render,
  screen,
  waitFor,
  fireEvent,
  getByRole,
  getByText,
  waitForElementToBeRemoved,
  within,
  createAppNameRegex,
} from '../test-utils'
import AppsPage from '@/pages/apps'
import CustomSafeAppsPage from '@/pages/apps/custom'
import * as safeAppsService from '@/services/safe-apps/manifest'
import { LS_NAMESPACE } from '@/config/constants'
import * as chainHooks from '@/hooks/useChains'

jest.mock('@safe-global/safe-gateway-typescript-sdk', () => ({
  ...jest.requireActual('@safe-global/safe-gateway-typescript-sdk'),
  getSafeApps: () => Promise.resolve(mockedSafeApps),
}))

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useParams: jest.fn(() => ({ safe: 'matic:0x0000000000000000000000000000000000000000' })),
}))

describe('AppsPage', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    window.localStorage.clear()
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
        expect(screen.getByText('Compound', { selector: 'h5' })).toBeInTheDocument()
        expect(screen.getByText('ENS App', { selector: 'h5' })).toBeInTheDocument()
        expect(screen.getByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
        expect(screen.getByText('Synthetix', { selector: 'h5' })).toBeInTheDocument()
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
      expect(screen.queryByRole('presentation')).not.toBeInTheDocument()

      // clicks on Transaction Builder Safe App
      await waitFor(() => {
        fireEvent.click(screen.getByRole('heading', { level: 5, name: 'Transaction Builder' }))
      })

      await waitFor(() => {
        const safeAppPreviewDrawer = screen.getByRole('presentation')
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

      // show Bookmarked Safe Apps only
      await waitFor(() => {
        expect(screen.queryByText('My pinned apps (2)')).toBeInTheDocument()
        expect(screen.queryByLabelText('Unpin Compound')).toBeInTheDocument()
        expect(screen.queryByLabelText('Unpin Transaction Builder')).toBeInTheDocument()
        expect(screen.queryByLabelText('Unpin ENS App')).not.toBeInTheDocument()
        expect(screen.queryByLabelText('Unpin Synthetix')).not.toBeInTheDocument()
      })
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

      // show Bookmarked Safe Apps
      await waitFor(() => {
        expect(screen.queryByLabelText('Unpin Compound')).toBeInTheDocument()
        expect(screen.queryByLabelText('Unpin Transaction Builder')).toBeInTheDocument()
      })

      // unpin Transaction Builder Safe App
      fireEvent.click(screen.getByLabelText('Unpin Transaction Builder'))

      // show Bookmarked Safe Apps
      await waitFor(() => {
        expect(screen.queryByLabelText('Unpin Compound')).toBeInTheDocument()
        expect(screen.queryByLabelText('Unpin Transaction Builder')).not.toBeInTheDocument()
      })
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
      expect(screen.queryByRole('presentation')).not.toBeInTheDocument()

      // clicks on Transaction Builder Safe App
      await waitFor(() => {
        fireEvent.click(screen.getByRole('heading', { level: 5, name: 'Transaction Builder' }))
      })

      await waitFor(() => {
        const safeAppPreviewDrawer = screen.getByRole('presentation')
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
        expect(screen.getByRole('heading', { level: 2, name: 'Add custom Safe App' })).toBeInTheDocument()

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
          type: safeAppsGatewaySDK.SafeAppAccessPolicyTypes.NoRestrictions,
        },
        tags: [],
        features: [],
        socialProfiles: [],
        developerWebsite: '',
        chainIds: ['1', '4', '137'],
        iconUrl: '',
        safeAppsPermissions: [],
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

      // modal is closed
      await waitForElementToBeRemoved(() => screen.queryByLabelText(/Safe App URL/))

      // custom safe app is present in the list
      expect(screen.queryByText('Custom test Safe app')).toBeInTheDocument()

      // shows safe app description drawer is not present
      expect(screen.queryByRole('presentation')).not.toBeInTheDocument()

      // clicks on Custom test Safe app Safe App
      await userEvent.click(screen.getByRole('heading', { level: 5, name: 'Custom test Safe app' }))

      await waitFor(() => {
        const safeAppPreviewDrawer = screen.getByRole('presentation')
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
      await screen.findByText(/the app doesn't support Safe App functionality/i)
    })

    it('Requires risk acknowledgment checkbox to add the app', async () => {
      const APP_URL = 'https://apps.safe.global/test-custom-app'

      jest.spyOn(safeAppsService, 'fetchSafeAppFromManifest').mockResolvedValueOnce({
        id: 12345,
        url: APP_URL,
        name: 'Custom test Safe app',
        description: 'Custom Safe app description',
        accessControl: {
          type: safeAppsGatewaySDK.SafeAppAccessPolicyTypes.NoRestrictions,
        },
        tags: [],
        features: [],
        socialProfiles: [],
        developerWebsite: '',
        chainIds: ['1', '4', '137'],
        iconUrl: '',
        safeAppsPermissions: [],
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
          type: safeAppsGatewaySDK.SafeAppAccessPolicyTypes.NoRestrictions,
        },
        tags: [],
        features: [],
        socialProfiles: [],
        developerWebsite: '',
        chainIds: ['1', '4', '137'],
        iconUrl: '',
        safeAppsPermissions: [],
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

      // modal is closed
      await waitForElementToBeRemoved(() => screen.queryByLabelText(/Safe App URL/))

      const removeCustomSafeAppButton = screen.getByLabelText('Delete Custom test Safe app')

      await userEvent.click(removeCustomSafeAppButton)

      await waitFor(() => expect(screen.getByText('Confirm Safe App removal')).toBeInTheDocument())

      const confirmRemovalButton = screen.getByRole('button', { name: 'Remove' })
      await userEvent.click(confirmRemovalButton)

      await waitForElementToBeRemoved(() => screen.getByRole('button', { name: 'Remove' }))
      expect(screen.queryByText('Custom test Safe app')).not.toBeInTheDocument()
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
          expect(screen.getByText('Compound', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: 'h5' })).toBeInTheDocument()
        })

        const query = 'Transaction'

        const searchInput = screen.getByPlaceholderText('Search by name or category')
        fireEvent.change(searchInput, { target: { value: query } })

        await waitFor(() => {
          expect(screen.queryByText('Compound', { selector: 'h5' })).not.toBeInTheDocument()
          expect(screen.queryByText('ENS App', { selector: 'h5' })).not.toBeInTheDocument()
          expect(screen.queryByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.queryByText('Synthetix', { selector: 'h5' })).not.toBeInTheDocument()
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
          expect(screen.getByText('Compound', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: 'h5' })).toBeInTheDocument()
        })

        const query = transactionBuilderSafeAppMock.description

        const searchInput = screen.getByPlaceholderText('Search by name or category')
        fireEvent.change(searchInput, { target: { value: query } })

        await waitFor(() => {
          expect(screen.queryByText('Compound', { selector: 'h5' })).not.toBeInTheDocument()
          expect(screen.queryByText('ENS App', { selector: 'h5' })).not.toBeInTheDocument()
          expect(screen.queryByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.queryByText('Synthetix', { selector: 'h5' })).not.toBeInTheDocument()
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
          expect(screen.getByText('Compound', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: 'h5' })).toBeInTheDocument()
        })

        const query = 'zero results'

        const searchInput = screen.getByPlaceholderText('Search by name or category')

        act(() => fireEvent.change(searchInput, { target: { value: query } }))

        await waitFor(() => {
          expect(screen.queryByText('Compound', { selector: 'h5' })).not.toBeInTheDocument()
          expect(screen.queryByText('ENS App', { selector: 'h5' })).not.toBeInTheDocument()
          expect(screen.queryByText('Transaction Builder', { selector: 'h5' })).not.toBeInTheDocument()
          expect(screen.queryByText('Synthetix', { selector: 'h5' })).not.toBeInTheDocument()

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
          expect(screen.getByText('Compound', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: 'h5' })).toBeInTheDocument()
        })

        const categorySelector = screen.getByText('Select category')

        act(() => fireEvent.mouseDown(categorySelector))

        const categoriesDropdown = within(screen.getByRole('listbox'))

        // show only visible options in the categories dropdown
        await waitFor(() => expect(categoriesDropdown.getByText('Infrastructure')).toBeInTheDocument())

        // internal categories are not displayed
        await waitFor(() => expect(categoriesDropdown.queryByText('transaction-builder')).not.toBeInTheDocument())

        // filter by Infrastructure category
        act(() => {
          fireEvent.click(categoriesDropdown.getByText('Infrastructure'))
        })

        // close the dropdown
        act(() => {
          fireEvent.keyDown(screen.getByRole('listbox'), {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            charCode: 27,
          })
        })

        await waitFor(() => {
          // 1 categories selected label
          expect(screen.queryByText('1 categories selected')).toBeInTheDocument()
          expect(screen.queryByText('Compound', { selector: 'h5' })).not.toBeInTheDocument()
          expect(screen.queryByText('ENS App', { selector: 'h5' })).not.toBeInTheDocument()
          expect(screen.queryByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.queryByText('Synthetix', { selector: 'h5' })).not.toBeInTheDocument()
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
          expect(screen.getByText('Compound', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: 'h5' })).toBeInTheDocument()
        })

        const categorySelector = screen.getByText('Select category')

        act(() => fireEvent.mouseDown(categorySelector))

        const categoriesDropdown = within(screen.getByRole('listbox'))

        // filter by Infrastructure category
        act(() => fireEvent.click(categoriesDropdown.getByText('Infrastructure')))

        await waitFor(() => {
          expect(screen.queryByText('Compound', { selector: 'h5' })).not.toBeInTheDocument()
          expect(screen.queryByText('ENS App', { selector: 'h5' })).not.toBeInTheDocument()
          expect(screen.queryByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.queryByText('Synthetix', { selector: 'h5' })).not.toBeInTheDocument()
        })

        // clear active Infrastructure filter
        act(() => fireEvent.click(categoriesDropdown.getByText('Infrastructure')))

        // close the dropdown
        act(() =>
          fireEvent.keyDown(screen.getByRole('listbox'), {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            charCode: 27,
          }),
        )

        // show all safe apps again
        await waitFor(() => {
          expect(screen.getByText('Compound', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: 'h5' })).toBeInTheDocument()
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
          expect(screen.getByText('Compound', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: 'h5' })).toBeInTheDocument()
        })

        const categorySelector = screen.getByText('Select category')

        act(() => fireEvent.mouseDown(categorySelector))

        const categoriesDropdown = within(screen.getByRole('listbox'))

        // filter by Infrastructure category
        act(() => fireEvent.click(categoriesDropdown.getByText('Infrastructure')))

        await waitFor(() => {
          expect(screen.queryByText('Compound', { selector: 'h5' })).not.toBeInTheDocument()
          expect(screen.queryByText('ENS App', { selector: 'h5' })).not.toBeInTheDocument()
          expect(screen.queryByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.queryByText('Synthetix', { selector: 'h5' })).not.toBeInTheDocument()
        })

        // close the dropdown
        act(() =>
          fireEvent.keyDown(screen.getByRole('listbox'), {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            charCode: 27,
          }),
        )

        // clear all selected filters
        act(() => fireEvent.click(screen.getByLabelText('clear selected categories')))

        // show all safe apps again
        await waitFor(() => {
          expect(screen.getByText('Compound', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: 'h5' })).toBeInTheDocument()
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
          expect(screen.getByText('Compound', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: 'h5' })).toBeInTheDocument()
        })

        // filter by optimized for batch transactions
        act(() => fireEvent.click(screen.getByRole('checkbox', { checked: false })))

        // show only transaction builder safe app
        await waitFor(() => {
          expect(screen.queryByText('Compound', { selector: 'h5' })).not.toBeInTheDocument()
          expect(screen.queryByText('ENS App', { selector: 'h5' })).not.toBeInTheDocument()
          expect(screen.queryByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.queryByText('Synthetix', { selector: 'h5' })).not.toBeInTheDocument()
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
          expect(screen.getByText('Compound', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: 'h5' })).toBeInTheDocument()
        })

        // filter by optimized for batch transactions
        act(() => fireEvent.click(screen.getByRole('checkbox', { checked: false })))

        // clears the optimized for batch transactions filter
        act(() => fireEvent.click(screen.getByRole('checkbox', { checked: true })))

        // show all safe apps
        await waitFor(() => {
          expect(screen.getByText('Compound', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('ENS App', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Transaction Builder', { selector: 'h5' })).toBeInTheDocument()
          expect(screen.getByText('Synthetix', { selector: 'h5' })).toBeInTheDocument()
        })
      })
    })
  })
})

const transactionBuilderSafeAppMock: SafeAppData = {
  id: 24,
  url: 'https://cloudflare-ipfs.com/ipfs/QmdVaZxDov4bVARScTLErQSRQoxgqtBad8anWuw3YPQHCs',
  name: 'Transaction Builder',
  iconUrl: 'https://cloudflare-ipfs.com/ipfs/QmdVaZxDov4bVARScTLErQSRQoxgqtBad8anWuw3YPQHCs/tx-builder.png',
  description: 'A Safe app to compose custom transactions',
  chainIds: ['1', '4', '56', '100', '137', '246', '73799'],
  provider: undefined,
  accessControl: {
    type: safeAppsGatewaySDK.SafeAppAccessPolicyTypes.DomainAllowlist,
    value: ['https://gnosis-safe.io'],
  },
  tags: [
    'transaction-builder', // this internal category is not displayed in the UI
    'Infrastructure',
  ],
  features: [SafeAppFeatures.BATCHED_TRANSACTIONS],
  socialProfiles: [],
  developerWebsite: '',
}

const compopundSafeAppMock: SafeAppData = {
  id: 13,
  url: 'https://cloudflare-ipfs.com/ipfs/QmX31xCdhFDmJzoVG33Y6kJtJ5Ujw8r5EJJBrsp8Fbjm7k',
  name: 'Compound',
  iconUrl: 'https://cloudflare-ipfs.com/ipfs/QmX31xCdhFDmJzoVG33Y6kJtJ5Ujw8r5EJJBrsp8Fbjm7k/Compound.png',
  description: 'Money markets on the Ethereum blockchain',
  chainIds: ['1', '4', '137'],
  provider: undefined,
  accessControl: {
    type: safeAppsGatewaySDK.SafeAppAccessPolicyTypes.NoRestrictions,
  },
  tags: [],
  features: [],
  socialProfiles: [],
  developerWebsite: '',
}

const ensSafeAppMock: SafeAppData = {
  id: 3,
  url: 'https://app.ens.domains',
  name: 'ENS App',
  iconUrl: 'https://app.ens.domains/android-chrome-144x144.png',
  description: 'Decentralised naming for wallets, websites, & more.',
  chainIds: ['1', '4', '137'],
  provider: undefined,
  accessControl: {
    type: safeAppsGatewaySDK.SafeAppAccessPolicyTypes.DomainAllowlist,
    value: ['https://gnosis-safe.io'],
  },
  tags: [],
  features: [],
  socialProfiles: [],
  developerWebsite: '',
}

const synthetixSafeAppMock: SafeAppData = {
  id: 14,
  url: 'https://cloudflare-ipfs.com/ipfs/QmXLxxczMH4MBEYDeeN9zoiHDzVkeBmB5rBjA3UniPEFcA',
  name: 'Synthetix',
  iconUrl: 'https://cloudflare-ipfs.com/ipfs/QmXLxxczMH4MBEYDeeN9zoiHDzVkeBmB5rBjA3UniPEFcA/Synthetix.png',
  description: 'Trade synthetic assets on Ethereum',
  chainIds: ['1', '4', '137'],
  provider: undefined,
  accessControl: {
    type: safeAppsGatewaySDK.SafeAppAccessPolicyTypes.NoRestrictions,
  },
  tags: [],
  features: [],
  socialProfiles: [],
  developerWebsite: '',
}

const mockedSafeApps = [compopundSafeAppMock, ensSafeAppMock, synthetixSafeAppMock, transactionBuilderSafeAppMock]
