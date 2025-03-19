export const maxDuration = 300

// app/api/user/route.ts
import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import mongoose from 'mongoose';

// GET /api/user?discordId=<discordId>
// Retrieves the stored user data for the given Discord user ID.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const discordId = searchParams.get('discordId');

  if (!discordId) {
    return NextResponse.json({ error: 'Missing discordId parameter' }, { status: 400 });
  }

  await connectToDB();

  if (!mongoose.connection.db) {
    return NextResponse.json({ error: 'Database connection not established' }, { status: 500 });
  }

  const user = await mongoose.connection.db.collection('users').findOne({ discordId });
  return NextResponse.json({ user });
}

// POST /api/user
// Expects a JSON payload in the form: { discordId: string, user: any }
export async function POST(request: Request) {
  try {
    const { discordId, user } = await request.json();

    if (!discordId || !user) {
      return NextResponse.json({ error: 'Missing discordId or user in request body' }, { status: 400 });
    }

    await connectToDB();

    if (!mongoose.connection.db) {
      return NextResponse.json({ error: 'Database connection not established' }, { status: 500 });
    }

    await mongoose.connection.db.collection('users').updateOne(
      { discordId },
      { $set: { user } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
