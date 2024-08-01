import { BACKEND_BASE_URI } from '@/config/constants'
import type { WeeklyGasBalance } from '@/types/super-chain'
import axios from 'axios'
import type { Address } from 'viem'

export async function getWeeklyGasBalances(account: Address) {
  return await axios.get<WeeklyGasBalance>(`${BACKEND_BASE_URI}/max-weekly-sponsorship`, {
    headers: {
      account,
    },
  })
}
