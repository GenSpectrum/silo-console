import { Link, useParams } from 'react-router-dom';
import { exercises, getExercise } from '../data/exercises';
import QueryRunner from '../components/QueryRunner';
import { EXERCISE_SERVER } from '../config';
import { usePageMeta } from '../lib/pageMeta';

export default function ExercisePage() {
    const { slug } = useParams();
    const exercise = getExercise(slug);
    const index = exercises.findIndex((item) => item.slug === slug);
    usePageMeta(exercise?.title || 'Exercise not found');

    if (!exercise) {
        return (
            <div className='w-full max-w-5xl'>
                <h1 className='text-3xl font-bold tracking-tight'>Exercise not found</h1>
                <p className='mt-3'>
                    <Link className='link link-primary' to='/exercises'>
                        Back to all exercises
                    </Link>
                </p>
            </div>
        );
    }

    const previous = exercises[index - 1];
    const next = exercises[index + 1];

    return (
        <div className='exercise-page w-full'>
            <div className='breadcrumbs mb-6 text-sm'>
                <ul>
                    <li>
                        <Link to='/exercises'>Exercises</Link>
                    </li>
                    <li>Exercise {index + 1}</li>
                </ul>
            </div>
            <div className='flex flex-wrap items-start justify-between gap-4'>
                <div>
                    <p className='text-sm font-semibold text-primary'>
                        Exercise {index + 1} of {exercises.length}
                    </p>
                    <h1 className='mt-1 text-3xl font-bold tracking-tight'>{exercise.title}</h1>
                </div>
                <div className='badge border-info/30 bg-info/8 text-info'>Fixed training server</div>
            </div>

            <ExerciseDescription text={exercise.question} />
            <p className='mb-3 text-sm text-base-content/60'>
                Write a query and run it. The result is compared with the reference answer without considering row
                order.
            </p>
            <QueryRunner key={slug} server={EXERCISE_SERVER} referenceQuery={exercise.answer} />

            <div className='mt-6 space-y-3'>
                <details className='collapse border border-base-300 bg-base-100'>
                    <summary className='collapse-title font-semibold'>Explanation</summary>
                    <div className='collapse-content text-sm leading-relaxed text-base-content/75'>
                        <p>{exercise.explanation}</p>
                        <div className='mt-4 flex flex-wrap gap-2'>
                            {exercise.documentation.map((item) => (
                                <Link className='btn btn-outline btn-xs' to={item.to} key={item.to}>
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </details>
                <details className='collapse border border-base-300 bg-base-100'>
                    <summary className='collapse-title font-semibold'>Reference answer</summary>
                    <div className='collapse-content'>
                        <pre className='overflow-x-auto rounded-box border border-base-300 bg-neutral p-4 font-mono text-xs leading-6 text-neutral-content'>
                            <code>{exercise.answer}</code>
                        </pre>
                    </div>
                </details>
            </div>

            <nav
                className='mt-8 flex justify-between gap-4 border-t border-base-300 pt-5'
                aria-label='Exercise navigation'
            >
                {previous ? (
                    <Link className='btn btn-ghost btn-sm' to={`/exercises/${previous.slug}`}>
                        ← Previous
                    </Link>
                ) : (
                    <span />
                )}
                {next ? (
                    <Link className='btn btn-ghost btn-sm' to={`/exercises/${next.slug}`}>
                        Next →
                    </Link>
                ) : (
                    <Link className='btn btn-ghost btn-sm' to='/exercises'>
                        All exercises
                    </Link>
                )}
            </nav>
        </div>
    );
}

function ExerciseDescription({ text }: { text: string }) {
    const blocks = text.split('~~~');

    return (
        <div className='card my-5 border border-base-300 bg-base-200 card-sm'>
            <div className='card-body gap-0'>
                {blocks.map((block, index) =>
                    index % 2 === 1 ? (
                        <pre
                            className='my-3 max-w-full overflow-x-auto rounded-field border border-base-300 bg-base-100 p-3 font-mono text-xs'
                            key={index}
                        >
                            <code>{block.trim()}</code>
                        </pre>
                    ) : (
                        block
                            .trim()
                            .split(/\n{2,}/)
                            .filter(Boolean)
                            .map((paragraph, paragraphIndex) => (
                                <p className='mb-2 last:mb-0' key={`${index}-${paragraphIndex}`}>
                                    {paragraph.replace(/\n/g, ' ')}
                                </p>
                            ))
                    ),
                )}
            </div>
        </div>
    );
}
