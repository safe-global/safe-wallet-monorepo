import { setupServer } from 'msw/node'
import { handlers } from '@safe-global/test/msw/handlers'
import { GATEWAY_URL } from '@/config/gateway'

export const server = setupServer(...handlers(GATEWAY_URL))
