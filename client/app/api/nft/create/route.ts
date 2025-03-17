import { NextResponse } from "next/server"
import { PrivyClient } from "@privy-io/server-auth"
import { VersionedTransaction } from "@solana/web3.js"
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { fetchAssetV1, mplCore, create } from '@metaplex-foundation/mpl-core'
import { generateSigner, signerIdentity } from "@metaplex-foundation/umi"
import { publicKey, Transaction as UmiTransaction } from '@metaplex-foundation/umi'
import { fromWeb3JsTransaction, toWeb3JsTransaction } from '@metaplex-foundation/umi-web3js-adapters'
import bs58 from "bs58"

const client = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
  {
    walletApi: {
      authorizationPrivateKey: process.env.PRIVY_SIGNING_KEY!
    }
  }
)

export async function POST(request: Request) {
  try {
    const { payer, to } = await request.json()

    const umi = createUmi('https://sonic.helius-rpc.com')
    umi.use(mplCore())

    const privySigner = {

      publicKey: publicKey(payer),
    
      signTransaction: async (transaction: any): Promise<UmiTransaction> => {
        const versionedTx = toWeb3JsTransaction(transaction)
    
        const { signedTransaction } =
          await client.walletApi.solana.signTransaction({
            walletId: "hh9ro3laqcyf47wxfrtxwj5c", // replace with your Privy wallet ID
            transaction: versionedTx,
          })
    
        const finalTx = fromWeb3JsTransaction(signedTransaction as VersionedTransaction)
    
        return finalTx
      },
    
      signAllTransactions: async (
        transactions: any[]
      ): Promise<UmiTransaction[]> => {
        return Promise.all(
          transactions.map((tx) => privySigner.signTransaction(tx))
        )
      },
    
      signMessage: async (message: Uint8Array): Promise<Uint8Array> => {
        throw new Error("signMessage is not implemented for privySigner")
      },
    }

    umi.use(signerIdentity(privySigner))

    const assetAddress = generateSigner(umi)

    const sendResult = await create(umi, {
      name: 'Never Gonna Give You Up',
      uri: 'https://ivory-eligible-hamster-305.mypinata.cloud/ipfs/bafkreibfzhrybi5pjbkk2wx433pwrsj3o6pk5rmdyj6tfvhh6c2whuxji4',
      asset: assetAddress,
      owner: publicKey(to)
    }).sendAndConfirm(umi)

    const signatureArray = Uint8Array.from(Object.values(sendResult.signature))
    const txHash = bs58.encode(signatureArray)

    let asset: any

    for (let i = 0; i < 25; i++) {
      try {
        asset = await fetchAssetV1(umi, assetAddress.publicKey)
        console.log(`Asset fetch attempt ${i + 1}: `, asset)
        break
      } catch (error: any) {
        console.error(`Error during asset fetch attempt ${i + 1}`)
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    if (!asset) {
      return NextResponse.json({ success: false, error: 'Asset fetch failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, asset, txHash }, { status: 200 })

  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ success: false, error: e.message }, { status: 401 })
  }
}
