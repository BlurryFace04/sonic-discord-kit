import 'dotenv/config';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const PRIVY_CREATE_ACCOUNT_COMMAND = {
  name: 'privy',
  description: 'Create a Solana Account with Privy',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const PRIVY_GET_ACCOUNT_COMMAND = {

}

const ALL_COMMANDS = [ PRIVY_CREATE_ACCOUNT_COMMAND ];

InstallGlobalCommands(process.env.DISCORD_APP_ID, ALL_COMMANDS);
