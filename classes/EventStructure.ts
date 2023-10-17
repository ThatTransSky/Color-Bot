export interface EventStructure {
    data: {
        name: string;
        once: boolean;
    };
    execute: (...args: any[]) => any;
}
