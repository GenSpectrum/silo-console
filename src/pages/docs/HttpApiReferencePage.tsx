import { CodeBlock, DocumentationPage, Note } from '../../components/Documentation';

export default function HttpApiReferencePage() {
    return (
        <DocumentationPage
            title='HTTP API reference'
            lead='A running SILO instance exposes health and information endpoints and accepts plain-text queries over HTTP.'
        >
            <h2 id='query'>POST /query</h2>
            <p>Send the query as a plain-text request body. NDJSON is the default response format.</p>
            <CodeBlock>{`curl -X POST \
  -H 'Content-Type: text/plain' \
  -H 'Accept: application/x-ndjson' \
  --data "default.groupBy({count := count()})" \
  https://silo.example.org/query`}</CodeBlock>
            <p>Each non-empty response line is an independent JSON object:</p>
            <CodeBlock>{`{"count":9430508}`}</CodeBlock>

            <h2 id='arrow'>Apache Arrow output</h2>
            <p>
                Send <code>Accept: application/vnd.apache.arrow.stream</code> to receive an Apache Arrow IPC stream.
                Arrow preserves the result schema, is efficient for large results, and lets clients detect a truncated
                stream through its end marker.
            </p>
            <CodeBlock>{`curl -X POST \
  -H 'Content-Type: text/plain' \
  -H 'Accept: application/vnd.apache.arrow.stream' \
  --data 'default.limit(100)' \
  https://silo.example.org/query \
  --output result.arrow`}</CodeBlock>

            <h2 id='info'>GET /info</h2>
            <p>
                Return information about the loaded database, including the SILO version and number of sequence records.
            </p>
            <CodeBlock>{`{
  "version": "<git commit>",
  "sequenceCount": 1000000,
  "horizontalBitmapsSize": 60000000,
  "verticalBitmapsSize": 58000000
}`}</CodeBlock>

            <h2 id='health'>GET /health</h2>
            <p>
                Return <code>200</code> with <code>&#123;"status":"UP"&#125;</code> when the server is ready. During
                startup, the endpoint may return <code>503</code> and a <code>Retry-After</code> header.
            </p>

            <h2 id='headers'>Response headers</h2>
            <div className='my-4 overflow-x-auto rounded-box border border-base-300'>
                <table className='table table-sm'>
                    <thead>
                        <tr>
                            <th>Header</th>
                            <th>Meaning</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <code>data-version</code>
                            </td>
                            <td>Unix timestamp identifying the database snapshot used for the query.</td>
                        </tr>
                        <tr>
                            <td>
                                <code>X-Request-Id</code>
                            </td>
                            <td>The supplied request identifier, or a generated identifier for log correlation.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2 id='errors'>Errors</h2>
            <p>Errors are JSON regardless of the requested result format.</p>
            <CodeBlock>{`{
  "error": "Bad request",
  "message": "description of the problem"
}`}</CodeBlock>
            <ul>
                <li>
                    <code>400</code>: malformed or invalid query.
                </li>
                <li>
                    <code>404</code>: unknown endpoint.
                </li>
                <li>
                    <code>405</code>: method not allowed.
                </li>
                <li>
                    <code>500</code>: internal server error.
                </li>
                <li>
                    <code>503</code>: database not ready.
                </li>
            </ul>
            <Note title='Browser access'>
                A static web console sends requests directly from the browser. The SILO instance must be reachable from
                that browser and allow the site's origin through its CORS policy.
            </Note>
        </DocumentationPage>
    );
}
