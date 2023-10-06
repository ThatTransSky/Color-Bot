import { log, uppercaseWord } from './utils.js';

export class Constants {
    public static colorRoles = [
        'Dark Red',
        'Red',
        'Orange',
        'Yellow',
        'Green',
        'Dark Green',
        'Teal',
        'Blue',
        'Purple',
        'Light Pink',
        'Hot Pink',
        'Magenta',
        'Black',
        'White',
    ];
    public static ageRoles = [
        {
            label: '18+',
            description: 'You are over the age of 18.',
            value: 'boomer',
        },
        {
            label: 'Minor',
            description: `You are below the age of 18. (but over 13, @discord relax)`,
            value: 'minor',
        },
    ];
    public static sexualityRoles = [
        {
            label: 'I love woman.',
            value: 'woman lover',
        },
        {
            label: 'I love man.',
            value: 'man lover',
        },
        {
            label: 'I love all genders.',
            value: 'any lover',
        },
        {
            label: `I don't know / would rather not say.`,
            value: 'unknown lover',
        },
    ];
    public static pronounRoles = [
        {
            label: 'He/Him',
            value: 'he/him',
        },
        {
            label: 'She/Her',
            value: 'she/her',
        },
        {
            label: 'They/Them',
            value: 'they/them',
        },
        {
            label: 'Any',
            value: 'any pronouns',
        },
        {
            label: 'Other/Ask',
            value: 'ask me for pronouns',
        },
    ];
    public static pingRoles = [
        {
            label: 'All Pings',
            description:
                'You will be pinged whenever any activity / announcement is made.',
            value: 'all pings',
        },
        {
            label: 'SMP Pings',
            description:
                'You will be pinged whenever any SMP-Related activity / announcement is made.',
            value: 'smp member',
        },
        {
            label: 'Poll Pings',
            description: `You will be pinged whenever there's a poll running.`,
            value: 'poll pings',
        },
        {
            label: 'Announcement Pings',
            description:
                'You will be pinged whenever a non-specific announcement is made.',
            value: 'announcement pings',
        },
        {
            label: 'VC Pings',
            description:
                'You will be pinged whenever a member is looking for someone to VC with.',
            value: 'vc pings',
        },
    ];
    public static roleTypes = [
        {
            label: 'Age',
            description: 'Your age group role.',
            value: 'age',
        },
        {
            label: 'Sexuality',
            description: 'The role that best describes your sexuality.',
            value: 'sexuality',
        },
        {
            label: 'Pronouns',
            description: 'The role(s) that fits your pronouns.',
            value: 'pronouns',
        },
        {
            label: 'Color Role',
            description: 'Your color role.',
            value: 'color',
        },
        {
            label: 'Pings',
            description: 'When would you rather be pinged or not.',
            value: 'pings',
        },
    ];

    public static getRoleTypeValues(roleType: string) {
        const values: string[] = [];
        switch (roleType) {
            case 'age':
                this.ageRoles.forEach((data) => {
                    values.push(data.value);
                });
                return values;
            case 'sexuality':
                this.sexualityRoles.forEach((data) => {
                    values.push(data.value);
                });
                return values;
            case 'pronouns' || 'pronoun':
                this.pronounRoles.forEach((data) => {
                    values.push(data.value);
                });
                return values;
            case 'pings' || 'ping':
                this.pingRoles.forEach((data) => {
                    values.push(data.value);
                });
                return values;
            default:
                log(
                    { level: 'warn' },
                    `getRoleTypeValues - roleType doesn't exist, got ${roleType}`,
                );
                return;
        }
    }

    public static convertColorIntoOptions() {
        return this.colorRoles.map((color) => {
            return {
                label: color,
                value: color.toLowerCase(),
            };
        });
    }
}
