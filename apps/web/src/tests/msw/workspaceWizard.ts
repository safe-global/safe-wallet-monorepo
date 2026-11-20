import { http, HttpResponse } from 'msw'
import type { PaymentLink } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type {
  CreateSpaceSetupDto,
  GetSpaceResponse,
  SpaceSetupCheckoutDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { UserWithWallets } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { GATEWAY_URL } from '@/config/gateway'

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
