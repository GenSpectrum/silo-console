import { Link } from 'react-router-dom';
import { CodeBlock, DocumentationPage, Note } from '../../components/Documentation';

export default function DataModelPage() {
    return (
        <DocumentationPage
            title='Data model and queries'
            lead='RhyDB queries transform tables through a pipeline. Sequence operations use reference coordinates.'
        >
            <h2>Tables, rows, and columns</h2>
            <p>
                A RhyDB table contains rows with the same schema. A row usually represents one sample or sequence
                record. Columns contain metadata or sequences and have types such as string, integer, date, boolean,
                nucleotide sequence, or amino-acid sequence.
            </p>
            <p>
                Table and column names are configured by each RhyDB instance. Examples in this documentation use the
                table
                <code>default</code> and columns such as <code>country</code>, <code>date</code>, <code>main</code>, and
                <code>S</code>; another instance can expose a different schema.
            </p>

            <h2 id='queries-are-pipelines'>Queries are pipelines</h2>
            <p>
                A query starts with a table and chains operations from left to right. Each operation consumes a table
                and produces another table, so the output of one operation becomes the input of the next.
            </p>
            <CodeBlock>{`default
  .filter(country = 'Switzerland')
  .groupBy({count := count()}, {pangoLineage})
  .orderBy({count.desc()})`}</CodeBlock>
            <p>
                This query starts with every row, keeps rows from Switzerland, counts them by lineage, and orders the
                resulting groups. The last operation determines the final rows and their order.
            </p>
            <p>
                Operations such as <code>filter</code>, <code>orderBy</code>, and <code>limit</code> preserve the input
                columns. Operations such as <code>project</code>, <code>map</code>, <code>groupBy</code>, and mutation
                aggregations define a new output schema.
            </p>

            <h2 id='aligned-sequences-and-reference-positions'>Aligned sequences and reference positions</h2>
            <p>
                An aligned sequence has positions corresponding to a configured reference sequence. Queries can test
                whether a sample differs from the reference at a position or carries a particular symbol there.
            </p>
            <ul>
                <li>A substitution has a different symbol at a reference position.</li>
                <li>A deletion is represented by a gap at a reference position.</li>
                <li>
                    An insertion contains symbols between reference positions and is stored separately from the
                    alignment.
                </li>
                <li>Ambiguous symbols express incomplete information and affect exact and relaxed matching.</li>
            </ul>
            <Note>
                Positions in RhyDB's sequence functions are 1-based. A sequence name is always explicit because an
                instance may contain several genome segments or translated genes.
            </Note>

            <h2>Inspecting an instance</h2>
            <p>
                The query <code>default.schema()</code> returns the field names and types available in the table. The
                <Link to='/console'> Console</Link> exposes the same schema view after connecting to an instance.
            </p>
            <CodeBlock>{`default.schema()`}</CodeBlock>
        </DocumentationPage>
    );
}
