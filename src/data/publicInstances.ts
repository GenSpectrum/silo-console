import { EXERCISE_SERVER } from '../config';

export type PublicInstance = {
    id: string;
    name: string;
    hostedBy: string;
    server: string;
};

export const publicInstances: PublicInstance[] = [
    {
        id: 'sars-cov-2',
        name: 'SARS-CoV-2',
        hostedBy: 'CoV-Spectrum',
        server: EXERCISE_SERVER,
    },
];
