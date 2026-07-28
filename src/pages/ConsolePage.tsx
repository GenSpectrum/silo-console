import QueryRunner from '../components/QueryRunner';

export default function ConsolePage() {
    return (
        <div className='w-full'>
            <h1 className='text-2xl font-semibold tracking-tight'>Console</h1>
            <p className='mt-1 mb-4 text-sm text-base-content/60'>
                Write a SaneQL query and run it against the configured SILO server. A <code>.limit(100)</code> is added
                automatically (unless your query already sets a limit) to keep result sets small.
            </p>
            <QueryRunner />
        </div>
    );
}
