import type { SafeVersion } from '@safe-global/safe-core-sdk-types';
import { type BrowserProvider, type Provider } from 'ethers';

import { type SafeInfo, type ChainInfo, ImplementationVersionState } from '@safe-global/safe-gateway-typescript-sdk';
import {
  getReadOnlyFallbackHandlerContract,
  getReadOnlyGnosisSafeContract,
  getReadOnlyProxyFactoryContract,
} from '@/services/contracts/safeContracts';
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard';
import { SafeCreationStatus } from '@/components/new-safe/create/steps/StatusStep/useSafeCreation';
import { didRevert, type EthersError } from '@/utils/ethers-utils';
import { Errors, trackError } from '@/services/exceptions';
import { isWalletRejection } from '@/utils/wallets';
import type { PendingSafeTx } from '@/components/new-safe/create/types';
import type { NewSafeFormData } from '@/components/new-safe/create';
import type { UrlObject } from 'url';
import { AppRoutes } from '@/config/routes';
import { SAFE_APPS_EVENTS, trackEvent } from '@/services/analytics';
import type { AppDispatch, AppThunk } from '@/store';
import { showNotification } from '@/store/notificationsSlice';
import { SafeFactory } from '@safe-global/protocol-kit';
import type Safe from '@safe-global/protocol-kit';
import type { DeploySafeProps } from '@safe-global/protocol-kit';
import { createEthersAdapter, isValidSafeVersion } from '@/hooks/coreSDK/safeCoreSDK';

import { backOff } from 'exponential-backoff';
import { LATEST_SAFE_VERSION } from '@/config/constants';
import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants';
import { formatError } from '@/utils/formatters';
import { sponsoredCall } from '@/services/tx/relaying';
import { contractNetworks } from '@/bitlayer/bitlayerSafe';

export type SafeCreationProps = {
  owners: string[];
  threshold: number;
  saltNonce: number;
};

/**
 * Prepare data for creating a Safe for the Core SDK
 */
export const getSafeDeployProps = async (
  safeParams: SafeCreationProps,
  callback: (txHash: string) => void,
  chainId: string,
): Promise<DeploySafeProps & { callback: DeploySafeProps['callback']; }> => {
  const readOnlyFallbackHandlerContract = await getReadOnlyFallbackHandlerContract(chainId, LATEST_SAFE_VERSION);

  return {
    safeAccountConfig: {
      threshold: safeParams.threshold,
      owners: safeParams.owners,
      fallbackHandler: await readOnlyFallbackHandlerContract.getAddress(),
    },
    saltNonce: safeParams.saltNonce.toString(),
    callback,
  };
};

const getSafeFactory = async (
  ethersProvider: BrowserProvider,
  safeVersion = LATEST_SAFE_VERSION,
): Promise<SafeFactory> => {
  if (!isValidSafeVersion(safeVersion)) {
    throw new Error('Invalid Safe version');
  }
  const ethAdapter = await createEthersAdapter(ethersProvider);
  console.log('creacting ethAdapter')
  const safeFactory = await SafeFactory.create({ ethAdapter, safeVersion, contractNetworks });
  console.log(safeFactory)
  return safeFactory;
};

/**
 * Create a Safe creation transaction via Core SDK and submits it to the wallet
 */
export const createNewSafe = async (
  ethersProvider: BrowserProvider,
  props: DeploySafeProps,
  safeVersion?: SafeVersion,
): Promise<Safe> => {
  const safeFactory = await getSafeFactory(ethersProvider, safeVersion);
  return safeFactory.deploySafe(props);
};

/**
 * Compute the new counterfactual Safe address before it is actually created
 */
export const computeNewSafeAddress = async (
  ethersProvider: BrowserProvider,
  props: DeploySafeProps,
): Promise<string> => {
  console.log('provideer', ethersProvider)
  const safeFactory = await getSafeFactory(ethersProvider);
  console.log('factory', safeFactory)
  return safeFactory.predictSafeAddress(props.safeAccountConfig, props.saltNonce);
};

/**
 * Encode a Safe creation transaction NOT using the Core SDK because it doesn't support that
 * This is used for gas estimation.
 */
export const encodeSafeCreationTx = async ({
  owners,
  threshold,
  saltNonce,
  chain,
}: SafeCreationProps & { chain: ChainInfo; }) => {
  const readOnlySafeContract = await getReadOnlyGnosisSafeContract(chain, LATEST_SAFE_VERSION);
  const readOnlyProxyContract = await getReadOnlyProxyFactoryContract(chain.chainId, LATEST_SAFE_VERSION);
  const readOnlyFallbackHandlerContract = await getReadOnlyFallbackHandlerContract(chain.chainId, LATEST_SAFE_VERSION);

  const setupData = readOnlySafeContract.encode('setup', [
    owners,
    threshold,
    ZERO_ADDRESS,
    EMPTY_DATA,
    await readOnlyFallbackHandlerContract.getAddress(),
    ZERO_ADDRESS,
    '0',
    ZERO_ADDRESS,
  ]);

  return readOnlyProxyContract.encode('createProxyWithNonce', [
    await readOnlySafeContract.getAddress(),
    setupData,
    saltNonce,
  ]);
};

