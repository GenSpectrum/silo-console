// Practice exercises. Each has a natural-language question and a reference
// answer. When the user runs their query, it is compared against the result of
// the reference answer (see QueryRunner) to produce a Correct!/Wrong! verdict.
//
// All reference answers are validated against the default staging server
// (https://gs-staging-1.int.genspectrum.org/open/v2/silo): they run, return a
// non-empty / non-zero result, and stay well under 3 MB. The schema there uses
// columns such as `country`, `region`, `division`, `date`, `pangoLineage`,
// `strain`, `sex`, the nucleotide sequence `main`, and amino acid sequences like
// `S`. (There is no `age` data for many countries, so exercises avoid it.)
//
// Note: questions deliberately ask for a small "top N" (e.g. 20, not 100) so
// users must write their own `.limit(20)` rather than rely on the `.limit(100)`
// the runner appends automatically (which would otherwise produce 100 rows and a
// "Wrong!" verdict).
export type Exercise = {
    slug: string;
    title: string;
    question: string;
    answer: string;
    explanation: string;
    documentation: { label: string; to: string }[];
    returnAllRows?: boolean;
};

export const exercises: Exercise[] = [
    {
        slug: 'count-switzerland',
        title: 'Count sequences from Switzerland',
        question: 'Count all sequences from Switzerland.',
        explanation:
            'Start with the complete table and filter it to rows whose country equals Switzerland. The filtered rows still have the original schema. Then use groupBy with count() and no grouping columns to reduce all matching rows to one count.',
        documentation: [
            { label: 'Query pipelines', to: '/docs/explanation/data-model#queries-are-pipelines' },
            { label: 'filter and groupBy', to: '/docs/reference/query-language#pipeline-operations' },
        ],
        answer: `default
  .filter(country = 'Switzerland')
  .groupBy({count:=count()})`,
    },
    {
        slug: 'retrieve-basel-sequences',
        title: 'Retrieve Basel sequences',
        question:
            'Retrieve the 20 most recent sequences from Basel-Stadt, Switzerland, showing the GenBank accession, date, unaligned nucleotide sequence, aligned nucleotide sequence and S amino acid sequence.',
        explanation:
            'Use both location conditions in one filter. Ordering by date descending puts the most recent records first. Projecting selects the requested columns, and an explicit limit makes the requested result size part of the query.',
        documentation: [
            { label: 'filter', to: '/docs/reference/query-language#filter' },
            { label: 'project, orderBy, and limit', to: '/docs/reference/query-language#pipeline-operations' },
        ],
        answer: `default
  .filter(country = 'Switzerland' && division = 'Basel-Stadt')
  .orderBy({date.desc()})
  .project({genbankAccession, date, unaligned_main, main, S})
  .limit(20)`,
    },
    {
        slug: 'lineage-counts-2021h1',
        title: 'Lineage counts in early 2021',
        question:
            'For sequences collected between 1 January 2021 and 30 June 2021, count the sequences per pangoLineage and return the 20 most frequent lineages, most frequent first.',
        explanation:
            'between applies an inclusive lower and upper date bound. After filtering, groupBy produces one row per lineage with its count. The count column only exists after that aggregation, so ordering by it follows groupBy.',
        documentation: [
            { label: 'between', to: '/docs/reference/functions#between' },
            { label: 'groupBy and orderBy', to: '/docs/reference/query-language#pipeline-operations' },
        ],
        answer: `default
  .filter(date.between('2021-01-01'::date, '2021-06-30'::date))
  .groupBy({count:=count()}, {pangoLineage})
  .orderBy({count.desc()})
  .limit(20)`,
    },
    {
        slug: 'worldwide-spain-lineage-counts',
        title: 'Compare worldwide and Spanish lineage counts',
        question:
            'Return every pango lineage with its worldwide sequence count and its sequence count from Spain. Include lineages that have no sequences from Spain. Sort by the worldwide count, highest first.',
        explanation:
            'Build one aggregation for worldwide counts and another for Spanish counts. Give the lineage column on the Spanish side a distinct name, then use a left join so every worldwide lineage is retained even when Spain has no matching row. Project the requested columns and order by the worldwide count.',
        documentation: [
            { label: 'join', to: '/docs/reference/query-language#join' },
            { label: 'groupBy', to: '/docs/reference/query-language#group-by' },
        ],
        answer: `default
  .groupBy({countWorld:=count()}, {pangoLineage})
  .join(
    default
      .filter(country = 'Spain')
      .groupBy({countSpain:=count()}, {pangoLineage})
      .map({pangoLineage2 := pangoLineage})
      .project({pangoLineage2, countSpain}),
    pangoLineage = pangoLineage2,
    type := left
  )
  .project({pangoLineage, countWorld, countSpain})
  .orderBy({countWorld.desc()})`,
        returnAllRows: true,
    },
    {
        slug: 'submissions-by-iso-week',
        title: 'Submissions by ISO week',
        question:
            'Summarize sequences collected in 2024 by ISO calendar week. Return the week number and sequence count, ordered chronologically.',
        explanation:
            'First restrict the input to dates in 2024. isoWeek returns a week number, and map gives that computed value the column name week. Grouping can then use the new column before orderBy arranges the weekly rows chronologically.',
        documentation: [
            { label: 'isoWeek', to: '/docs/reference/functions#iso-week' },
            { label: 'map and groupBy', to: '/docs/reference/query-language#pipeline-operations' },
        ],
        answer: `default
  .filter(date.between('2024-01-01'::date, '2024-12-31'::date))
  .map({week:=date.isoWeek()})
  .groupBy({count:=count()}, {week})
  .orderBy({week})`,
    },
    {
        slug: 'mutation-details',
        title: 'Sequences with a mutation',
        question:
            'For sequences that carry a mutation at nucleotide position 23403, show the strain, country, date and pangoLineage. Order by strain and return the first 20 rows.',
        explanation:
            'hasMutation tests whether the sample differs from the configured nucleotide reference at one position, without requiring a particular alternative nucleotide. The remaining operations shape, order, and bound the matching records.',
        documentation: [
            {
                label: 'Reference coordinates',
                to: '/docs/explanation/data-model#aligned-sequences-and-reference-positions',
            },
            { label: 'hasMutation', to: '/docs/reference/functions#has-mutation' },
        ],
        answer: `default
  .filter(hasMutation(position:=23403, sequenceName:='main'))
  .project({strain, country, date, pangoLineage})
  .orderBy({strain})
  .limit(20)`,
    },
    {
        slug: 'lineage-mutations',
        title: 'Mutations within a lineage',
        question:
            "List the nucleotide mutations (on the 'main' sequence) that occur in at least 5% of sequences belonging to lineage B.1.1.7 including its sublineages. Return at most 20 rows.",
        explanation:
            'The lineage predicate first selects the population to analyze. mutations then aggregates every qualifying nucleotide change across those input rows. Its threshold concerns prevalence within the filtered population, and sequenceNames restricts the aggregation to main.',
        documentation: [
            { label: 'lineage', to: '/docs/reference/functions#lineage-function' },
            { label: 'mutations aggregation', to: '/docs/reference/query-language#mutations' },
        ],
        answer: `default
  .filter(pangoLineage.lineage('B.1.1.7', includeSublineages:=true))
  .mutations(minProportion:=0.05, sequenceNames:={main})
  .limit(20)`,
    },
    {
        slug: 'complex-filter',
        title: 'Combine multiple conditions',
        question:
            'Count the sequences from Germany that belong to B.1.1.7 (including sublineages) and carry at least 2 of these three nucleotide mutations: T at position 241, T at position 3037, G at position 23403.',
        explanation:
            'Combine the country, lineage, and mutation-profile conditions with &&. nOf counts how many child predicates match each row; with a count of 2 and the default behavior, two or all three nucleotide conditions are accepted. A final ungrouped count reduces the matches to one row.',
        documentation: [
            { label: 'Boolean operators', to: '/docs/reference/query-language#operators' },
            { label: 'nOf', to: '/docs/reference/functions#n-of' },
        ],
        answer: `default
  .filter(
    country = 'Germany'
    && pangoLineage.lineage('B.1.1.7', includeSublineages:=true)
    && nOf(2, {
         nucleotideEquals(position:=241, symbol:='T', sequenceName:='main'),
         nucleotideEquals(position:=3037, symbol:='T', sequenceName:='main'),
         nucleotideEquals(position:=23403, symbol:='G', sequenceName:='main')
       })
  )
  .groupBy({count:=count()})`,
    },
    {
        slug: 'pagination',
        title: 'Paginated results',
        question:
            'Order the sequences by strain, skip the first 50 and return the next 25, showing only the strain, country and date.',
        explanation:
            'Pagination needs a stable order before rows are skipped. offset removes the first 50 ordered rows and limit keeps the next 25. project can be applied afterward because ordering and pagination preserve all input columns.',
        documentation: [
            { label: 'orderBy', to: '/docs/reference/query-language#order-by' },
            { label: 'offset and limit', to: '/docs/reference/query-language#offset' },
        ],
        answer: `default
  .orderBy({strain})
  .offset(50)
  .limit(25)
  .project({strain, country, date})`,
    },
    {
        slug: 'aa-insertions',
        title: 'Amino acid insertions',
        question:
            'List the 20 most common amino acid insertions in the S protein. For each insertion, show its position, inserted symbols and the number of sequences carrying it, with the most common first.',
        explanation:
            'aminoAcidInsertions aggregates all insertions found in the input rows and restricts them to the S protein. It already produces position, insertedSymbols, and count columns. Project the requested fields, order by count descending, and use the remaining fields to make ties deterministic.',
        documentation: [
            {
                label: 'Sequence insertions',
                to: '/docs/explanation/data-model#aligned-sequences-and-reference-positions',
            },
            { label: 'aminoAcidInsertions', to: '/docs/reference/query-language#amino-acid-insertions' },
        ],
        answer: `default
  .aminoAcidInsertions(sequenceNames:={S})
  .project({position, insertedSymbols, count})
  .orderBy({count.desc(), insertedSymbols, position})
  .limit(20)`,
    },
    {
        slug: 'countries-in',
        title: 'Filter with a set of values',
        question: 'Count the sequences from Germany, France and Italy, broken down by country, most frequent first.',
        explanation:
            'in tests each row against a set of accepted country values. groupBy uses country as the grouping column, producing one count per country, and orderBy places the largest group first.',
        documentation: [
            { label: 'in', to: '/docs/reference/functions#in' },
            { label: 'groupBy', to: '/docs/reference/query-language#group-by' },
        ],
        answer: `default
  .filter(country.in({'Germany', 'France', 'Italy'}))
  .groupBy({count:=count()}, {country})
  .orderBy({count.desc()})`,
    },
    {
        slug: 'division-regex',
        title: 'Regex filter and a computed column',
        question:
            "For sequences whose division matches the regular expression 'Basel.*', return the strain together with an added column 'area' set to the constant 'Basel'. Order by strain and return the first 10 rows.",
        explanation:
            'like uses an RE2 regular expression, so Basel.* accepts values beginning with Basel. map adds the constant-valued area column to every matching row. project then narrows the output to strain and the new column.',
        documentation: [
            { label: 'like', to: '/docs/reference/functions#like' },
            { label: 'map', to: '/docs/reference/query-language#map' },
        ],
        answer: `default
  .filter(division.like('Basel.*'))
  .map({area := 'Basel'})
  .project({strain, area})
  .orderBy({strain})
  .limit(10)`,
    },
    {
        slug: 's-mutations-by-target',
        title: 'Amino acid mutations grouped by target',
        question:
            'Among sequences from Switzerland, take the amino acid mutations on the S gene that occur in at least 10% of sequences, then count how many of those mutations lead to each resulting symbol (mutationTo). Most frequent first.',
        explanation:
            'The first filter defines the population. aminoAcidMutations turns its sequence changes into an aggregated table with one row per qualifying mutation, including mutationTo. The following groupBy counts rows in that new table by their resulting symbol; it does not count original sequences.',
        documentation: [
            { label: 'Pipeline schemas', to: '/docs/explanation/data-model#queries-are-pipelines' },
            { label: 'aminoAcidMutations', to: '/docs/reference/query-language#amino-acid-mutations' },
        ],
        answer: `default
  .filter(country = 'Switzerland')
  .aminoAcidMutations(minProportion:=0.1, sequenceNames:={S})
  .groupBy({count:=count()}, {mutationTo})
  .orderBy({count.desc()})`,
    },
    {
        slug: 's-mutation-profile',
        title: 'Mutation profile distance',
        question:
            'Count the sequences whose S gene is within 2 amino acid differences of a profile that has Y at position 501 and R at position 452.',
        explanation:
            'aminoAcidMutationProfile compares each S sequence with the supplied profile. distance allows up to two conservative differences from that profile. The filter keeps matching records, and groupBy with no grouping columns returns their total count.',
        documentation: [
            { label: 'Mutation profiles', to: '/docs/reference/functions#mutation-profile' },
            {
                label: 'Sequence coordinates',
                to: '/docs/explanation/data-model#aligned-sequences-and-reference-positions',
            },
        ],
        answer: `default
  .filter(aminoAcidMutationProfile(distance:=2, sequenceName:='S', mutations:={
    {position:=501, symbol:='Y'},
    {position:=452, symbol:='R'}
  }))
  .groupBy({count:=count()})`,
    },
    {
        slug: 's-position-symbols',
        title: 'Co-occurring S protein changes',
        question: `In the sequences from Switzerland, investigate the co-occurrence patterns at S protein positions 69, 70 and 501. Return one row for each combination together with the count.

The output should have this shape:

~~~
pos_69 | pos_70 | pos_501 | count
------ | ------ | ------- | -----
H      | V      | N       | 1234
-      | -      | Y       | 987
~~~

Order the combinations by count descending so the most common S-position pattern appears first.`,
        explanation:
            'at reads the symbol at each 1-based S position. map names those three values as new columns. Grouping by all three columns creates one row per observed combination, while count records how many Swiss sequences have that pattern.',
        documentation: [
            { label: 'at', to: '/docs/reference/functions#at' },
            { label: 'map and groupBy', to: '/docs/reference/query-language#pipeline-operations' },
        ],
        answer: `default
  .filter(country = 'Switzerland')
  .map({pos_69 := S.at(69), pos_70 := S.at(70), pos_501 := S.at(501)})
  .groupBy({count := count()}, {pos_69, pos_70, pos_501})
  .orderBy({count.desc()})`,
    },
    {
        slug: 'combine-germany-usa',
        title: 'Compare recent German and US submissions',
        question: `Build one harmonized table for recent SARS-CoV-2 submissions from Germany and the USA. Include the strain name, collection date, pango lineage and a place column.

For Germany, place should identify the country (i.e. always just be "Germany"). For the USA, place should identify the division. Use the 100 most recent German rows and the 100 most recent US rows, then sort the combined 200-row table by date descending.

The combined output should look like one table with rows from both sources:

~~~
strain        | date       | pangoLineage | place
------------- | ---------- | ------------ | ----------
sample-DE-001 | 2024-05-10 | JN.1         | Germany
sample-US-001 | 2024-05-09 | JN.1.4       | California
~~~`,
        explanation:
            'Build two pipelines with the same four output columns and compatible types. map gives place a different source in each branch, while project puts both schemas in the same order. unionAll concatenates the bounded branches, after which the combined table can be sorted.',
        documentation: [
            { label: 'Pipeline schemas', to: '/docs/explanation/data-model#queries-are-pipelines' },
            { label: 'unionAll', to: '/docs/reference/query-language#union-all' },
        ],
        answer: `default
  .filter(country = 'Germany')
  .map({place := country})
  .project({strain, date, pangoLineage, place})
  .orderBy({date.desc()})
  .limit(100)
  .unionAll(
    default
      .filter(country = 'USA')
      .map({place := division})
      .project({strain, date, pangoLineage, place})
      .orderBy({date.desc()})
      .limit(100)
  )
  .orderBy({date.desc()})`,
    },
];

export function getExercise(slug: string | undefined) {
    return exercises.find((e) => e.slug === slug);
}
