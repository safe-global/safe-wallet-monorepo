import { BACKEND_BASE_URI } from '@/config/constants'
import type { WeeklyRelayedTransactions } from '@/types/super-chain'
import axios from 'axios'
import type { Address } from 'viem'

export async function getWeeklyRelayedTransactions(account: Address) {
  return await axios.get<WeeklyRelayedTransactions>(`${BACKEND_BASE_URI}/user/${account}/sponsorship-balance`)
}
