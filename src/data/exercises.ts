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
};

export const exercises: Exercise[] = [
    {
        slug: 'count-switzerland',
        title: 'Count sequences from Switzerland',
        question: 'Count all sequences from Switzerland.',
        answer: `default
  .filter(country = 'Switzerland')
  .groupBy({count:=count()})`,
    },
    {
        slug: 'retrieve-basel-sequences',
        title: 'Retrieve Basel sequences',
        question:
            'Retrieve the 20 most recent sequences from Basel-Stadt, Switzerland, showing the GenBank accession, date, unaligned nucleotide sequence, aligned nucleotide sequence and S amino acid sequence.',
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
        answer: `default
  .filter(date.between('2021-01-01'::date, '2021-06-30'::date))
  .groupBy({count:=count()}, {pangoLineage})
  .orderBy({count.desc()})
  .limit(20)`,
    },
    {
        slug: 'submissions-by-iso-week',
        title: 'Submissions by ISO week',
        question:
            'Summarize sequences collected in 2024 by ISO calendar week. Return the week number and sequence count, ordered chronologically.',
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
