import { Link } from 'react-router-dom';
import { documentationSections } from '../../data/docs';
import { usePageMeta } from '../../lib/pageMeta';

export default function DocsOverviewPage() {
    usePageMeta('Documentation');

    return (
        <div className='w-full max-w-5xl'>
            <h1 className='text-3xl font-bold tracking-tight'>Documentation</h1>
            <p className='mt-3 max-w-3xl text-lg leading-relaxed text-base-content/65'>
                Explanations describe SILO's data and query model. Reference pages list query-language and HTTP API
                behavior. The exercises provide practice.
            </p>
            <div className='mt-8 grid gap-5 md:grid-cols-2'>
                {documentationSections.map((section) => (
                    <section className='card border border-base-300 bg-base-100' key={section.title}>
                        <div className='card-body'>
                            <h2 className='card-title'>{section.title}</h2>
                            <p className='text-sm text-base-content/65'>{section.description}</p>
                            <ul className='mt-3 space-y-3'>
                                {section.pages.map((page) => (
                                    <li key={page.path}>
                                        <Link className='font-medium link-primary' to={page.path}>
                                            {page.title}
                                        </Link>
                                        <p className='mt-0.5 text-sm text-base-content/60'>{page.summary}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                ))}
            </div>
            <div className='card mt-5 border border-primary/25 bg-primary/8'>
                <div className='card-body flex-row flex-wrap items-center justify-between gap-4'>
                    <div>
                        <h2 className='card-title text-lg'>Exercises</h2>
                        <p className='text-sm text-base-content/65'>Practice writing queries on the staging dataset.</p>
                    </div>
                    <Link className='btn btn-primary btn-sm' to='/exercises'>
                        Browse exercises
                    </Link>
                </div>
            </div>
        </div>
    );
}
