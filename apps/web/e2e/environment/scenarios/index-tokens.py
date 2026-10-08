# Runs in the Transaction Service shell: creates the given ERC-20 tokens as untrusted tokens.
import json
import sys
import time

from safe_eth.eth import get_auto_ethereum_client
from safe_transaction_service.tokens.models import Token, TokenNotValid

client = get_auto_ethereum_client()
failures = []
for address in json.load(sys.stdin):
    if Token.objects.filter(address=address).exists():
        continue
    for attempt in range(4):
        try:
            info = client.erc20.get_info(address)
            break
        # The fork RPC rate-limits bursts, so any lookup error is retried before failing.
        except Exception as error:
            reason = repr(error)
            time.sleep(2**attempt)
    else:
        failures.append(f"{address}: {reason}")
        continue
    # A rate-limited lookup elsewhere may have marked the token invalid for good.
    TokenNotValid.objects.filter(address=address).delete()
    Token.objects.get_or_create(
        address=address,
        defaults={
            "name": info.name,
            "symbol": info.symbol,
            "decimals": info.decimals,
            "trusted": False,
        },
    )
if failures:
    sys.exit("Cannot index CoW order tokens: " + "; ".join(failures))
