export const maxDuration = 300

import { NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import {
  Connection,
  PublicKey,
  SystemProgram,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import bs58 from "bs58";

const client = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
  {
    walletApi: {
      authorizationPrivateKey: process.env.PRIVY_SIGNING_KEY!,
    },
  }
);

export async function POST(request: Request) {
  try {
    const { from, to, lamports } = await request.json();

    // Validate required parameters
    if (!from || !to || lamports === undefined) {
      return NextResponse.json(
        { error: "Missing required parameters: from, to, and lamports." },
        { status: 400 }
      );
    }

    if (typeof lamports !== "number" || lamports <= 0) {
      return NextResponse.json(
        { error: "Lamports must be a positive number." },
        { status: 400 }
      );
    }

    // Use your preferred RPC endpoint
    const connection = new Connection("https://sonic.helius-rpc.com", "confirmed");

    const instruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(from),
      toPubkey: new PublicKey(to),
      lamports,
    });

    // console.log(instruction);

    const recentBlockhash = (
      await connection.getLatestBlockhash("finalized")
    ).blockhash;
    // console.log("recentBlockhash:", recentBlockhash);

    const message = new TransactionMessage({
      payerKey: new PublicKey(from),
      instructions: [instruction],
      recentBlockhash,
    });

    const tx = new VersionedTransaction(message.compileToV0Message());
    // console.log(tx);

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
