import { CodeBlock, DocumentationPage, Note, ReferenceItem } from '../../components/Documentation';

export default function LanguageReferencePage() {
    return (
        <DocumentationPage
            title='Query-language reference'
            lead='A SILO query is a pipeline of operations that starts from a table name and produces a table of result rows.'
        >
            <h2 id='structure'>Query structure</h2>
            <CodeBlock>{`default
  .filter(country = 'Switzerland')
  .groupBy({count := count()}, {pangoLineage})`}</CodeBlock>
            <p>
                Method syntax is equivalent to passing the value on the left as the first function argument. Named
                arguments use <code>:=</code>. After a named argument, all remaining arguments must also be named.
            </p>

            <h2 id='literals'>Literals</h2>
            <div className='my-4 overflow-x-auto rounded-box border border-base-300'>
                <table className='table table-sm'>
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
                                <code>true</code> or <code>false</code>
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
                                <code>'2024-05-15'::date</code>
                            </td>
                        </tr>
                        <tr>
                            <td>Set</td>
                            <td>
                                <code>&#123;value, ...&#125;</code>
                            </td>
                            <td>
                                <code>&#123;'A', 'B'&#125;</code>
                            </td>
                        </tr>
                        <tr>
                            <td>Record</td>
                            <td>
                                <code>&#123;name := value, ...&#125;</code>
                            </td>
                            <td>
                                <code>&#123;label := 'A', n := 3&#125;</code>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2 id='operators'>Operators</h2>
            <p>
                Boolean expressions use <code>&amp;&amp;</code> (and), <code>||</code> (or), and <code>!</code> (not).
                Parentheses control grouping. Comparisons use <code>=</code>, <code>&lt;&gt;</code>, <code>&lt;</code>,
                <code>&lt;=</code>, <code>&gt;</code>, and <code>&gt;=</code>; their left-hand side must be a column.
            </p>
            <CodeBlock>{`country = 'Germany' && age >= 18
!(date < '2024-01-01'::date)`}</CodeBlock>

            <h2 id='pipeline-operations'>Pipeline operations</h2>
            <ReferenceItem
                id='filter'
                name='filter(predicate)'
                description='Keep rows for which the predicate is true.'
            >
                {`default.filter(country = 'USA' && age >= 18)`}
            </ReferenceItem>
            <ReferenceItem
                id='group-by'
                name='groupBy(aggregates [, columns])'
                description={
                    <>
                        Aggregate rows. The first argument is a record of aggregates; the optional second argument is a
                        set of grouping columns. Currently, <code>count()</code> is the supported aggregate.
                    </>
                }
            >
                {`default.groupBy({count := count()}, {country, pangoLineage})`}
            </ReferenceItem>
            <ReferenceItem id='project' name='project(fields)' description='Return only the columns in the given set.'>
                {`default.project({primaryKey, country, date})`}
            </ReferenceItem>
            <ReferenceItem
                id='map'
                name='map(expressions)'
                description='Add or replace columns using name-and-value assignments. Values may be literals, columns, or non-boolean scalar functions.'
            >
                {`default.map({cohort := 'A', copiedCountry := country, week := date.isoWeek()})`}
            </ReferenceItem>
            <ReferenceItem
                id='order-by'
                name='orderBy(fields)'
                description='Sort by bare ascending fields or asc/desc expressions.'
            >
                {`default.orderBy({date.desc(), primaryKey})`}
            </ReferenceItem>
            <ReferenceItem id='limit' name='limit(count)' description='Return at most count rows.'>
                {`default.limit(100)`}
            </ReferenceItem>
            <ReferenceItem
                id='offset'
                name='offset(count)'
                description='Skip count rows. Use a deterministic order when paginating.'
            >
                {`default.orderBy({primaryKey}).offset(100).limit(100)`}
            </ReferenceItem>
            <ReferenceItem
                id='randomize'
                name='randomize([seed := n])'
                description='Return rows in random order. A seed makes the order reproducible.'
            >
                {`default.randomize(seed := 42).limit(10)`}
            </ReferenceItem>
            <ReferenceItem
                id='join'
                name='join(left, right, on [, type := kind])'
                description={
                    <>
                        Combine two pipelines by equality between columns. Multiple equalities may be joined with{' '}
                        <code>&amp;&amp;</code>. The default type is <code>inner</code>; supported types are{' '}
                        <code>inner</code>, <code>left</code>, <code>right</code>, <code>full</code>,{' '}
                        <code>leftSemi</code>, <code>rightSemi</code>, <code>leftAnti</code>, and <code>rightAnti</code>
                        {
                            '. The two inputs must use disjoint column names. Apply filters to an input pipeline because a '
                        }
                        <code>join</code> result cannot be filtered.
                    </>
                }
            >
                {`default.groupBy({countWorld := count()}, {pangoLineage})
  .join(
    default
      .filter(country = 'Spain')
      .groupBy({countSpain := count()}, {pangoLineage})
      .map({pangoLineage2 := pangoLineage})
      .project({pangoLineage2, countSpain}),
    pangoLineage = pangoLineage2,
    type := left
  )`}
            </ReferenceItem>
            <ReferenceItem
                id='union-all'
                name='unionAll(left, right)'
                description='Concatenate two results with identical column names, types, and order. Duplicate rows are retained.'
            >
                {`default.filter(country = 'Germany').project({country})
  .unionAll(default.filter(country = 'France').project({country}))`}
            </ReferenceItem>
            <ReferenceItem
                id='schema'
                name='schema()'
                description='Describe the input schema without reading its rows. Returns fieldName and type.'
            >
                {`default.schema()`}
            </ReferenceItem>

            <h2 id='sequence-aggregations'>Sequence aggregations</h2>
            <Note>
                These operations aggregate changes across the input rows. A preceding <code>filter</code> chooses the
                records to analyze; it does not restrict which changes the aggregation returns.
            </Note>
            <ReferenceItem
                id='mutations'
                name='mutations(minProportion := p [, sequenceNames := {...}] [, fields := {...}])'
                description='Aggregate nucleotide substitutions and deletions above a frequency threshold. Returns source and observed symbols, position, sequence name, proportion, coverage, and count.'
            >
                {`default.filter(country = 'Switzerland')
  .mutations(minProportion := 0.05, sequenceNames := {main})`}
            </ReferenceItem>
            <ReferenceItem
                id='amino-acid-mutations'
                name='aminoAcidMutations(minProportion := p [, ...])'
                description='Aggregate amino-acid substitutions and deletions above a frequency threshold.'
            >
                {`default.aminoAcidMutations(minProportion := 0.1, sequenceNames := {S})`}
            </ReferenceItem>
            <ReferenceItem
                id='insertions'
                name='insertions([sequenceNames := {...}])'
                description='Aggregate every nucleotide insertion in the input rows by sequence, position, and inserted symbols.'
            >
                {`default.insertions(sequenceNames := {main})`}
            </ReferenceItem>
            <ReferenceItem
                id='amino-acid-insertions'
                name='aminoAcidInsertions([sequenceNames := {...}])'
                description='Aggregate every amino-acid insertion in the input rows by sequence, position, and inserted symbols.'
            >
                {`default.aminoAcidInsertions(sequenceNames := {S})`}
            </ReferenceItem>

            <h2 id='phylogenetic-operations'>Phylogenetic operations</h2>
            <ReferenceItem
                id='mrca'
                name='mostRecentCommonAncestor(column [, printNodesNotInTree := bool])'
                description='Find the most recent common ancestor of the filtered records in a configured phylogenetic-tree column.'
            >
                {`default.filter(country = 'Germany').mostRecentCommonAncestor('usherTree')`}
            </ReferenceItem>
            <ReferenceItem
                id='phylo-subtree'
                name='phyloSubtree(column [, printNodesNotInTree := bool] [, contractUnaryNodes := bool])'
                description='Return a Newick subtree spanning the filtered records.'
            >
                {`default.filter(country = 'Germany').phyloSubtree('usherTree')`}
            </ReferenceItem>
        </DocumentationPage>
    );
}
