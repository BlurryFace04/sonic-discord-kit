import 'dotenv/config';

export async function DiscordRequest(endpoint, options) {
  // append endpoint to root API URL
  const url = 'https://discord.com/api/v10/' + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
    },
    ...options
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

export async function GetGlobalCommands(appId) {
  const endpoint = `applications/${appId}/commands`;
  try {
    const res = await DiscordRequest(endpoint, { method: 'GET' });
    return await res.json();
  } catch (err) {
    console.error('Error fetching global commands:', err);
    return [];
  }
}

export async function InstallGlobalCommands(appId, commands) {
  const endpoint = `applications/${appId}/commands`;

  try {
    // Fetch existing commands first
    const existingCommands = await GetGlobalCommands(appId);
    console.log('Existing commands: ', existingCommands);

    // Find Entry Point command (Discord Activity command)
    const entryPointCommand = existingCommands.find(cmd => cmd.handler === 2);

    // Ensure it's included
    if (entryPointCommand) {
      console.log('Entry Point command found: ', entryPointCommand);
      commands.push(entryPointCommand);
    }

    console.log('Final command list: ', commands);

    // Send the updated command list
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
  } catch (err) {
    console.error(err);
  }
}

// Simple method that returns a random emoji from list
export function getRandomEmoji() {
  const emojiList = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];
  return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
