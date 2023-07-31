import { readdir, readdirSync } from "fs";
import { EventStructure } from "../classes/EventStructure.js";
import { Client2 } from "../main.js";
import { Collection } from "discord.js";
import { CommandStructure } from "../classes/CommandStructure.js";
import chalk from "chalk";

export async function loadCommands(client: Client2, loaded: () => void) {
	readdir(
		process.cwd() + "/src",
		{ encoding: "utf8", recursive: true },
		async (err, files) => {
			if (err !== null && err !== undefined) {
				throw err;
			}
			// console.log(files);
			const commandFiles =
				// "./src/" +
				files
					.filter((file) => file.includes("commands"))
					.filter((file) => file.endsWith(".ts"));
			// console.log(commandFiles);
			if (commandFiles.length === 0)
				return console.log(chalk.redBright("ERROR: No commands were found!"));
			let commands: CommandStructure[] = [];
			commandFiles.forEach((file, i) => {
				commandFiles[i] = ".\\src\\" + file;
				// console.log(file);
			});
			client.commands = new Collection<string, CommandStructure>();
			for (const file of commandFiles) {
				const command = (await import(
					`file:\\\\${process.cwd()}\\${file}`
				)) as CommandStructure;
				// console.log(command);
				commands.push(command);
				client.commands.set(command.data.name, command);
			}
			if (commands.length === 0 || client.commands.at(0) === undefined)
				console.warn(chalk.yellowBright("WARN: No commands were loaded."));
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
		}
	);
}

export async function loadEvents(client: Client2, loaded: () => void) {
	readdir(
		process.cwd() + "/src",
		{ encoding: "utf-8", recursive: true },
		async (err, files) => {
			if (err) {
				console.error(err);
				throw err;
			}
			// console.log(files);
			const eventFiles = files
				.filter((file) => file.includes("events\\"))
				.filter((file) => file.endsWith(".ts"));
			if (eventFiles.length === 0)
				return console.log(chalk.redBright("ERROR: No events were found!"));
			eventFiles.forEach((file, i) => {
				eventFiles[i] = ".\\src\\" + file;
			});
			console.log(eventFiles);
			let events: EventStructure[] = [];
			for (const file of eventFiles) {
				const event = (await import(
					`file:\\\\${process.cwd()}\\${file}`
				)) as EventStructure;
				events.push(event);
				client[event.data.once ? "once" : "on"](event.data.name, (...args) =>
					event.execute(...args, client)
				);
			}
			if (events.length === 0)
				console.warn(chalk.yellowBright("WARN: No events were loaded."));
			loaded();
		}
	);
}
