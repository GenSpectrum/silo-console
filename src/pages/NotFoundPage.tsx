import { Link } from 'react-router-dom';
import { usePageMeta } from '../lib/pageMeta';

export default function NotFoundPage() {
    usePageMeta('Page not found');

    return (
        <div className='mx-auto w-full max-w-3xl px-4 py-20 text-center lg:px-6'>
            <p className='text-sm font-semibold text-primary'>404</p>
            <h1 className='mt-2 text-3xl font-bold tracking-tight'>Page not found</h1>
            <p className='mt-3 text-base-content/65'>The requested page does not exist.</p>
            <Link className='btn mt-6 btn-primary' to='/'>
                Go to the homepage
            </Link>
        </div>
    );
}
