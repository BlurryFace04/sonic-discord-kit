import { NextResponse } from "next/server"
import { PrivyClient } from "@privy-io/server-auth"
import {
  Connection,
  PublicKey,
  VersionedTransaction,
  TransactionMessage,
  TransactionInstruction,
  Transaction,
} from "@solana/web3.js"
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  AccountLayout,
  createCloseAccountInstruction
} from "@solana/spl-token"

// Initialize Privy Client
const client = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
  {
    walletApi: {
      authorizationPrivateKey: process.env.PRIVY_SIGNING_KEY!
    }
  }
)

const connection = new Connection("https://sonic.helius-rpc.com", "confirmed")

async function create_close_instruction(
  wallet_address: PublicKey,
  token_program: PublicKey,
): Promise<TransactionInstruction[]> {
  const instructions = []

  const ata_accounts = await connection.getTokenAccountsByOwner(
    wallet_address,
    { programId: token_program },
    "confirmed",
  )

  const tokens = ata_accounts.value

  const accountExceptions = [
    "HbDgpvHVxeNSRCGEUFvapCYmtYfqxexWcCbxtYecruy8", // USDC
  ]

  for (let i = 0; i < tokens.length; i++) {
    const token_data = AccountLayout.decode(tokens[i].account.data)
    if (
      token_data.amount === BigInt(0) &&
      !accountExceptions.includes(token_data.mint.toString())
    ) {
      const closeInstruction = createCloseAccountInstruction(
        ata_accounts.value[i].pubkey,
        wallet_address,
        wallet_address,
        [],
        token_program,
      )

      instructions.push(closeInstruction)
    }
  }

  return instructions
}

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json()

    const spl_token = await create_close_instruction(
      walletAddress,
      TOKEN_PROGRAM_ID
    )
    const token_2022 = await create_close_instruction(
      walletAddress,
      TOKEN_2022_PROGRAM_ID,
    )
    const transaction = new Transaction()

    const MAX_INSTRUCTIONS = 40 // 40 instructions can be processed in a single transaction without failing

    spl_token
      .slice(0, Math.min(MAX_INSTRUCTIONS, spl_token.length))
      .forEach((instruction) => transaction.add(instruction))

    token_2022
      .slice(0, Math.max(0, MAX_INSTRUCTIONS - spl_token.length))
      .forEach((instruction) => transaction.add(instruction))

    const size = spl_token.length + token_2022.length

    if (size === 0) {
      return NextResponse.json({ success: true, size }, { status: 200 })
    }

    const signature = await connection.sendTransaction(transaction, [
      walletAddress,
    ])

    return NextResponse.json({ success: true, size, signature }, { status: 200 })

  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ success: false, error: e.message }, { status: 401 })
  }
}
