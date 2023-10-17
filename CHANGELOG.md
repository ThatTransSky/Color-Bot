# Changelog

(_Note: This changelog will only cover **meaningful** commits and changes_)

## [Latest](https://github.com/That-TransGirl/Color-Bot/commit/master 'Latest Commit')

-   Created this changelog
-   **Removed Role Menu Handling From `interactionCreate.ts`** - which means that, for now, the menu is not fully implemented yet. \
    Sure, some can question why the _fuck_ would I do that but the answer is simple:
    _The current code was so bad that I'd rather rewrite it all_.
-   Added `buildCustomId` function to [`utils.ts`](./helpers/utils.ts)
-   Added ground work for a change-able Role Menu config (see the class [`RoleConstants`](./helpers/constants.ts)):
    -   The class supports removing and updating roles, as well as updating local role data with the server's role data.
    -   The function `verifyStoredRoles` now runs after the client is ready and it updates the local data with the data from the server.
-   Started reworking the role menu handling - current plan is to seperate stages into different functions.
-   Added [`roleUpdate.ts`](./events/roleUpdate.ts) & [`roleDelete.ts`](./events/roleDelete.ts) to allow the `RoleConstants` class to stay up to date with changes to the roles registered under it.
-   Moved `mainAction`, `secondaryAction`, etc. to one object (called `customIdObj`). I don't know if I'm going to keep it this way but that's how it is for now.
-   General rewrites and cleanups.

## [a4380f5](https://github.com/That-TransGirl/Color-Bot/commit/a4380f5)

-   Updated [`.gitignore`](./.gitignore).
-   Added settings to [`.prettierrc`](./.prettierrc) to support uniform formatting.
-   Moved everything out of `src` to the top level to fix an issue with relative pathing.
-   (**WIP**) Started rewriting and seperating the code in [`interactionCreate.ts`](./events/interactionCreate.ts) to declatter the massive file (1,600+ lines o_0).
-   Created new builders to minimize repeated code writing
-   Added [`constants.ts`](./helpers/constants.ts) to further declatter the code.
-   Seperated the getting and loading of the event & command files into functions.
-   Added `interactionTypeToString` & `uppercaseWord` functions to [`utils.ts`](./helpers/utils.ts).
-   Other misc. changes that I can't remember 🤷‍♀️.
