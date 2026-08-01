import { Link } from 'react-router-dom';
import { DocumentationPage, Note } from '../../components/Documentation';

export default function WhatIsRhyDBPage() {
    return (
        <DocumentationPage
            title='What is RhyDB?'
            lead='RhyDB is a high-performance analytical database for sequence alignment data.'
        >
            <h2>What RhyDB does</h2>
            <p>
                A RhyDB database stores metadata and nucleotide or amino-acid sequences. Applications can filter,
                aggregate, and retrieve this data through the query API.
            </p>
            <p>Sequence operations include:</p>
            <ul>
                <li>filtering by nucleotides or amino acids at reference positions;</li>
                <li>finding substitutions, deletions, insertions, and mutation profiles;</li>
                <li>aggregating mutation and insertion frequencies;</li>
                <li>searching lineage hierarchies and configured phylogenetic trees.</li>
            </ul>

            <h2>Where it fits</h2>
            <p>
                RhyDB is a query engine, not a sequence aligner or a data-submission system. Sequence alignment and
                annotation normally happen before data is loaded. A client sends a query to RhyDB and receives a stream
                of result rows.
            </p>
            <Note title='RhyDB and LAPIS'>
                RhyDB can be queried directly. LAPIS is a separate service that can run in front of RhyDB and provides
                REST endpoints and additional response formats.
            </Note>

            <h2>Use in other projects</h2>
            <p>
                GenSpectrum uses RhyDB for genomic data queries. Loculus uses RhyDB as its query engine, and Pathoplexus
                is built with Loculus.
            </p>

            <h2>Where to go next</h2>
            <ul>
                <li>
                    Read <Link to='/docs/explanation/data-model'>Data model and queries</Link> to understand query
                    pipelines and aligned sequences.
                </li>
                <li>
                    Work through the <Link to='/exercises'>exercises</Link> to learn by writing queries.
                </li>
                <li>
                    Use the <Link to='/docs/reference/query-language'>query-language reference</Link> for exact syntax.
                </li>
            </ul>
        </DocumentationPage>
    );
}
