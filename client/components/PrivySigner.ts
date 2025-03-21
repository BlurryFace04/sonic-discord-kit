import { publicKey, Transaction as UmiTransaction } from '@metaplex-foundation/umi'
import { fromWeb3JsTransaction, toWeb3JsTransaction } from '@metaplex-foundation/umi-web3js-adapters'
import { VersionedTransaction } from '@solana/web3.js'
import { PrivyClient } from "@privy-io/server-auth"

const client = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
  {
    walletApi: {
      authorizationPrivateKey: process.env.PRIVY_SIGNING_KEY!
    }
  }
)

export const getPrivySigner = (payer: string, walletId: string) => {
  return {
    publicKey: publicKey(payer),

    signTransaction: async (transaction: any): Promise<UmiTransaction> => {
      const versionedTx = toWeb3JsTransaction(transaction)

      const { signedTransaction } =
        await client.walletApi.solana.signTransaction({
          walletId: walletId,
          transaction: versionedTx
        })

      const finalTx = fromWeb3JsTransaction(signedTransaction as VersionedTransaction)
      return finalTx
    },

    signAllTransactions: async (
      transactions: any[]
    ): Promise<UmiTransaction[]> => {
      return Promise.all(
        transactions.map((tx) =>
          client.walletApi.solana.signTransaction({
            walletId,
            transaction: toWeb3JsTransaction(tx)
          }).then(({ signedTransaction }) =>
            fromWeb3JsTransaction(signedTransaction as VersionedTransaction)
          )
        )
      )
    },

    signMessage: async (_: Uint8Array): Promise<Uint8Array> => {
      throw new Error("signMessage is not implemented for privySigner")
    }
  }
}