/**
 * Encode a Safe creation tx in a way that we can store locally and monitor using _waitForTransaction
 */
export const getSafeCreationTxInfo = async (
  provider: Provider,
  owners: NewSafeFormData['owners'],
  threshold: NewSafeFormData['threshold'],
  saltNonce: NewSafeFormData['saltNonce'],
  chain: ChainInfo,
  wallet: ConnectedWallet,
): Promise<PendingSafeTx> => {
  const readOnlyProxyContract = await getReadOnlyProxyFactoryContract(chain.chainId, LATEST_SAFE_VERSION);

  const data = await encodeSafeCreationTx({
    owners: owners.map((owner) => owner.address),
    threshold,
    saltNonce,
    chain,
  });

  return {
    data,
    from: wallet.address,
    nonce: await provider.getTransactionCount(wallet.address),
    to: await readOnlyProxyContract.getAddress(),
    value: BigInt(0),
    startBlock: await provider.getBlockNumber(),
  };
};

export const estimateSafeCreationGas = async (
  chain: ChainInfo,
  provider: Provider,
  from: string,
  safeParams: SafeCreationProps,
): Promise<bigint> => {
  const readOnlyProxyFactoryContract = await getReadOnlyProxyFactoryContract(chain.chainId, LATEST_SAFE_VERSION);
  const encodedSafeCreationTx = await encodeSafeCreationTx({ ...safeParams, chain });

  const gas = await provider.estimateGas({
    from: from,
    to: await readOnlyProxyFactoryContract.getAddress(),
    data: encodedSafeCreationTx,
  });

  return gas;
};
export async function getSafeInfo(chainId: string, safeAddress: string): Promise<SafeInfo> {
  return {
    "address": {
      "value": "0x1df00191a32184675baA3fc0416A57009C386ed9"
    },
    "chainId": "200810",
    "nonce": 3,
    "threshold": 3,
    "owners": [
      {
        "value": "0x467550C949E23f8ed65ED6bFeE1f206704c761f7"
      },
      {
        "value": "0x02C6b9D156A56FffadD526ddE1ACd0c27aC13460"
      },
      {
        "value": "0xfC03cAf0f5d95cb8c013f26006A0B7610220AFC7"
      },
      {
        "value": "0x1a3A37fB9ABb7d3589DfB9Ca431CFE7f53A64954"
      },
      {
        "value": "0xeBd07Dd6344E89C258340Bc070d2C80D33f0e365"
      }
    ],
    "implementation": {
      "value": "0x3E5c63644E683549055b9Be8653de26E0B4CD36E",
      "name": "SafeL2 1.3.0",
      "logoUri": "https://safe-transaction-assets.staging.5afe.dev/contracts/logos/0x3E5c63644E683549055b9Be8653de26E0B4CD36E.png"
    },
    implementationVersionState: ImplementationVersionState.UP_TO_DATE,
    // "implementationVersionState": "UP_TO_DATE",
    "collectiblesTag": null,
    "txQueuedTag": null,
    "txHistoryTag": "1702451123",
    "messagesTag": null,
    "modules": null,
    "fallbackHandler": {
      "value": "0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4",
      "name": "Safe: CompatibilityFallbackHandler 1.3.0",
      "logoUri": "https://safe-transaction-assets.staging.5afe.dev/contracts/logos/0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4.png"
    },
    "guard": null,
    "version": "1.3.0+L2"
  };
}
export const pollSafeInfo = async (chainId: string, safeAddress: string): Promise<SafeInfo> => {
  // exponential delay between attempts for around 4 min
  return backOff(() => getSafeInfo(chainId, safeAddress), {
    startingDelay: 750,
    maxDelay: 20000,
    numOfAttempts: 19,
    retry: (e) => {
      console.info('waiting for client-gateway to provide safe information', e);
      return true;
    },
  });
};

export const handleSafeCreationError = (error: EthersError) => {
  trackError(Errors._800, error.message);

  if (isWalletRejection(error)) {
    return SafeCreationStatus.WALLET_REJECTED;
  }

  if (error.code === 'TRANSACTION_REPLACED') {
    if (error.reason === 'cancelled') {
      return SafeCreationStatus.ERROR;
    } else {
      return SafeCreationStatus.SUCCESS;
    }
  }

  if (error.receipt && didRevert(error.receipt)) {
    return SafeCreationStatus.REVERTED;
  }

  if (error.code === 'TIMEOUT') {
    return SafeCreationStatus.TIMEOUT;
  }

  return SafeCreationStatus.ERROR;
};

