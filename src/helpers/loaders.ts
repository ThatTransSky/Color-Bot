import { readdir } from "fs";
import { EventStructure } from "../classes/EventStructure.js";
import { Client2 } from "../main.js";
import { Collection } from "discord.js";
import { CommandStructure } from "../classes/CommandStructure.js";

export async function loadCommands(client: Client2, loaded: () => void) {
	let path: string = "";
	if (process.cwd().endsWith("/src")) path = "commands";
	else path = "./src/commands";
	readdir(path, { encoding: "utf8", recursive: true }, async (err, files) => {
		if (err !== null && err !== undefined) {
			throw err;
		}
		// console.log(files);
		const commandFiles = files.filter((file) => file.endsWith(".js"));
		// console.log(commandFiles);
		let commands: CommandStructure[] = [];

		client.commands = new Collection<string, CommandStructure>();
		for (const file of commandFiles) {
			const command = (await import(`../commands/${file}`)) as CommandStructure;
			// console.log(command);
			commands.push(command);
			client.commands.set(command.data.name, command);
		}
		loaded();
		// let timers = {
		// 	timer: setInterval(() => {
		// 		if (commandFiles.length === commands.length) processed();
		// 		else return;
		// 	}, 100),
		// };
		// const processed = () => {
		// 	timers.timer.unref();
		// 	delete timers.timer;
		// 	loaded();
		// };
	});
}

export async function loadEvents(client: Client2, loaded: () => void) {
	let path: string = "";
	if (process.cwd().endsWith("/src")) path = "events";
	else path = "./src/events";
	readdir(path, { encoding: "utf-8", recursive: true }, async (err, files) => {
		if (err) {
			console.error(err);
			throw err;
		}
		// console.log(files);
		const eventFiles = files.filter((file) => file.endsWith(".js"));
		// console.log(eventFiles);
		for (const file of eventFiles) {
			const event = (await import(`../events/${file}`)) as EventStructure;
			client[event.data.once ? "once" : "on"](event.data.name, (...args) =>
				event.execute(...args, client)
			);
		}
		loaded();
	});
}
