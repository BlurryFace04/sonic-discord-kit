export const maxDuration = 300

import { NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import {
  Connection,
  PublicKey,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

// Initialize Privy Client
const client = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
  {
    walletApi: {
      authorizationPrivateKey: process.env.PRIVY_SIGNING_KEY!,
    },
  }
);

// Fetch mint metadata (decimals & program type)
async function getMintInfo(connection: Connection, mintAddress: PublicKey) {
  const mintInfo = await connection.getParsedAccountInfo(mintAddress);
  
  if (!mintInfo.value) {
    throw new Error("Mint account not found.");
  }

  const parsedData = mintInfo.value.data as any;
  if (!parsedData.parsed) {
    throw new Error("Failed to parse mint account data.");
  }

  const decimals = parsedData.parsed.info.decimals;
  const program = mintInfo.value.owner.toBase58();
  const isToken2022 = program === TOKEN_2022_PROGRAM_ID.toBase58();

  return { decimals, programId: isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID };
}

// Token Transfer Endpoint
export async function POST(request: Request) {
  try {
    const { from, to, mintAddress, amount } = await request.json();

    if (!from || !to || !mintAddress || amount === undefined) {
      return NextResponse.json(
        { error: "Missing required parameters: from, to, mintAddress, and amount." },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number in the smallest unit." },
        { status: 400 }
      );
    }

    const connection = new Connection("https://sonic.helius-rpc.com", "confirmed");
    
    const fromPubkey = new PublicKey(from);
    const toPubkey = new PublicKey(to);
    const mintPubkey = new PublicKey(mintAddress);

    // Fetch decimals & token program (SPL or Token-2022)
    const { decimals, programId } = await getMintInfo(connection, mintPubkey);
    console.log(`Token ${mintAddress} has ${decimals} decimals, using program: ${programId.toBase58()}`);

    // Get Associated Token Accounts (ATA) for sender and receiver
    const fromTokenAccount = await getAssociatedTokenAddress(mintPubkey, fromPubkey, false, programId);
    const toTokenAccount = await getAssociatedTokenAddress(mintPubkey, toPubkey, false, programId);

    // Construct token transfer instruction
    const transferInstruction = createTransferCheckedInstruction(
      fromTokenAccount,
      mintPubkey,
      toTokenAccount,
      fromPubkey,
      amount, // Already in smallest unit
      decimals,
      [],
      programId
    );

    const recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;

    // Construct the transaction message
    const message = new TransactionMessage({
      payerKey: fromPubkey,
      instructions: [transferInstruction],
      recentBlockhash,
    });

    const tx = new VersionedTransaction(message.compileToV0Message());

    // Sign transaction using Privy
    const { signedTransaction } = await client.walletApi.solana.signTransaction({
      walletId: "hh9ro3laqcyf47wxfrtxwj5c",
      transaction: tx,
    });

    const rawTransaction = signedTransaction.serialize();
    const txHash = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
    });

    console.log(`https://explorer.sonic.game/tx/${txHash}`);
    return NextResponse.json({ success: true, txHash });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}
