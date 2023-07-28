import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
config();
export const name = 'ready', once = true;
export async function execute(client, commands) {
    // When bot loads
    if (!client || !client.user) {
        console.log('client is missing tf');
        return;
    }
    console.log(`Logged in as ${client.user.tag}!`);
    const CLIENT_ID = process.env.CLIENT_ID;
    const GUILD_ID = process.env.GUILD_ID;
    const rest = new REST({
        version: '10',
    }).setToken(process.env.TOKEN);
    // console.log(process.env.ENV);
    await (async () => {
        if (process.env.ENV === 'Production') {
            await rest.put(Routes.applicationCommands(CLIENT_ID), {
                body: commands,
            });
            console.log('Successfully registered global commands.');
        }
        else if (process.env.ENV === 'Development') {
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
                body: commands,
            });
            console.log('Successfully registered local commands.');
        }
        else {
            console.log(`Deployment Environment not recognized, got ${process.env.ENV}`);
        }
    })();
}