export const SAFE_CREATION_ERROR_KEY = 'create-safe-error';
export const showSafeCreationError = (error: EthersError | Error): AppThunk => {
  return (dispatch) => {
    dispatch(
      showNotification({
        message: `Your transaction was unsuccessful. Reason: ${formatError(error)}`,
        detailedMessage: error.message,
        groupKey: SAFE_CREATION_ERROR_KEY,
        variant: 'error',
      }),
    );
  };
};

export const checkSafeCreationTx = async (
  provider: Provider,
  pendingTx: PendingSafeTx,
  txHash: string,
  dispatch: AppDispatch,
): Promise<SafeCreationStatus> => {
  const TIMEOUT_TIME = 60 * 1000; // 1 minute

  try {
    // TODO: Use the fix from checkSafeActivation to detect cancellation and speed-up txs again
    const receipt = await provider.waitForTransaction(txHash, 1, TIMEOUT_TIME);

    /** The receipt should always be non-null as we require 1 confirmation */
    if (receipt === null) {
      throw new Error('Transaction should have a receipt, but got null instead.');
    }

    if (didRevert(receipt)) {
      return SafeCreationStatus.REVERTED;
    }

    return SafeCreationStatus.SUCCESS;
  } catch (err) {
    const _err = err as EthersError;

    const status = handleSafeCreationError(_err);

    if (status !== SafeCreationStatus.SUCCESS) {
      dispatch(showSafeCreationError(_err));
    }

    return status;
  }
};

export const CREATION_MODAL_QUERY_PARM = 'showCreationModal';

export const getRedirect = (
  chainPrefix: string,
  safeAddress: string,
  redirectQuery?: string | string[],
): UrlObject | string => {
  const redirectUrl = Array.isArray(redirectQuery) ? redirectQuery[0] : redirectQuery;
  const address = `${chainPrefix}:${safeAddress}`;

  // Should never happen in practice
  if (!chainPrefix) return AppRoutes.index;

  // Go to the dashboard if no specific redirect is provided
  if (!redirectUrl) {
    return { pathname: AppRoutes.home, query: { safe: address, [CREATION_MODAL_QUERY_PARM]: true } };
  }

  // Otherwise, redirect to the provided URL (e.g. from a Safe App)

  // Track the redirect to Safe App
  // TODO: Narrow this down to /apps only
  if (redirectUrl.includes('apps')) {
    trackEvent(SAFE_APPS_EVENTS.SHARED_APP_OPEN_AFTER_SAFE_CREATION);
  }

  // We're prepending the safe address directly here because the `router.push` doesn't parse
  // The URL for already existing query params
  // TODO: Check if we can accomplish this with URLSearchParams or URL instead
  const hasQueryParams = redirectUrl.includes('?');
  const appendChar = hasQueryParams ? '&' : '?';
  return redirectUrl + `${appendChar}safe=${address}`;
};

export const relaySafeCreation = async (
  chain: ChainInfo,
  owners: string[],
  threshold: number,
  saltNonce: number,
  safeVersion?: SafeVersion,
) => {
  const readOnlyProxyFactoryContract = await getReadOnlyProxyFactoryContract(
    chain.chainId,
    safeVersion ?? LATEST_SAFE_VERSION,
  );
  const proxyFactoryAddress = await readOnlyProxyFactoryContract.getAddress();
  const readOnlyFallbackHandlerContract = await getReadOnlyFallbackHandlerContract(
    chain.chainId,
    safeVersion ?? LATEST_SAFE_VERSION,
  );
  const fallbackHandlerAddress = await readOnlyFallbackHandlerContract.getAddress();
  const readOnlySafeContract = await getReadOnlyGnosisSafeContract(chain);
  const safeContractAddress = await readOnlySafeContract.getAddress();

  const callData = {
    owners,
    threshold,
    to: ZERO_ADDRESS,
    data: EMPTY_DATA,
    fallbackHandler: fallbackHandlerAddress,
    paymentToken: ZERO_ADDRESS,
    payment: 0,
    paymentReceiver: ZERO_ADDRESS,
  };

  const initializer = readOnlySafeContract.encode('setup', [
    callData.owners,
    callData.threshold,
    callData.to,
    callData.data,
    callData.fallbackHandler,
    callData.paymentToken,
    callData.payment,
    callData.paymentReceiver,
  ]);

  const createProxyWithNonceCallData = readOnlyProxyFactoryContract.encode('createProxyWithNonce', [
    safeContractAddress,
    initializer,
    saltNonce,
  ]);

  const relayResponse = await sponsoredCall({
    chainId: chain.chainId,
    to: proxyFactoryAddress,
    data: createProxyWithNonceCallData,
  });

  return relayResponse.taskId;
};
