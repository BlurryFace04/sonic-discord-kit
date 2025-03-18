export const maxDuration = 300

import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

export async function POST(request: Request) {
  try {
    const { address } = await request.json();
    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required." },
        { status: 400 }
      );
    }

    const connection = new Connection("https://sonic.helius-rpc.com", "confirmed");
    const balance = await connection.getBalance(new PublicKey(address));
    return NextResponse.json({ balance });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
