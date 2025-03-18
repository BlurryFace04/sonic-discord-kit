export const maxDuration = 300

// app/api/user/route.ts
import { NextResponse } from 'next/server';

// An in-memory store for user sessions keyed by Discord user ID.
// This is ephemeral storage.
const userStore = new Map<string, any>();

// GET /api/user?discordId=<discordId>
// Retrieves the stored user data for the given Discord user ID.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const discordId = searchParams.get('discordId');

  if (!discordId) {
    return NextResponse.json({ error: 'Missing discordId parameter' }, { status: 400 });
  }

  const user = userStore.get(discordId) || null;
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

    // Store the user data in memory
    userStore.set(discordId, user);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
