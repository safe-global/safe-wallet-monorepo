import type {
  GetPlansResultDto,
  Plan,
  GetTokenInfoDto,
  UserSubscription,
  CreateCustomerInputDto,
  CreateCustomerResultDto,
  GetInvoicesResultDto,
  CreateSubscriptionInputDto,
  CancelSubscriptionResultDto,
  GetSubscriptionsInputDto,
} from '@/components/pro/types'
import { KEY_CUSTOMER_ID } from '@/components/pro/types'
import { SafeTransactionData } from '@safe-global/safe-core-sdk-types'

const fetchCustomerSubscriptions = async (spaceId: string) => {
  const FETCH_SAFE_SUBSCRIPTIONS_CUSTOMER_URL =
    process.env.NEXT_PUBLIC_BILLING_BACKEND_URL + '/api/customer/is-registered'
  try {
    const response = await fetch(`${FETCH_SAFE_SUBSCRIPTIONS_CUSTOMER_URL}?${KEY_CUSTOMER_ID}=${spaceId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch subscriptions')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return { isRegistered: false, subscriptions: [] }
  }
}

const getPlans = async (): Promise<Plan[]> => {
  const CONFIG_URL = process.env.NEXT_PUBLIC_BILLING_BACKEND_URL + '/api/subscription/plans'
  const res = await fetch(CONFIG_URL)
  const data: GetPlansResultDto = await res.json()
  return data.plans
}

const getTokenAddresses = async (chainId?: string): Promise<GetTokenInfoDto[]> => {
  try {
    const TOKEN_INFO_URL = process.env.NEXT_PUBLIC_BILLING_BACKEND_URL + '/api/crypto/tokens'
    const response = await fetch(`${TOKEN_INFO_URL}?chainId=${chainId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch subscriptions')
    }
    const result: GetTokenInfoDto[] = await response.json()
    return result
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
  }
  return []
}

const getPendingTx = async (): Promise<boolean> => {
  return true
}

const createCryptoPaymentIntent = async (
  planId: string,
  customerId: string,
  tokenAddress: string,
  chainId: number,
): Promise<{ clientSecret: string; subscriptionId: string }> => {
  const FETCH_CREATE_CRYPO_PAYMENT_URL = process.env.NEXT_PUBLIC_BILLING_BACKEND_URL + '/api/crypto/payment-intent'

  const response = await fetch(`${FETCH_CREATE_CRYPO_PAYMENT_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planId,
      tokenAddress,
      chainId,
      spaceId: customerId, // Assuming spaceId is the same as customerId
    }),
  })
  if (!response.ok) {
    throw new Error('Failed to fetch subscriptions')
  }

  const result = await response.json()

  const clientSecret = result.clientSecret
  const subscriptionId = result.subscriptionId
  return { clientSecret, subscriptionId }
}

const createSubscriptionIntent = async (
  info: CreateSubscriptionInputDto,
): Promise<{ clientSecret: string; subscriptionId: string }> => {
  const CREATE_SUBSCRIPTION_URL = process.env.NEXT_PUBLIC_BILLING_BACKEND_URL + '/api/subscription/create'
  const response = await fetch(CREATE_SUBSCRIPTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planId: info.planId,
      spaceId: info.spaceId,
    }),
  })

  const data: any = await response.json()
  return { subscriptionId: data.subscriptionId, clientSecret: data.clientSecret }
}

const updateCryptoPaymentIntent = async (
  customerId: string,
  subscriptionId: string,
  safeTxData: SafeTransactionData,
) => {
  const FETCH_UPDATE_CRYPO_PAYMENT_URL = process.env.NEXT_PUBLIC_BILLING_BACKEND_URL + '/api/crypto/update-subscription'
  const body = JSON.stringify({
    subscriptionId,
    spaceId: customerId, // Assuming spaceId is the same as customerId
    safeTxData: {
      ...safeTxData,
      nonce: safeTxData.nonce.toString(), // Ensure nonce is a string
      safeTxHash: '0x', // TODO: Add safeTxHash if needed
    },
  })

  const response = await fetch(`${FETCH_UPDATE_CRYPO_PAYMENT_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body,
  })
  if (!response.ok) {
    throw new Error('Failed to update subscription')
  }

  const result = await response.json()
  return { result }
}

const getUserSubscriptions = async (input: GetSubscriptionsInputDto): Promise<UserSubscription[]> => {
  const FETCH_USER_SUBSCRIPTIONS_URL = process.env.NEXT_PUBLIC_BILLING_BACKEND_URL + '/api/subscription/'
  const response = await fetch(`${FETCH_USER_SUBSCRIPTIONS_URL}?${KEY_CUSTOMER_ID}=${input.spaceId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error('Failed to fetch user subscriptions')
  }
  return await response.json()
}

const cancelSubscription = async (subscriptionId: string, spaceId: string): Promise<CancelSubscriptionResultDto> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BILLING_BACKEND_URL}/api/subscription/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscriptionId,
      spaceId,
    }),
  })

  const result = await response.json()
  return {
    subscriptionId: result.subscriptionId,
    status: result.status,
  }
}

const createCustomer = async (createCustomerInputDto: CreateCustomerInputDto): Promise<CreateCustomerResultDto> => {
  const CREATE_CUSTOMER_URL = process.env.NEXT_PUBLIC_BILLING_BACKEND_URL + '/api/customer/create'
  const result = await fetch(CREATE_CUSTOMER_URL, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createCustomerInputDto),
  }).then((r) => r.json())
  return result
}

const getCustomerInvoices = async (
  customerId: string,
  offset: number,
  limit: number,
): Promise<GetInvoicesResultDto> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BILLING_BACKEND_URL}/api/invoices?${KEY_CUSTOMER_ID}=${customerId}&offset=${offset}&limit=${limit}`,
    )
    return await response.json()
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return { invoices: [] }
  }
}

const canAccessPro = async (spaceId: string, feature: string): Promise<boolean> => {
  // TODO: use correct Gateway URL for production
  const CGW_PRO_URL = process.env.NEXT_PUBLIC_GATEWAY_URL_STAGING + '/v1/pro'
  const response = await fetch(`${CGW_PRO_URL}?spaceId=${spaceId}&feature=${feature}`)
  const { canAccess } = await response.json()
  return canAccess
}

export {
  fetchCustomerSubscriptions,
  getPlans,
  getTokenAddresses,
  createSubscriptionIntent,
  createCryptoPaymentIntent,
  updateCryptoPaymentIntent,
  getUserSubscriptions,
  cancelSubscription,
  createCustomer,
  getCustomerInvoices,
  canAccessPro,
}
