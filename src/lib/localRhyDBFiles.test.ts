import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { validateRawBundle } from './localRhyDBFiles';

describe('validateRawBundle', () => {
    it('applies defaults, matches required files, and normalizes browser paths', async () => {
        const config = textFile(
            'preprocessing_config.yaml',
            `inputDirectory: /native/input
ndjsonInputFilename: nested/input.ndjson
lineageDefinitionFilenames:
  - taxonomy/lineages.yaml
phyloTreeFilename: trees/tree.nwk
`,
        );
        const files = [
            inputFile('input.ndjson'),
            inputFile('database_config.yaml'),
            inputFile('reference_genomes.json'),
            inputFile('lineages.yaml'),
            inputFile('tree.nwk'),
        ];

        const result = await validateRawBundle(config, files);

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(parse(result.normalizedConfig)).toMatchObject({
            inputDirectory: '.',
            outputDirectory: './output',
            ndjsonInputFilename: 'input.ndjson',
            databaseConfig: 'database_config.yaml',
            referenceGenomeFilename: 'reference_genomes.json',
            lineageDefinitionFilenames: ['lineages.yaml'],
            phyloTreeFilename: 'tree.nwk',
        });
    });

    it('reports every missing referenced file without discarding the selection', async () => {
        const result = await validateRawBundle(textFile('preprocessing.yaml', 'ndjsonInputFilename: data.ndjson\n'), [
            inputFile('data.ndjson'),
        ]);

        expect(result).toMatchObject({
            ok: false,
            missingFiles: ['database_config.yaml', 'reference_genomes.json'],
        });
    });

    it('rejects duplicate basenames', async () => {
        const result = await validateRawBundle(textFile('preprocessing.yaml', 'ndjsonInputFilename: data.ndjson\n'), [
            inputFile('data.ndjson'),
            inputFile('database_config.yaml'),
            inputFile('database_config.yaml'),
            inputFile('reference_genomes.json'),
        ]);

        expect(result).toMatchObject({ ok: false, duplicateFiles: ['database_config.yaml'] });
    });

    it('rejects xz input before loading WASM', async () => {
        const result = await validateRawBundle(
            textFile('preprocessing.yaml', 'ndjsonInputFilename: data.ndjson.xz\n'),
            [inputFile('data.ndjson.xz'), inputFile('database_config.yaml'), inputFile('reference_genomes.json')],
        );

        expect(result).toMatchObject({ ok: false });
        expect(result.ok || result.message).toContain('.xz');
    });

    it('warns when selected inputs exceed the 500 MB target without rejecting them', async () => {
        const result = await validateRawBundle(textFile('preprocessing.yaml', 'ndjsonInputFilename: data.ndjson\n'), [
            inputFile('data.ndjson', 501 * 1024 * 1024),
            inputFile('database_config.yaml'),
            inputFile('reference_genomes.json'),
        ]);

        expect(result).toMatchObject({ ok: true, exceedsTargetSize: true });
    });
});

function textFile(name: string, contents: string) {
    return {
        name,
        size: contents.length,
        text: async () => contents,
    } as File;
}

function inputFile(name: string, size = 1) {
    return { name, size } as File;
}
