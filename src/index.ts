import { Connection, PublicKey } from '@solana/web3.js'

const RAYDIUM_PUBLIC_KEY = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'
const raydium = new PublicKey(RAYDIUM_PUBLIC_KEY)

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com'
const RPC_ENDPOINT_WSS = 'wss://api.mainnet-beta.solana.com'
const connection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_ENDPOINT_WSS,
})

/**
 * Retrieves the details of a transaction using its signature.
 * @param signature - The signature of the transaction.
 * @returns An object containing the transaction details.
 */
const getDetails = async (signature: string) => {
  const txId = signature
  const tx = await connection.getParsedTransaction(txId, {
    maxSupportedTransactionVersion: 0,
    commitment: 'confirmed',
  })
  const poolAccountTokenA = tx?.meta?.postTokenBalances?.find(
    (d) => d.accountIndex === 5
  )
  const poolAccountTokenB = tx?.meta?.postTokenBalances?.find(
    (d) => d.accountIndex === 6
  )
  return {
    signature,
    token: poolAccountTokenA?.mint,
    pool: poolAccountTokenA?.owner,
    amount: poolAccountTokenA?.uiTokenAmount.uiAmountString,
    liquidity: poolAccountTokenB?.uiTokenAmount.uiAmountString,
  }
}

/**
 * Watcher for creating poll transactions.
 */
const watch = async (
  cb: (data: Awaited<ReturnType<typeof getDetails>>) => void
) => {
  // Prevent duplicate signatures
  const processedSignatures = new Set()

  connection.onLogs(
    raydium,
    ({ logs, err, signature }) => {
      if (err) return
      if (processedSignatures.has(signature)) return
      if (logs && logs.some((log) => log.includes('initialize2'))) {
        processedSignatures.add(signature)
        getDetails(signature).then(cb)
      }
    },
    'finalized'
  )
}

// Test watcher
watch(console.log)

// Try getDetails for defined signature
// getDetails('37V9rygKH9gJgayzV8NhNnSGA87BhjVF1xzNk2GtYnx2xuU9QZeuLFgYqZLWyfx1XVxykUS3EXMXk6YYExMutJfH').then(console.log)
// getDetails('UvySS5FczzhAAuQ7n3kzhUpbaWUP5dbY3jj3oVZ1SNL7RWT4HDRuaSNhHvKMRndV4xo4UU2evC84BnfKdZo1wsw').then(console.log)
