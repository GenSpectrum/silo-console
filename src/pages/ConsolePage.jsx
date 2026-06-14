import QueryRunner from '../components/QueryRunner.jsx';

export default function ConsolePage() {
    return (
        <div className='page'>
            <h2>Console</h2>
            <p className='hint'>
                Write a SaneQL query and run it against the configured SILO server. A <code>.limit(100)</code> is added
                automatically (unless your query already sets a limit) to keep result sets small.
            </p>
            <QueryRunner />
        </div>
    );
}
