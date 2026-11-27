import asyncio
import os

from app.services.safe_contracts_service import get_safe_contract_service


if __name__ == "__main__":
    chain_id = int(os.environ["FORK_CHAIN_ID"])
    count = asyncio.run(get_safe_contract_service().create_safe_contracts(chain_id))
    print(f"Registered {count} decoder contracts for chain {chain_id}")
