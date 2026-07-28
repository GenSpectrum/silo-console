// Concise reference distilled from documentation/query_documentation.md.
import type { ReactNode } from 'react';

function Code({ children }: { children: ReactNode }) {
    return (
        <pre className='my-3 overflow-x-auto rounded-box border border-base-300 bg-base-200 p-3 font-mono text-xs'>
            <code>{children}</code>
        </pre>
    );
}

export default function LanguageReferencePage() {
    return (
        <div className='w-full max-w-5xl text-sm leading-relaxed [&_a]:link [&_a]:link-primary'>
            <h1 className='text-2xl font-semibold tracking-tight'>Language Reference</h1>
            <p className='mt-2'>
                Queries are sent to the <code>/query</code> endpoint as a plain-text{' '}
                <a href='https://www.cidrdb.org/cidr2024/papers/p48-neumann.pdf' target='_blank' rel='noreferrer'>
                    SaneQL
                </a>{' '}
                expression. The response is NDJSON by default (one JSON object per row), or Apache Arrow IPC if the
                client sends <code>Accept: application/vnd.apache.arrow.stream</code>.
            </p>

            <h2 className='mt-8 mb-3 text-xl font-semibold'>Query structure</h2>
            <p>
                A query is a <strong>pipeline</strong> of operators chained with <code>.method()</code> syntax, starting
                from a table name (currently always <code>default</code>). Every operator takes a table and produces a
                table; the response schema is the output of the <strong>last</strong> operator.
            </p>
            <Code>{`default
  .filter(country = 'Switzerland')
  .groupBy({count:=count()})`}</Code>
            <ul className='list-disc space-y-1 pl-5'>
                <li>
                    <strong>Schema-preserving</strong> operators (<code>filter</code>, <code>orderBy</code>,{' '}
                    <code>limit</code>, <code>offset</code>, <code>randomize</code>) pass all columns through unchanged.
                </li>
                <li>
                    <strong>Schema-defining</strong> operators (<code>groupBy</code>, <code>project</code>,{' '}
                    <code>map</code>, <code>unionAll</code>, <code>schema</code>, <code>mutations</code>, …) produce a
                    changed output schema.
                </li>
            </ul>

            <h2 className='mt-8 mb-3 text-xl font-semibold'>Literals</h2>
            <div className='w-fit max-w-full overflow-x-auto rounded-box border border-base-300'>
                <table className='table w-auto table-xs'>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Syntax</th>
                            <th>Example</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>String</td>
                            <td>single-quoted</td>
                            <td>
                                <code>'Switzerland'</code>
                            </td>
                        </tr>
                        <tr>
                            <td>Integer</td>
                            <td>bare number</td>
                            <td>
                                <code>42</code>
                            </td>
                        </tr>
                        <tr>
                            <td>Float</td>
                            <td>decimal</td>
                            <td>
                                <code>3.14</code>
                            </td>
                        </tr>
                        <tr>
                            <td>Boolean</td>
                            <td>
                                <code>true</code> / <code>false</code>
                            </td>
                            <td>
                                <code>true</code>
                            </td>
                        </tr>
                        <tr>
                            <td>Null</td>
                            <td>
                                <code>null</code>
                            </td>
                            <td>
                                <code>null</code>
                            </td>
                        </tr>
                        <tr>
                            <td>Date</td>
                            <td>
                                <code>'YYYY-MM-DD'::date</code>
                            </td>
                            <td>
                                <code>'2021-03-15'::date</code>
                            </td>
                        </tr>
                        <tr>
                            <td>Set</td>
                            <td>
                                <code>{`{elem1, elem2, ...}`}</code>
                            </td>
                            <td>
                                <code>{`{'A', 'B', 'C'}`}</code>
                            </td>
                        </tr>
                        <tr>
                            <td>Record</td>
                            <td>
                                <code>{`{field := value, ...}`}</code>
                            </td>
                            <td>
                                <code>{`{x := 'A', y := 3}`}</code>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2 className='mt-8 mb-3 text-xl font-semibold'>Operators &amp; method calls</h2>
            <p>
                Any function <code>f(table, arg)</code> can be written as <code>table.f(arg)</code>. Named arguments use{' '}
                <code>:=</code>; once a named argument is given, no positional arguments follow.
            </p>
            <Code>{`pango_lineage.lineage('B.1.1.7', includeSublineages:=true)`}</Code>
            <p>
                <strong>Boolean:</strong> <code>&amp;&amp;</code> (and), <code>||</code> (or), <code>!expr</code> (not),{' '}
                <code>(expr)</code> (grouping). <strong>Comparison:</strong> <code>=</code>, <code>&lt;&gt;</code>,{' '}
                <code>&lt;</code>, <code>&lt;=</code>, <code>&gt;</code>, <code>&gt;=</code> — the left-hand side must
                be a column identifier.
            </p>
            <Code>{`country = 'Germany'
age > 30
date <= '2021-12-31'::date`}</Code>

            <h2 className='mt-8 mb-3 text-xl font-semibold'>Pipeline operations</h2>
            <Ref name='filter(predicate)' desc='Keep rows where the boolean predicate is true.'>
                {`default.filter(country = 'USA' && age > 30)`}
            </Ref>
            <Ref
                name='groupBy(aggregates [, columns])'
                desc='Aggregate rows. aggregates is a record (currently only count() is supported); columns is an optional set of grouping columns.'
            >
                {`default.groupBy({count:=count()}, {country, pango_lineage})`}
            </Ref>
            <Ref name='project(fields)' desc='Return only the specified columns.'>
                {`default.project({primary_key, country, date, pango_lineage})`}
            </Ref>
            <Ref
                name='map(expressions)'
                desc='Add columns from name := value assignments (field references, literals, and non-boolean scalar functions such as at and isoWeek). Existing names are replaced.'
            >
                {`default.map({x := 3, label := 'cohort A', copy := country})
default.map({pos_501 := S.at(501)})`}
            </Ref>
            <Ref
                name='orderBy(fields)'
                desc='Sort. Each field is a bare name (ascending) or asc(name) / desc(name) / name.desc().'
            >
                {`default.orderBy({count.desc(), pango_lineage})`}
            </Ref>
            <Ref name='limit(count)' desc='Return at most count rows.'>
                {`default.limit(100)`}
            </Ref>
            <Ref name='offset(count)' desc='Skip the first count rows.'>
                {`default.orderBy({primary_key}).offset(10).limit(10)`}
            </Ref>
            <Ref name='randomize([seed:=n])' desc='Return rows in random order; optional seed for reproducibility.'>
                {`default.randomize(seed:=42)`}
            </Ref>
            <Ref
                name='unionAll(left, right)'
                desc='Concatenate two pipeline results. Both inputs must have the same column names, types, and order; duplicate rows are preserved. The result can be piped into downstream operators.'
            >
                {`default.filter(division = 'Aargau').project({division})
  .unionAll(default.filter(division = 'Bern').project({division}))
  .groupBy({count := count()}, {division})`}
            </Ref>
            <Ref
                name='schema()'
                desc='Describe the input pipeline without reading its data. Output: one row per field with fieldName and type. The result can be projected, mapped, ordered and limited; sequence columns are reported as STRING.'
            >
                {`default.schema()
default.groupBy({count:=count()}, {country}).schema()`}
            </Ref>
            <Ref
                name='mutations(minProportion:=p [, sequenceNames:={...}] [, fields:={...}])'
                desc='Nucleotide mutation statistics above a frequency threshold. Output: mutation, mutationFrom, mutationTo, position, sequenceName, proportion, coverage, count. Only valid on a table or a direct filter of a table.'
            >
                {`default.filter(pango_lineage = 'B.1.1.7').mutations(minProportion:=0.05)`}
            </Ref>
            <Ref
                name='aminoAcidMutations(minProportion:=p [, ...])'
                desc='Same as mutations but for amino acid sequences.'
            >
                {`default.aminoAcidMutations(minProportion:=0.3, sequenceNames:={S})`}
            </Ref>
            <Ref
                name='insertions([sequenceNames:={...}])'
                desc='Aggregate every nucleotide insertion in the input rows by sequence name, position and inserted symbols. Output: insertion (formatted as ins_<sequenceName>:<position>:<symbols>), insertedSymbols, position, sequenceName, count. A preceding filter determines the input rows; all insertions in those rows are aggregated.'
            >
                {`default.insertions(sequenceNames:={main})`}
            </Ref>
            <Ref
                name='aminoAcidInsertions([sequenceNames:={...}])'
                desc='Same as insertions but for amino acid sequences.'
            >
                {`default.aminoAcidInsertions(sequenceNames:={S})`}
            </Ref>
            <Ref
                name='mostRecentCommonAncestor(column [, printNodesNotInTree:=bool])'
                desc='Most recent common ancestor in a phylogenetic tree column. Output: mrcaNode, mrcaParent, mrcaDepth, missingNodeCount.'
            >
                {`default.filter(country = 'Germany').mostRecentCommonAncestor('usherTree')`}
            </Ref>
            <Ref
                name='phyloSubtree(column [, printNodesNotInTree:=bool] [, contractUnaryNodes:=bool])'
                desc='Newick subtree spanning the filtered sequences. Output: subtreeNewick, missingNodeCount.'
            >
                {`default.filter(pango_lineage = 'B.1.1.7').phyloSubtree('usherTree')`}
            </Ref>

            <h2 className='mt-8 mb-3 text-xl font-semibold'>Scalar functions</h2>
            <p>
                Most scalar functions are boolean predicates for <code>filter</code>. Non-boolean scalar functions such
                as <code>at</code> and <code>isoWeek</code> return values for <code>map</code> assignments.
            </p>
            <Ref
                name='at(column, position)'
                desc='Extract the single character at the 1-based position from a string or sequence column. Positions past the end return an empty string; null values stay null.'
            >
                {`default.map({pos_501 := S.at(501)})`}
            </Ref>
            <Ref name='isoWeek(column)' desc='Extract the ISO 8601 week number (1–53) from a date column.'>
                {`default.map({week := date.isoWeek()})`}
            </Ref>
            <Ref
                name='between(column, from, to)'
                desc='Inclusive range; use null for an open bound. Works for dates, integers, floats.'
            >
                {`date.between('2021-01-01'::date, '2021-12-31'::date)
age.between(18, 65)`}
            </Ref>
            <Ref name='in(column, {values})' desc='True if the column value is one of the given strings.'>
                {`country.in({'Germany', 'France', 'Italy'})`}
            </Ref>
            <Ref name='isNull(column) / isNotNull(column)' desc='Test for NULL / non-NULL values.'>
                {`isNull(date)
isNotNull(pango_lineage)`}
            </Ref>
            <Ref name='like(column, pattern)' desc='Regular-expression match (RE2 syntax).'>
                {`division.like('Basel.*')`}
            </Ref>
            <Ref
                name='lineage(column, value [, includeSublineages:=bool] [, recombinantFollowingMode:=string])'
                desc='Match a lineage column (requires generateLineageIndex). includeSublineages also matches sublineages.'
            >
                {`pango_lineage.lineage('B.1.1.7', includeSublineages:=true)`}
            </Ref>
            <Ref name='phyloDescendantOf(column, node)' desc='True if the tree column value descends from node.'>
                {`usherTree.phyloDescendantOf('NODE_0000072')`}
            </Ref>
            <p className='text-xs text-base-content/60'>
                Every nucleotide and amino acid filter or mutation profile requires an explicit sequenceName.
            </p>
            <Ref
                name='nucleotideEquals(position:=n, symbol:=s, sequenceName:=name)'
                desc="True if the nucleotide at 1-based position n is s. Use '.' to match the reference."
            >
                {`nucleotideEquals(position:=100, symbol:='A', sequenceName:='main')`}
            </Ref>
            <Ref
                name='aminoAcidEquals(position:=n, symbol:=s, sequenceName:=name)'
                desc='Same as nucleotideEquals for amino acids.'
            >
                {`aminoAcidEquals(position:=501, symbol:='Y', sequenceName:='S')`}
            </Ref>
            <Ref
                name='hasMutation(position:=n, sequenceName:=name) / hasAAMutation(...)'
                desc='True if the symbol at position n differs from the reference and is not N (nucleotide / amino acid).'
            >
                {`hasMutation(position:=23403, sequenceName:='main')`}
            </Ref>
            <Ref
                name='insertionContains(position:=n, value:=regex, sequenceName:=name)'
                desc="True if there is an insertion after position n matching regex (nucleotide). aminoAcidInsertionContains is the AA variant (escape '*' as \\\\*)."
            >
                {`insertionContains(position:=22204, value:='A.*G', sequenceName:='main')`}
            </Ref>
            <Ref
                name='maybe(child) / exact(child)'
                desc='Relax (allow ambiguous symbols) or tighten (require exact match) a child expression.'
            >
                {`maybe(nucleotideEquals(position:=122, symbol:='A', sequenceName:='main'))`}
            </Ref>
            <Ref
                name='nOf(count, {children} [, matchExactly:=bool])'
                desc='True if at least count (or exactly count) child expressions are true.'
            >
                {`nOf(2, {
  nucleotideEquals(position:=241, symbol:='T', sequenceName:='main'),
  nucleotideEquals(position:=3037, symbol:='T', sequenceName:='main'),
  nucleotideEquals(position:=23403, symbol:='G', sequenceName:='main')
})`}
            </Ref>
            <Ref
                name='nucleotideMutationProfile(distance:=n, ..., sequenceName:=name) / aminoAcidMutationProfile(...)'
                desc='True if a sequence is within distance conservative differences from a profile, defined by exactly one of querySequence, sequenceId, or mutations:={...}.'
            >
                {`nucleotideMutationProfile(distance:=3, sequenceName:='main', mutations:={
  {position:=241, symbol:='T'},
  {position:=23403, symbol:='G'}
})`}
            </Ref>

            <p className='mt-6 text-xs text-base-content/60'>
                This is a condensed reference. See{' '}
                <a
                    href='https://github.com/GenSpectrum/LAPIS-SILO/blob/main/documentation/query_documentation.md'
                    target='_blank'
                    rel='noreferrer'
                >
                    SILO's query documentation
                </a>{' '}
                for the full details.
            </p>
        </div>
    );
}

function Ref({ name, desc, children }: { name: string; desc: string; children: ReactNode }) {
    return (
        <div className='mb-4'>
            <h3 className='mb-1 text-sm font-semibold'>
                <code>{name}</code>
            </h3>
            <div className='mb-1.5 text-xs text-base-content/60'>{desc}</div>
            <pre className='overflow-x-auto rounded-box border border-base-300 bg-base-200 p-3 font-mono text-xs'>
                <code>{children}</code>
            </pre>
        </div>
    );
}
