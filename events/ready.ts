import { Collection, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { CommandStructure } from '../classes/CommandStructure';
import { Client2 } from '../main';
config();
export const name = 'ready',
  once = true;

export async function execute(client: Client2, commands: Collection<string, CommandStructure>) {
  // When bot loads
  if (!client || !client.user) {
    console.log('client is missing tf');
    return;
  }
  console.log(`Logged in as ${client.user.tag}!`);
  const CLIENT_ID = process.env.CLIENT_ID as string;
  const GUILD_ID = process.env.GUILD_ID as string;
  const rest = new REST({
    version: '10',
  }).setToken(process.env.TOKEN as string);
  // console.log(process.env.ENV);
  await (async () => {
    if (process.env.ENV === 'Production') {
      await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commands,
      });
      console.log('Successfully registered global commands.');
    } else if (process.env.ENV === 'Development') {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
      console.log('Successfully registered local commands.');
    } else {
      console.log(`Deployment Environment not recognized, got ${process.env.ENV as string}`);
    }
  })();
}
