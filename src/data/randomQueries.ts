// Example queries offered by the Console's "Insert random query" button when the
// SARS-CoV-2 instance hosted by CoV-Spectrum is selected.
//
// Every query starts with a one- or two-line `--` comment that explains what it
// does, so the inserted text is self-documenting in the editor. All of them are
// validated against the SARS-CoV-2 instance: they run, return a non-empty
// result, and stay small. They deliberately differ from the exercise reference
// answers in src/data/exercises.ts so the two sets complement each other.

// The query the landing page shows in its hero panel. The landing page renders it
// without the comment and links to the Console with the comment included.
export const landingPageQuery = `-- Ranks the most common combinations of pango lineage and S protein symbols at
-- positions 69, 70 and 501 among sequences from Europe.
default
  .filter(region = 'Europe')
  .map({"S[69]" := S.at(69), "S[70]" := S.at(70), "S[501]" := S.at(501)})
  .groupBy({count := count()}, {pangoLineage, "S[69]", "S[70]", "S[501]"})
  .orderBy({count.desc()})
  .limit(10)`;

// Drops the leading `--` description, for places that show a query without it.
export function withoutLeadingComments(query: string) {
    return query.replace(/^(?:--[^\n]*\n)+/, '');
}

export const sarsCov2RandomQueries = [
    landingPageQuery,
    `-- Finds sequence counts by country from 2025 carrying the S:69 deletion.
default
  .filter(
    date.between('2025-01-01'::date, '2025-12-31'::date)
    && aminoAcidEquals(position := 69, symbol := '-', sequenceName := 'S')
  )
  .groupBy({count := count()}, {country})
  .orderBy({count.desc(), country})
  .limit(20)`,
    `-- Shows the 15 most recent sequences assigned to XEC or one of its sublineages.
default
  .filter(pangoLineage.lineage('XEC', includeSublineages := true))
  .project({date, country, pangoLineage, strain})
  .orderBy({date.desc(), strain})
  .limit(15)`,
    `-- Compares monthly submission volumes from Germany and the USA during 2024.
default
  .filter(dateSubmittedYear = 2024 && country.in({'Germany', 'USA'}))
  .groupBy({count := count()}, {country, dateSubmittedMonth})
  .orderBy({dateSubmittedMonth, country})
  .limit(30)`,
    `-- Draws a reproducible sample of ten African sequences collected during 2023.
default
  .filter(region = 'Africa' && date.between('2023-01-01'::date, '2023-12-31'::date))
  .randomize(seed := 2025)
  .project({strain, date, country, pangoLineage})
  .limit(10)`,
    `-- Ranks the most common Nextstrain clades among sequences from Japan in 2023.
default
  .filter(
    country = 'Japan'
    && date.between('2023-01-01'::date, '2023-12-31'::date)
    && isNotNull(nextstrainClade)
  )
  .groupBy({count := count()}, {nextstrainClade})
  .orderBy({count.desc(), nextstrainClade})
  .limit(15)`,
    `-- Locates the Swiss BA.5.1 sequences in the UShER phylogeny by reporting the node
-- that is their most recent common ancestor.
default
  .filter(country = 'Switzerland' && pangoLineage.lineage('BA.5.1', includeSublineages := true))
  .mostRecentCommonAncestor('usherTree')`,
    `-- Summarizes common N-protein changes in US sequences collected in January 2022.
default
  .filter(country = 'USA' && date.between('2022-01-01'::date, '2022-01-31'::date))
  .aminoAcidMutations(minProportion := 0.05, sequenceNames := {N})
  .orderBy({count.desc(), position})
  .limit(15)`,
    `-- Lists the animal hosts other than humans that SARS-CoV-2 sequences were sampled from.
default
  .filter(isNotNull(host) && host <> 'Homo sapiens')
  .groupBy({count := count()}, {host})
  .orderBy({count.desc(), host})
  .limit(15)`,
    `-- Lists the most common nucleotide insertions among sequences from Switzerland.
default
  .filter(country = 'Switzerland')
  .insertions(sequenceNames := {main})
  .orderBy({count.desc(), position})
  .limit(15)`,
    `-- Counts the near-complete genomes (at least 99% Nextclade coverage) that were
-- submitted in 2025, broken down by region.
default
  .filter(nextcladeCoverage >= 0.99 && dateSubmittedYear = 2025)
  .groupBy({count := count()}, {region})
  .orderBy({count.desc(), region})
  .limit(10)`,
] as const;

// Picks one of the example queries at random, skipping `currentQuery` so that
// pressing the button repeatedly always changes the editor content.
export function getRandomSarsCov2Query(currentQuery = '', random = Math.random) {
    const candidates = sarsCov2RandomQueries.filter((query) => query !== currentQuery);
    const index = Math.min(Math.floor(random() * candidates.length), candidates.length - 1);
    return candidates[index];
}
