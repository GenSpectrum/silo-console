import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { exercises, getExercise } from '../data/exercises';
import QueryRunner from '../components/QueryRunner';

export default function ExercisePage() {
    const { slug } = useParams();
    const exercise = getExercise(slug);
    const index = exercises.findIndex((e) => e.slug === slug);
    const [showAnswer, setShowAnswer] = useState(false);

    useEffect(() => setShowAnswer(false), [slug]);

    if (!exercise) {
        return (
            <div className='w-full max-w-5xl'>
                <h1 className='text-2xl font-semibold tracking-tight'>Exercise not found</h1>
                <p className='mt-3'>
                    <Link className='link link-primary' to='/exercises'>
                        Back to all exercises
                    </Link>
                </p>
            </div>
        );
    }

    return (
        <div className='w-full'>
            <h1 className='text-2xl font-semibold tracking-tight'>
                Exercise {index + 1}: {exercise.title}
            </h1>
            <ExerciseDescription text={exercise.question} />
            <p className='mb-3 text-sm text-base-content/60'>
                Write your query and run it. Your result is automatically compared against the reference answer.
            </p>

            {/* key forces a fresh editor (and cleared results) per exercise */}
            <QueryRunner key={slug} referenceQuery={exercise.answer} />

            <div className='mt-4'>
                {showAnswer ? (
                    <>
                        <button className='btn btn-outline btn-sm' onClick={() => setShowAnswer(false)}>
                            Hide answer
                        </button>
                        <pre className='mt-3 overflow-x-auto rounded-box border border-base-300 bg-base-200 p-3 font-mono text-xs'>
                            <code>{exercise.answer}</code>
                        </pre>
                    </>
                ) : (
                    <button className='btn btn-outline btn-sm' onClick={() => setShowAnswer(true)}>
                        Show answer
                    </button>
                )}
            </div>
        </div>
    );
}

function ExerciseDescription({ text }: { text: string }) {
    const blocks = text.split('~~~');

    return (
        <div className='card my-4 border border-base-300 bg-base-200 card-sm'>
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
