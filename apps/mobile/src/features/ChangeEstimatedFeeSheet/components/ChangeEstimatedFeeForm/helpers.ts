import { safeParseUnits } from "@safe-global/utils/utils/formatters"
import { EstimatedFeeFormData } from "./schema"


export const parseFormValues = ({ maxFeePerGas, maxPriorityFeePerGas, gasLimit, nonce }: EstimatedFeeFormData) => {
    return {
        maxFeePerGas: safeParseUnits(maxFeePerGas) ?? 0n,
        maxPriorityFeePerGas: safeParseUnits(maxPriorityFeePerGas) ?? 0n,
        gasLimit: gasLimit ? BigInt(gasLimit) : 0n,
        nonce: nonce ? parseInt(nonce, 10) : 0,
    }
}