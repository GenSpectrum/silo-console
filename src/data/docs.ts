export type DocumentationPage = {
    path: string;
    title: string;
    summary: string;
};

export type DocumentationSection = {
    title: string;
    description: string;
    pages: DocumentationPage[];
};

export const documentationSections: DocumentationSection[] = [
    {
        title: 'Explanation',
        description: "RhyDB's data and query model.",
        pages: [
            {
                path: '/docs/explanation/what-is-rhydb',
                title: 'What is RhyDB?',
                summary: 'What RhyDB does and how it relates to other tools.',
            },
            {
                path: '/docs/explanation/data-model',
                title: 'Data model and queries',
                summary: 'Tables, pipelines, schemas, aligned sequences, and reference coordinates.',
            },
            {
                path: '/docs/explanation/from-sql',
                title: 'RhyDB for SQL users',
                summary: 'A comparison of RhyDB pipelines with SQL.',
            },
        ],
    },
    {
        title: 'Reference',
        description: 'Query syntax, functions, and HTTP behavior.',
        pages: [
            {
                path: '/docs/reference/query-language',
                title: 'Query language',
                summary: 'Query structure, literals, operators, and pipeline operations.',
            },
            {
                path: '/docs/reference/functions',
                title: 'Functions',
                summary: 'Scalar, lineage, sequence, insertion, and mutation-profile functions.',
            },
            {
                path: '/docs/reference/http-api',
                title: 'HTTP API',
                summary: 'Endpoints, request and response formats, headers, and errors.',
            },
        ],
    },
];
