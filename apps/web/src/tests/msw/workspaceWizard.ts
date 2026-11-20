import { http, HttpResponse } from 'msw'
import { waitFor } from '@testing-library/react'
import type { PaymentLink } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type {
  CreateSpaceSetupDto,
  GetSpaceResponse,
  SpaceSetupCheckoutDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { cgwApi as usersApi, type UserWithWallets } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { GATEWAY_URL } from '@/config/gateway'
import { getStoreInstance } from '@/store'

/** `GET /v1/users`: the signed-in user with the given wallets. */
export const userHandler = (id: number, walletAddresses: string[] = []) =>
  http.get(`${GATEWAY_URL}/v1/users`, () =>
    HttpResponse.json<UserWithWallets>({
      id,
      status: 1,
      wallets: walletAddresses.map((address, index) => ({ id: index + 1, address })),
    }),
  )

/** `GET /v1/spaces`: the Workspaces the user is a member of. */
export const workspacesHandler = (spaces: GetSpaceResponse[] = []) =>
  http.get(`${GATEWAY_URL}/v1/spaces`, () => HttpResponse.json(spaces))

/** `GET /v1/billing/trial-plans`: the trial payment links a new Workspace can start. */
export const trialPlansHandler = (links: PaymentLink[]) =>
  http.get(`${GATEWAY_URL}/v1/billing/trial-plans`, () => HttpResponse.json(links))

/** `POST /v1/spaces/setup`: records each request body in `bodies` and answers with `response`. */
export const createSetupHandler = (bodies: CreateSpaceSetupDto[], response: SpaceSetupCheckoutDto) =>
  http.post<never, CreateSpaceSetupDto>(`${GATEWAY_URL}/v1/spaces/setup`, async ({ request }) => {
    bodies.push(await request.json())
    return HttpResponse.json(response, { status: 201 })
  })

/** Resolves once the store of the last render holds the signed-in user, so the steps have read the draft. */
export const userLoaded = () =>
  waitFor(() => {
    // The app's RootState types the shared `api` slice without the users endpoints' cache tags
    const user = usersApi.endpoints.usersGetWithWalletsV1.select()(getStoreInstance().getState() as never)
    if (!user.isSuccess) throw new Error('The signed-in user has not loaded yet')
  })
