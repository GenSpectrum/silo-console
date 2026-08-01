import { CodeBlock, DocumentationPage, Note } from '../../components/Documentation';

export default function SqlComparisonPage() {
    return (
        <DocumentationPage
            title='RhyDB for SQL users'
            lead='RhyDB uses table pipelines rather than SQL clauses. This page maps common SQL operations to RhyDB.'
        >
            <h2>Correspondence</h2>
            <div className='my-4 overflow-x-auto rounded-box border border-base-300'>
                <table className='table table-sm'>
                    <thead>
                        <tr>
                            <th>SQL concept</th>
                            <th>RhyDB query-language operation</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <code>FROM</code>
                            </td>
                            <td>Start the pipeline with a table name.</td>
                        </tr>
                        <tr>
                            <td>
                                <code>WHERE</code>
                            </td>
                            <td>
                                <code>.filter(predicate)</code>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <code>SELECT</code> columns
                            </td>
                            <td>
                                <code>.project(&#123;fields&#125;)</code>
                            </td>
                        </tr>
                        <tr>
                            <td>computed column</td>
                            <td>
                                <code>.map(&#123;name := expression&#125;)</code>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <code>GROUP BY</code>
                            </td>
                            <td>
                                <code>.groupBy(&#123;aggregates&#125;, &#123;columns&#125;)</code>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <code>ORDER BY</code>
                            </td>
                            <td>
                                <code>.orderBy(&#123;fields&#125;)</code>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <code>LIMIT</code> / <code>OFFSET</code>
                            </td>
                            <td>
                                <code>.limit(n)</code> / <code>.offset(n)</code>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <code>JOIN</code>
                            </td>
                            <td>
                                <code>.join(otherPipeline, leftColumn = rightColumn)</code>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <code>UNION ALL</code>
                            </td>
                            <td>
                                <code>.unionAll(otherPipeline)</code>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>The same summary in both styles</h2>
            <CodeBlock>{`-- SQL
SELECT country, COUNT(*) AS count
FROM default
WHERE date >= DATE '2024-01-01'
GROUP BY country
ORDER BY count DESC
LIMIT 10;`}</CodeBlock>
            <CodeBlock>{`-- RhyDB query language
default
  .filter(date >= '2024-01-01'::date)
  .groupBy({count := count()}, {country})
  .orderBy({count.desc()})
  .limit(10)`}</CodeBlock>

            <h2>Differences</h2>
            <ul>
                <li>Order matters: each method receives the result produced immediately before it.</li>
                <li>
                    Records and sets use braces, and <code>:=</code> assigns a name inside a record.
                </li>
                <li>The available tables and columns are configured per RhyDB instance.</li>
                <li>
                    Sequence predicates and aggregations understand reference coordinates, mutations, and ambiguity.
                </li>
                <li>
                    RhyDB currently provides <code>count()</code> as its aggregate function; it is not a general SQL
                    engine.
                </li>
            </ul>
            <Note title='Reading a query'>
                Read a RhyDB query from top to bottom as a series of intermediate tables. Operations such as{' '}
                <code>map</code>, <code>project</code>, and <code>groupBy</code> change the schema.
            </Note>
        </DocumentationPage>
    );
}
