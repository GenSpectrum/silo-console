import { Link } from 'react-router-dom';
import { exercises } from '../data/exercises';

export default function ExercisesListPage() {
    return (
        <div className='w-full max-w-5xl'>
            <h1 className='text-2xl font-semibold tracking-tight'>Exercises</h1>
            <p className='mt-1 text-sm text-base-content/60'>
                Practice writing SILO queries. Each exercise gives you a question — write the query and run it: the
                answer will be automatically compared against the reference answer. The exercises are designed to be run
                against the SARS-CoV-2 dataset from INSDC, hosted by CoV-Spectrum.
            </p>
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
