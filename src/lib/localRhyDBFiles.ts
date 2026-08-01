import { parse, stringify } from 'yaml';

const TARGET_INPUT_BYTES = 500 * 1024 * 1024;

type PreprocessingConfig = Record<string, unknown>;

type RequiredFiles = {
    ndjson: string;
    databaseConfig: string;
    referenceGenome: string;
    lineageDefinitions: string[];
    phyloTree: string | null;
    all: string[];
};

export type RawBundleValidation =
    | {
          ok: true;
          normalizedConfig: string;
          files: File[];
          totalBytes: number;
          exceedsTargetSize: boolean;
      }
    | {
          ok: false;
          message: string;
          missingFiles?: string[];
          duplicateFiles?: string[];
          totalBytes: number;
          exceedsTargetSize: boolean;
      };

export async function validateRawBundle(configFile: File, inputFiles: File[]): Promise<RawBundleValidation> {
    const totalBytes = configFile.size + inputFiles.reduce((sum, file) => sum + file.size, 0);
    const sizeResult = { totalBytes, exceedsTargetSize: totalBytes > TARGET_INPUT_BYTES };

    let config: PreprocessingConfig;
    try {
        const value: unknown = parse(await configFile.text());
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('the document root must be a mapping');
        }
        config = value as PreprocessingConfig;
    } catch (error) {
        return {
            ok: false,
            message: `The preprocessing configuration is not valid YAML: ${errorMessage(error)}`,
            ...sizeResult,
        };
    }

    const required = requiredFilenames(config);
    if ('error' in required) {
        return { ok: false, message: required.error, ...sizeResult };
    }

    if (required.ndjson.toLowerCase().endsWith('.xz')) {
        return {
            ok: false,
            message: 'The browser build supports plain NDJSON and .zst input. This configuration selects an .xz file.',
            ...sizeResult,
        };
    }

    const duplicates = duplicateNames(inputFiles);
    if (duplicates.length) {
        return {
            ok: false,
            message: 'Each selected input must have a unique filename.',
            duplicateFiles: duplicates,
            ...sizeResult,
        };
    }

    const selectedNames = new Set(inputFiles.map((file) => file.name));
    const missing = required.all.filter((filename) => !selectedNames.has(filename));
    if (missing.length) {
        return {
            ok: false,
            message: `Add ${missing.length} file${missing.length === 1 ? '' : 's'} referenced by the configuration.`,
            missingFiles: missing,
            ...sizeResult,
        };
    }

    config.inputDirectory = '.';
    config.outputDirectory = './output';
    config.ndjsonInputFilename = required.ndjson;
    config.databaseConfig = required.databaseConfig;
    config.referenceGenomeFilename = required.referenceGenome;
    if (required.lineageDefinitions.length) config.lineageDefinitionFilenames = required.lineageDefinitions;
    if (required.phyloTree) config.phyloTreeFilename = required.phyloTree;

    return {
        ok: true,
        normalizedConfig: stringify(config),
        files: inputFiles,
        ...sizeResult,
    };
}

function requiredFilenames(config: PreprocessingConfig): RequiredFiles | { error: string } {
    const ndjsonValue = config.ndjsonInputFilename;
    if (typeof ndjsonValue !== 'string' || !ndjsonValue.trim()) {
        return { error: "The preprocessing configuration must set 'ndjsonInputFilename'." } as const;
    }

    const databaseConfig = optionalPath(config.databaseConfig, 'database_config.yaml', 'databaseConfig');
    if ('error' in databaseConfig) return databaseConfig;
    const referenceGenome = optionalPath(
        config.referenceGenomeFilename,
        'reference_genomes.json',
        'referenceGenomeFilename',
    );
    if ('error' in referenceGenome) return referenceGenome;

    let lineageDefinitions: string[] = [];
    if (config.lineageDefinitionFilenames !== undefined) {
        if (
            !Array.isArray(config.lineageDefinitionFilenames) ||
            !config.lineageDefinitionFilenames.every((value) => typeof value === 'string' && value.trim())
        ) {
            return { error: "'lineageDefinitionFilenames' must be a list of filenames." } as const;
        }
        lineageDefinitions = config.lineageDefinitionFilenames.map((value) => basename(value as string));
    }

    let phyloTree: string | null = null;
    if (config.phyloTreeFilename !== undefined) {
        if (typeof config.phyloTreeFilename !== 'string' || !config.phyloTreeFilename.trim()) {
            return { error: "'phyloTreeFilename' must be a filename." } as const;
        }
        phyloTree = basename(config.phyloTreeFilename);
    }

    const ndjson = basename(ndjsonValue);
    return {
        ndjson,
        databaseConfig: databaseConfig.value,
        referenceGenome: referenceGenome.value,
        lineageDefinitions,
        phyloTree,
        all: unique([
            ndjson,
            databaseConfig.value,
            referenceGenome.value,
            ...lineageDefinitions,
            ...(phyloTree ? [phyloTree] : []),
        ]),
    };
}

function optionalPath(value: unknown, fallback: string, key: string): { value: string } | { error: string } {
    if (value === undefined) return { value: fallback };
    if (typeof value !== 'string' || !value.trim()) return { error: `'${key}' must be a filename.` };
    return { value: basename(value) };
}

function basename(value: string) {
    return value.trim().replace(/\\/g, '/').split('/').filter(Boolean).at(-1) || '';
}

function duplicateNames(files: File[]) {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const file of files) {
        if (seen.has(file.name)) duplicates.add(file.name);
        seen.add(file.name);
    }
    return [...duplicates].sort();
}

function unique(values: string[]) {
    return [...new Set(values)];
}

function errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}
