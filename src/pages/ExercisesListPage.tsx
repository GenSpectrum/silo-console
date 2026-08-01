import { Link } from 'react-router-dom';
import { exercises } from '../data/exercises';
import { EXERCISE_SERVER } from '../config';
import { usePageMeta } from '../lib/pageMeta';

export default function ExercisesListPage() {
    usePageMeta('Exercises', "Exercises for RhyDB's query language on a fixed SARS-CoV-2 dataset.");

    return (
        <div className='exercises-list w-full max-w-5xl'>
            <h1 className='text-3xl font-bold tracking-tight'>Exercises</h1>
            <p className='mt-3 max-w-3xl text-base leading-relaxed text-base-content/65'>
                Write queries against the staging dataset. Results are compared with reference queries. Each exercise
                includes an explanation and documentation links.
            </p>
            <div className='mt-5 alert items-start border-info/25 bg-info/8 text-sm'>
                <span className='text-info'>●</span>
                <div>
                    <div className='font-semibold'>Fixed training environment</div>
                    <p className='mt-0.5 text-base-content/65'>
                        Every exercise runs against the SARS-CoV-2 INSDC dataset hosted by CoV-Spectrum. The Console's
                        server selection does not affect exercises.
                    </p>
                    <p className='mt-1 font-mono text-xs break-all text-base-content/50'>{EXERCISE_SERVER}</p>
                </div>
            </div>
            <ul className='list mt-5 overflow-hidden rounded-box border border-base-300 bg-base-100'>
                {exercises.map((exercise, index) => (
                    <li className='list-row block border-b border-base-300 p-0 last:border-b-0' key={exercise.slug}>
                        <Link
                            className='block px-4 py-3 transition-colors hover:bg-base-200 hover:no-underline'
                            to={`/exercises/${exercise.slug}`}
                        >
                            <span className='text-xs text-base-content/50'>Exercise {index + 1}</span>
                            <div className='font-medium text-primary'>{exercise.title}</div>
                            <div className='mt-0.5 text-xs text-base-content/60'>
                                {exercise.question.split('\n\n')[0]}
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
