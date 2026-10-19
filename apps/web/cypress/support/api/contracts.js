export const contracts = {
  token_qtrust: '0x7CB180dE9BE0d8935EbAAc9b4fc533952Df128Ae',
  nft_pc2: '0xB894fc57ED4eE1E747495aE908A7F929a954322C',
}

export const abi_qtrust = ['function transfer(address to, uint amount) returns (bool)']
export const abi_nft_pc2 = [
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function ownerOf(uint256 tokenId) view returns (address)',
]
