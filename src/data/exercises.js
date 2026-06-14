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
export const exercises = [
    {
        slug: 'count-switzerland',
        title: 'Count sequences from Switzerland',
        question: 'Count all sequences from Switzerland.',
        answer: `default
  .filter(country = 'Switzerland')
  .groupBy({count:=count()})`,
    },
    {
        slug: 'count-by-country',
        title: 'Count by country',
        question:
            'Count the sequences per country and return the 20 countries with the most sequences, most frequent first.',
        answer: `default
  .groupBy({count:=count()}, {country})
  .orderBy({count.desc()})
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
        slug: 'mutation-details',
        title: 'Sequences with a mutation',
        question:
            'For sequences that carry a mutation at nucleotide position 23403, show the strain, country, date and pangoLineage. Order by strain and return the first 20 rows.',
        answer: `default
  .filter(hasMutation(position:=23403))
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
         nucleotideEquals(position:=241, symbol:='T'),
         nucleotideEquals(position:=3037, symbol:='T'),
         nucleotideEquals(position:=23403, symbol:='G')
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
            "Find amino acid insertions in the S sequence after position 214 whose inserted symbols match the regular expression '.*PE'. Order by inserted symbols and position, and return at most 20 rows.",
        answer: `default
  .filter(aminoAcidInsertionContains(position:=214, value:='.*PE', sequenceName:='S'))
  .aminoAcidInsertions()
  .orderBy({insertedSymbols, position})
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
  .orderBy({count.desc()})
  .limit(20)`,
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
];

export function getExercise(slug) {
    return exercises.find((e) => e.slug === slug);
}
