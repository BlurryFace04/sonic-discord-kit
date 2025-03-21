export const maxDuration = 300

import { NextResponse } from "next/server"
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { fetchAssetV1, mplCore, create } from '@metaplex-foundation/mpl-core'
import { generateSigner, signerIdentity } from "@metaplex-foundation/umi"
import { publicKey } from '@metaplex-foundation/umi'
import { getPrivySigner } from "@/components/PrivySigner"
import bs58 from "bs58"

export async function POST(request: Request) {
  try {
    const { payer, to, walletId } = await request.json()

    if (!payer || !to || !walletId) {
      return NextResponse.json({ success: false, error: 'Missing required parameters: payer, to, and walletId.' }, { status: 400 })
    }

    const umi = createUmi('https://sonic.helius-rpc.com')
    umi.use(mplCore())

    const privySigner = getPrivySigner(payer, walletId)

    umi.use(signerIdentity(privySigner))

    const assetSigner = generateSigner(umi)

    const sendResult = await create(umi, {
      name: 'Never Gonna Give You Up',
      uri: 'https://ivory-eligible-hamster-305.mypinata.cloud/ipfs/bafkreibfzhrybi5pjbkk2wx433pwrsj3o6pk5rmdyj6tfvhh6c2whuxji4',
      asset: assetSigner,
      owner: publicKey(to)
    }).sendAndConfirm(umi)

    const signatureArray = Uint8Array.from(Object.values(sendResult.signature))
    const txHash = bs58.encode(signatureArray)

    let asset: any

    for (let i = 0; i < 25; i++) {
      try {
        asset = await fetchAssetV1(umi, assetSigner.publicKey)
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

    asset.header.lamports.basisPoints = asset.header.lamports.basisPoints.toString()

    return NextResponse.json({ success: true, asset, txHash }, { status: 200 })

  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ success: false, error: e.message }, { status: 401 })
  }
}
