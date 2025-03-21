export const maxDuration = 300

import { NextResponse } from "next/server"
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { fetchAssetV1, mplCore, createCollection, ruleSet, fetchCollectionV1 } from '@metaplex-foundation/mpl-core'
import { generateSigner, signerIdentity } from "@metaplex-foundation/umi"
import { publicKey } from '@metaplex-foundation/umi'
import { getPrivySigner } from "@/components/PrivySigner"
import bs58 from "bs58"

export async function POST(request: Request) {
  try {
    const { payer, walletId } = await request.json()

    if (!payer || !walletId) {
      return NextResponse.json({ success: false, error: 'Missing required parameters: payer, and walletId.' }, { status: 400 })
    }

    const umi = createUmi('https://sonic.helius-rpc.com')
    umi.use(mplCore())

    const privySigner = getPrivySigner(payer, walletId)

    umi.use(signerIdentity(privySigner))

    const collectionSigner = generateSigner(umi)

    const sendResult = await createCollection(umi, {
      collection: collectionSigner,
      name: 'Meme Collection',
      uri: 'https://ivory-eligible-hamster-305.mypinata.cloud/ipfs/bafkreibuvfjxxh7cciapp7vd4pmuf76buovxc7beiioupqfvd5l5zqt3fu',
      plugins: [
        {
          type: "Royalties",
          basisPoints: 690,
          creators: [
            {
              address: publicKey(payer),
              percentage: 100
            }
          ],
          ruleSet: ruleSet("None") // Compatibility rule set
        }
      ]
    }).sendAndConfirm(umi)

    const signatureArray = Uint8Array.from(Object.values(sendResult.signature))
    const txHash = bs58.encode(signatureArray)

    let collection: any

    for (let i = 0; i < 25; i++) {
      try {
        collection = await fetchCollectionV1(umi, collectionSigner.publicKey)
        console.log(`Collection fetch attempt ${i + 1}: `, collection)
        break
      } catch (error: any) {
        console.error(`Error during collection fetch attempt ${i + 1}`)
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    if (!collection) {
      return NextResponse.json({ success: false, error: 'Collection fetch failed' }, { status: 500 })
    }

    collection.header.lamports.basisPoints = collection.header.lamports.basisPoints.toString()

    return NextResponse.json({ success: true, collection, txHash }, { status: 200 })

  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ success: false, error: e.message }, { status: 401 })
  }
}
