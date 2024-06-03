import { getDeploymentData } from '@/utils/getDeploymentData'
import { initPolkadotJs } from '@/utils/initPolkadotJs'
import { writeContractAddresses } from '@/utils/writeContractAddresses'
import { deployContract } from '@scio-labs/use-inkathon/helpers'

/**
 * Script that deploys the guess_secret contract and writes its address to a file.
 *
 * Parameters:
 *  - `DIR`: Directory to read contract build artifacts & write addresses to (optional, defaults to `./deployments`)
 *  - `CHAIN`: Chain ID (optional, defaults to `development`)
 *
 * Example usage:
 *  - `pnpm run deploy`
 *  - `CHAIN=alephzero-testnet pnpm run deploy`
 */
const main = async () => {
  const initParams = await initPolkadotJs()
  const { api, chain, account } = initParams

  let hash = [
    186,
    120,
    38,
    210,
    100,
    23,
    51,
    120,
    49,
    64,
    27,
    30,
    62,
    55,
    67,
    140,
];


  // Deploy guess_secret contract
  const { abi, wasm } = await getDeploymentData('guess_secret')
  const guess_secret = await deployContract(api, account, abi, wasm, 'new', [hash])
 
  // Write contract addresses to `{contract}/{network}.ts` file(s)
  await writeContractAddresses(chain.network, {
    guess_secret,
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => process.exit(0))
