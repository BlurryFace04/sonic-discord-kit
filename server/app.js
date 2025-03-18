import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRandomEmoji, DiscordRequest } from './utils.js';

// Create an express app
const app = express();

app.use(express.json());

// Configure CORS to allow requests from client
app.use(cors({
  origin: 'https://sonic.discordkit.xyz',
}));

// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

app.post("/api/token", async (req, res) => {
  console.log("Token request received");
  console.log(req.body);
  
  // Exchange the code for an access_token
  const response = await fetch(`https://discord.com/api/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_APP_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code: req.body.code,
    }),
  });

  // Retrieve the access_token from the response
  const { access_token } = await response.json();

  // Return the access_token to our client as { access_token: "..."}
  res.send({access_token});
});

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction id, type and data
  const { id, type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "test" command
    if (name === 'test') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: `hello world ${getRandomEmoji()}`,
        },
      });
    }

    if (name === 'privy') {
      console.log(req.body);
      
      // const userId = req.body.user?.id;

      let userId

      if (req.body.user) {
        userId = req.body.user.id;
      } else if (req.body.member) {
        userId = req.body.member.user.id;
      }

      if (!userId) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "Your discord id is not found."
          }
        });
      }

      const loginUrl = `https://sonic.discordkit.xyz/privy/?userId=${userId}`;

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: loginUrl
        }
      });
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.get('/privy-callback', async (req, res) => {
  const { userId, address } = req.query; // Assuming you pass the userId as a query parameter

  console.log("Logged in user: ", userId, address);

  // Logic to open a DM channel and send a message to the user
  const messageContent = `You have successfully logged in with Privy! \nYour address is ${address}`;

  try {
    // Open a DM channel with the user
    const channelResponse = await DiscordRequest(`/users/@me/channels`, {
      method: 'POST',
      body: {
        recipient_id: userId,
      },
    });

    const channel = await channelResponse.json();

    // Send a message to the DM channel
    await DiscordRequest(`/channels/${channel.id}/messages`, {
      method: 'POST',
      body: {
        content: messageContent,
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
