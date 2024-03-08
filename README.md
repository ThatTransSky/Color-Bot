# Changelog

(_Note: This changelog will only cover **meaningful** commits and changes_)

## [Latest](https://github.com/That-TransGirl/Color-Bot/commit/24e8f14) - Dev Update (and some other stuff idk).

-   [HOTFIX](https://github.com/That-TransGirl/Color-Bot/commit/master) - Removed a log that I forgot to delete lol.
-   **FIXED** - `applyChanges` (in [`roleMenu`](./handlers/roleMenu.ts)) no longer errors (because I forgot to make the second action row have _actual buttons_).
-   Renamed `GUILD_ID` to `MAIN_GUILD_ID`.
-   Added another [Global](./helpers/globals.ts) variable - `DEV_GUILD_ID`:
    -   This variable will house the ID for the Dev's guild.
    -   It is used for identifying which guild to register the Dev commands to.
    -   If not set, the Dev Commands will not register for that instance.
-   Added an identifier (although not a good one) to Dev commands:
    -   If the command's description starts with 'Dev - ', that command will be marked as a Dev command.
    -   For that to work (and for TypeScript's sake), modified [`CommandStructure`](./classes/CommandStructure.ts) to include the command's `description` (regardless of it's type).
-   Added a check in [`ready`](./events/ready.ts) to seperate between Regular and Dev commands, as well as checking if `DEV_GUILD_ID` is set and valid (throwing an error if not).
-   Added more debug info to [`interactionCreate`](./events/interactionCreate.ts) (such as 'who created the interaction', 'in what guild', 'if it's a command, what is the command name', etc.)
-   Added a log message (in [`toggleDevMode`](./commands/toggleDevMode.ts)) for when someone toggles _off_ Dev Mode™ (because I didn't already do that for some reason).
-   Added another case for `LocalUtils.log` - `success`.
    -   Until now, I've used the `log` case to indicate when something was done but `success` made a lot more sense for the logs that I wanted to make.
    -   Speaking of, logged the loading of: [`BotConfig`](./classes/botConfig.ts) (per guild), [`RoleConfig`](./classes/roleConfig.ts) (per guild) and [`GuildConfig`](./classes/guildConfigs.ts) (per guild).
-   Modified the method `outputBypassList` (in [`GlobalBotConfig`](./classes/globalBotConfig.ts)) to not rely on `MAIN_GUILD_ID` and instead search for the users in the bypass list in each of the guilds that the bot is in.
-   Also added a new method `bypassToString`, which is a WIP (because I'm lazy).

## [69d40f5](https://github.com/That-TransGirl/Color-Bot/commit/69d40f5) - I really need to commit more often.

-   Condensed every util function into one class - [`LocalUtils`](./helpers/utils.ts).
    -   Added new helper functions: `extractCustomId`, `isArrayEmpty`, `inputPredicate`, `findCurrRoute`, `invalidCharacters`.
-   Renamed `RoleConstants` to `RoleConfig`
-   Made every config nested under a guild ID so each guild has its own config:
    -   [`RoleConfig`](./classes/roleConfig.ts) - Consists of all role related settings.
    -   [`BotConfig`](./classes/botConfig.ts) - Consists of all bot related settings (not really used atm).
-   Added a class which handles all guild configs ([`GuildConfigs`](./classes/guildConfigs.ts)).
-   Also, the [`ready`](./events/ready.ts) event now creates a `GuildConfigs` instance for all of the bot's guilds.
-   `devMode` is now under a global config ([`globalBotConfig.ts`](./classes/globalBotConfig.ts)).
-   Added [`regexConstants`](./classes/regexConstants.ts) - Includes common regex strings for whenever I check strings for invalid characters.
-   Added [`routes`](./classes/routes.ts) - An interface for any route an interaction can take.
-   [`tempData`](./classes/tempData.ts):
    -   Renamed `initializeData` to `validateData` and takes a `DataObject` array instead of an instance of `tempData`. \
        The reason for these changes is so the method could be used in cases other than when creating the class (which was its previous use-case). \
        Also removed the line `this.UpdateFile()` for the same reasons.
    -   Added new methods: `extendExpire`, `countTotalData`, `clearData`.
    -   Added more properties to `SavedData`.
-   Added new commands: [`clearTemp`](./commands/clearTemp.ts), [`toggleDevMode`](./commands/toggleDevMode.ts).
-   You can now create categories without editing `roleConfig.json` manually. (still a Work-In-Progress, I wanted to get this commit out)
-   General rewrites & cleanups.

## [901b65f](https://github.com/That-TransGirl/Color-Bot/commit/901b65f) - Role Menu is done (finally).

-   **Finally** finished the role menu so it is fully functioning. All that I have really done \
    was move the 1,000+ lines to a seperate file ([`roleMenu.ts`](./handlers/roleMenu.ts)), with a few major (but mostly minor) changes and additions.
    -   As part of this rewrite, I used a temporary local data storage system (`tempData.json`, which would be under [`localData`](./localData)) \
        to store important information between interactions without using the `customId` property, \
        allowing for a lot more freedom with how I choose to use it in the future.
-   Renamed this to [`README.md`](./README.md) so it appears in the main page of the repository.
-   Took the bot out of Dev Mode™ - Currently working on a system so that Dev Mode™ is toggle-able, \
    didn't make much progress in that regard.
    -   _Ignore [`botConfig.ts`](./classes/botConfig.ts) for now._
-   A lot of code cleanup - which consisted of me hating on `if` statements and only using \
    `statement ? true : false` statements cause why not.
-   Added `checkRolesAgainstUser` and `checkRolesToReplace` methods because declattering is important (learned that the hard way).
-   Added more [component builders](./helpers/componentBuilders.ts) because... do I need to repeat myself?
-   Renamed `constants.ts` to [`globals.ts`](./helpers/globals.ts) (both the file and class name) and moved \
    all classes (for example, [`RoleConstants`](./classes/RoleConstants.ts)) to their respective file under the folder [classes](./classes).
-   Updated [`.gitignore`](./.gitignore) to include the _folder_ [`localData`](./localData) but exclude anything inside.
-   I probably missed something (like I always do) 🤷‍♀️

## [82e3161](https://github.com/That-TransGirl/Color-Bot/commit/82e3161) - This changelog (and other stuff).

-   Created this changelog
-   **Removed Role Menu Handling From `interactionCreate.ts`** - which means that, for now, the menu is not fully implemented yet. \
    Sure, some might question why the _fuck_ would I do that but the answer is simple:
    _The current code was so bad that I'd rather rewrite it all_.
-   Added `buildCustomId` function to [`utils.ts`](./helpers/utils.ts)
-   Added ground work for a change-able Role Menu config (see the class [`RoleConstants`](./helpers/constants.ts)):
    -   The class supports removing and updating roles, as well as updating local role data with the server's role data.
    -   The function `verifyStoredRoles` now runs after the client is ready and it updates the local data with the data from the server.
-   Started reworking the role menu handling - current plan is to seperate stages into different functions.
-   Added [`roleUpdate.ts`](./events/roleUpdate.ts) & [`roleDelete.ts`](./events/roleDelete.ts) to allow the `RoleConstants` class to stay up to date with changes to the roles registered under it.
-   Moved `mainAction`, `secondaryAction`, etc. to one object (called `customIdObj`). I don't know if I'm going to keep it this way but that's how it is for now.
-   General rewrites and cleanups.

## [a4380f5](https://github.com/That-TransGirl/Color-Bot/commit/a4380f5) - The start of a painful rewrite.

-   Updated [`.gitignore`](./.gitignore).
-   Added settings to [`.prettierrc`](./.prettierrc) to support uniform formatting.
-   Moved everything out of `src` to the top level to fix an issue with relative pathing.
-   (**WIP**) Started rewriting and seperating the code in [`interactionCreate.ts`](./events/interactionCreate.ts) to declatter the massive file (1,600+ lines o_0).
-   Created new builders to minimize repeated code writing
-   Added [`constants.ts`](./helpers/constants.ts) to further declatter the code.
-   Seperated the getting and loading of the event & command files into functions.
-   Added `interactionTypeToString` & `uppercaseWord` functions to [`utils.ts`](./helpers/utils.ts).
-   Other misc. changes that I can't remember 🤷‍♀️.
