import {
	ActivityType,
	Client,
	Collection,
	GatewayIntentBits,
} from "discord.js"; // Discord Imports
import { config } from "dotenv"; // DotEnv Imports
import { CommandStructure } from "./classes/CommandStructure"; // Purely for TS
import { loadCommands, loadEvents } from "./helpers/loaders.js"; // Command and Event Loaders
import { readdirSync } from "fs";
export type Client2 = Client & {
	commands: Collection<string, CommandStructure>;
};
export async function main(callback?: (client: Client2) => void) {
	// console.log("T");
	let client = new Client({
		presence: {
			status: "online",
			activities: [
				{ type: ActivityType.Watching, name: "you in your sleep 👻" },
			],
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
	const envPath =
		".\\src\\" +
		readdirSync("./src", {
			recursive: true,
			encoding: "utf-8",
		}).find((file) => file.endsWith(".env"));
	console.log(envPath);
	config({ path: envPath });
	const client2 = client as Client2;

	loadCommands(client2, () => {
		loadEvents(client2, () => {
			client2.login(process.env.TOKEN);
			if (callback !== undefined) callback(client2);
		});
	});
}

main();
