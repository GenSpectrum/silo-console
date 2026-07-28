import { DocumentationPage, Note, ReferenceItem } from '../../components/Documentation';

export default function FunctionReferencePage() {
    return (
        <DocumentationPage
            title='Function reference'
            lead='Functions produce scalar values or predicates. Boolean functions are used in filter expressions; value-producing functions can be assigned in map operations.'
        >
            <h2 id='general'>General functions</h2>
            <ReferenceItem
                id='at'
                name='at(column, position)'
                description='Return the character at a 1-based position. A position beyond the value returns an empty string; null remains null.'
            >
                {`default.map({symbol := S.at(501)})`}
            </ReferenceItem>
            <ReferenceItem
                id='iso-week'
                name='isoWeek(column)'
                description='Return the ISO 8601 week number, from 1 through 53, for a date.'
            >
                {`default.map({week := date.isoWeek()})`}
            </ReferenceItem>
            <ReferenceItem
                id='between'
                name='between(column, from, to)'
                description='Test an inclusive date or numeric range. Use null for an open bound.'
            >
                {`date.between('2024-01-01'::date, '2024-12-31'::date)
age.between(18, null)`}
            </ReferenceItem>
            <ReferenceItem
                id='in'
                name='in(column, {values})'
                description='Test whether a string column equals one of the values in a set.'
            >
                {`country.in({'Germany', 'France', 'Italy'})`}
            </ReferenceItem>
            <ReferenceItem
                id='null'
                name='isNull(column) / isNotNull(column)'
                description='Test whether a column value is null or non-null.'
            >
                {`isNotNull(date)`}
            </ReferenceItem>
            <ReferenceItem
                id='like'
                name='like(column, pattern)'
                description='Match a string with an RE2 regular expression.'
            >
                {`division.like('Basel.*')`}
            </ReferenceItem>

            <h2 id='lineage'>Lineage and phylogenetic functions</h2>
            <ReferenceItem
                id='lineage-function'
                name='lineage(column, value [, includeSublineages := bool] [, recombinantFollowingMode := string])'
                description='Match a value in a configured lineage index. Optionally include its descendants.'
            >
                {`pangoLineage.lineage('B.1.1.7', includeSublineages := true)`}
            </ReferenceItem>
            <ReferenceItem
                id='phylo-descendant'
                name='phyloDescendantOf(column, node)'
                description='Test whether a value descends from a node in a configured phylogenetic tree.'
            >
                {`usherTree.phyloDescendantOf('NODE_0000072')`}
            </ReferenceItem>

            <h2 id='sequence'>Sequence functions</h2>
            <Note>
                Every sequence predicate requires a sequence name. Positions are 1-based. Nucleotide and amino-acid
                functions have parallel forms where shown.
            </Note>
            <ReferenceItem
                id='equals'
                name='nucleotideEquals(position := n, symbol := s, sequenceName := name)'
                description={
                    <>
                        Test the symbol at a nucleotide reference position. Use <code>.</code> to represent the
                        reference symbol. <code>aminoAcidEquals</code> is the amino-acid form.
                    </>
                }
            >
                {`nucleotideEquals(position := 23403, symbol := 'G', sequenceName := 'main')
aminoAcidEquals(position := 501, symbol := 'Y', sequenceName := 'S')`}
            </ReferenceItem>
            <ReferenceItem
                id='has-mutation'
                name='hasMutation(position := n, sequenceName := name) / hasAAMutation(...)'
                description='Test whether a position differs from the reference and is not an unknown symbol.'
            >
                {`hasMutation(position := 23403, sequenceName := 'main')`}
            </ReferenceItem>
            <ReferenceItem
                id='insertion-contains'
                name='insertionContains(position := n, value := regex, sequenceName := name)'
                description='Test whether an insertion after a reference position matches an RE2 expression. aminoAcidInsertionContains is the amino-acid form.'
            >
                {`insertionContains(position := 22204, value := 'A.*G', sequenceName := 'main')`}
            </ReferenceItem>
            <ReferenceItem
                id='maybe-exact'
                name='maybe(child) / exact(child)'
                description='Relax a child sequence expression to admit ambiguity, or require an exact match.'
            >
                {`maybe(nucleotideEquals(position := 122, symbol := 'A', sequenceName := 'main'))`}
            </ReferenceItem>
            <ReferenceItem
                id='n-of'
                name='nOf(count, {children} [, matchExactly := bool])'
                description='Test whether at least count child predicates match, or exactly count when matchExactly is true.'
            >
                {`nOf(2, {
  nucleotideEquals(position := 241, symbol := 'T', sequenceName := 'main'),
  nucleotideEquals(position := 3037, symbol := 'T', sequenceName := 'main'),
  nucleotideEquals(position := 23403, symbol := 'G', sequenceName := 'main')
})`}
            </ReferenceItem>
            <ReferenceItem
                id='mutation-profile'
                name='nucleotideMutationProfile(distance := n, ..., sequenceName := name)'
                description='Test whether a sequence is within a conservative-difference distance of a profile. Define the profile with exactly one of querySequence, sequenceId, or mutations. aminoAcidMutationProfile is the amino-acid form.'
            >
                {`nucleotideMutationProfile(
  distance := 3,
  sequenceName := 'main',
  mutations := {
    {position := 241, symbol := 'T'},
    {position := 23403, symbol := 'G'}
  }
)`}
            </ReferenceItem>
        </DocumentationPage>
    );
}
