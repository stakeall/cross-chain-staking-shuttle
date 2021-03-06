import hre from 'hardhat'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import { providers, BigNumber, Signer } from 'ethers'


export const toBN = (value: string | number): BigNumber => BigNumber.from(value)

// Network

export interface Account {
  readonly signer: Signer
  readonly address: string
}

export const provider = (): providers.JsonRpcProvider => hre.waffle.provider

export const getAccounts = async (): Promise<Account[]> => {
  const accounts = []
  const signers: Signer[] = await hre.ethers.getSigners()
  for (const signer of signers) {
    accounts.push({ signer, address: await signer.getAddress() })
  }
  return accounts
}

export const getChainID = (): Promise<number> => {
  // HACK: this fixes ganache returning always 1 when a contract calls the chainid() opcode
  if (hre.network.name == 'ganache') {
    return Promise.resolve(1)
  }
  return provider()
    .getNetwork()
    .then((r) => r.chainId)
}

export const latestBlock = (): Promise<BigNumber> =>
  provider().send('eth_blockNumber', []).then(toBN)

export const advanceBlock = (): Promise<void> => {
  return provider().send('evm_mine', [])
}

export const advanceBlockTo = async (blockNumber: string | number | BigNumber): Promise<void> => {
  const target =
    typeof blockNumber === 'number' || typeof blockNumber === 'string'
      ? toBN(blockNumber)
      : blockNumber
  const currentBlock = await latestBlock()
  const start = Date.now()
  let notified
  if (target.lt(currentBlock))
    throw Error(`Target block #(${target}) is lower than current block #(${currentBlock})`)
  while ((await latestBlock()).lt(target)) {
    if (!notified && Date.now() - start >= 5000) {
      notified = true
      console.log(`advanceBlockTo: Advancing too ` + 'many blocks is causing this test to be slow.')
    }
    await advanceBlock()
  }
}

export const advanceBlocks = async (blocks: string | number | BigNumber): Promise<void> => {
  const steps = typeof blocks === 'number' || typeof blocks === 'string' ? toBN(blocks) : blocks
  const currentBlock = await latestBlock()
  const toBlock = currentBlock.add(steps)
  await advanceBlockTo(toBlock)
}
