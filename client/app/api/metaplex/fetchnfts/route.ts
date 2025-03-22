export const maxDuration = 300

import { NextResponse } from "next/server"
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { fetchAssetV1, mplCore, create, fetchCollection, fetchAssetsByOwner } from '@metaplex-foundation/mpl-core'
import { generateSigner, signerIdentity } from "@metaplex-foundation/umi"
import { publicKey } from '@metaplex-foundation/umi'
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters"
import { getPrivySigner } from "@/components/PrivySigner"
import bs58 from "bs58"
import { PublicKey } from "@solana/web3.js"

function convertBigInts(obj: any): any {
  if (typeof obj === 'bigint') {
    return obj.toString()
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigInts)
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, convertBigInts(value)])
    )
  }
  return obj
}

export async function POST(request: Request) {
  try {
    const { address, walletId } = await request.json()

    if (!address || !walletId) {
      return NextResponse.json({ success: false, error: 'Missing required parameters: address and walletId.' }, { status: 400 })
    }

    const umi = createUmi('https://sonic.helius-rpc.com')
    umi.use(mplCore())

    const privySigner = getPrivySigner(address, walletId)

    umi.use(signerIdentity(privySigner))

    const assetsByOwner = await fetchAssetsByOwner(umi, address, {
      skipDerivePlugins: false
    })

    // console.log(JSON.stringify(assetsByOwner, null, 2))

    const safeAssets = convertBigInts(assetsByOwner)

    return NextResponse.json({ success: true, assets: safeAssets }, { status: 200 })
    
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ success: false, error: e.message }, { status: 401 })
  }
}
