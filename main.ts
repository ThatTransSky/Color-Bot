import { ActivityType, Client, Collection, GatewayIntentBits } from 'discord.js';
// import { Client } from 'discordx';
import { config } from 'dotenv';
import * as fs from 'fs';
import { CommandStructure } from './classes/CommandStructure';
let client = new Client({
  presence: {
    status: 'online',
    activities: [{ type: ActivityType.Watching, name: 'you in your sleep 👻' }],
  },
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    // GatewayIntentBits.MessageContent,
    // GatewayIntentBits.GuildMessageReactions,
    // GatewayIntentBits.GuildPresences,
    // GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMembers,
  ],
});
config();
export type Client2 = Client & { commands: Collection<string, CommandStructure> };
const client2 = client as Client2;
(async () => {
  /*
TODO: Put the command collection and event handler in separate files to tidy up the code
*/

  const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));

  const commands: any[] = [];

  client2.commands = new Collection<string, CommandStructure>();

  for (const file of commandFiles) {
    const command = (await import(`./commands/${file}`)) as CommandStructure;
    // console.log(command);
    commands.push(command.data);
    client2.commands.set(command.data.name, command);
  }

  // Event Handler

  const eventFiles = fs.readdirSync('./events').filter((file) => file.endsWith('.js'));

  for (const file of eventFiles) {
    const event = await import(`./events/${file}`);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, commands)); // Runs the "run-once" events.
    } else {
      client.on(event.name, (...args) => event.execute(...args, client)); // Runs the rest of the events.
    }
  }

  client.login(process.env.TOKEN);
})();