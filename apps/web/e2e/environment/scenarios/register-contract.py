import asyncio
import json
import sys

from hexbytes import HexBytes
from app.datasources.db.database import transactional_session_context
from app.datasources.db.models import Abi, AbiSource, Contract


async def register(contracts):
    async with transactional_session_context():
        source, _ = await AbiSource.get_or_create("Isolated E2E fixtures", "http://localhost")
        for data in contracts:
            abi, _ = await Abi.get_or_create_abi(data["abi"], source.id)
            contract, _ = await Contract.get_or_create(
                address=HexBytes(data["address"]), chain_id=data["chainId"]
            )
            contract.abi_id = abi.id
            contract.name = data["name"]
            contract.display_name = data["name"]
            await contract.update()


asyncio.run(register(json.load(sys.stdin)))
