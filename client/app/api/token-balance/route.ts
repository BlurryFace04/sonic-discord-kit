import { NextResponse } from "next/server"
import { Connection, PublicKey } from "@solana/web3.js"
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getTokenMetadata,
} from "@solana/spl-token"

export async function POST(request: Request) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required." },
        { status: 400 }
      )
    }

    const connection = new Connection("https://sonic.helius-rpc.com", "confirmed")
    const ownerPublicKey = new PublicKey(address)

    // Define both token programs to check
    const tokenPrograms = [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]

    let splTokens: any[] = []
    let token2022Tokens: any[] = []

    for (const programId of tokenPrograms) {
      // Fetch all token accounts for the user
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerPublicKey, {
        programId
      })

      for (const account of tokenAccounts.value) {
        console.log("account: ", JSON.stringify(account, null, 2))

        const tokenMint = new PublicKey(account.account.data.parsed.info.mint)
        const balance = account.account.data.parsed.info.tokenAmount.amount
        const decimals = account.account.data.parsed.info.tokenAmount.decimals

        // Fetch metadata
        let metadata = { name: "Unknown", symbol: "UNKNOWN" }
        try {
          const tokenMetadata = await getTokenMetadata(
            connection,
            tokenMint,
            "confirmed",
            programId
          )

          if (tokenMetadata) {
            metadata = {
              name: tokenMetadata.name || "Unknown",
              symbol: tokenMetadata.symbol || "UNKNOWN"
            }
          }
        } catch (err) {
          console.warn(`Metadata fetch failed for token: ${tokenMint.toString()}`)
        }

        // Store token data
        const tokenData = {
          mint: tokenMint.toString(),
          balance,
          decimals,
          ...metadata
        }

        if (programId === TOKEN_PROGRAM_ID) {
          splTokens.push(tokenData)
        } else {
          token2022Tokens.push(tokenData)
        }
      }
    }

    return NextResponse.json({ splTokens, token2022Tokens })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
