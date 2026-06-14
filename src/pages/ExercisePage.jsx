import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { exercises, getExercise } from '../data/exercises.js';
import QueryRunner from '../components/QueryRunner.jsx';

export default function ExercisePage() {
    const { slug } = useParams();
    const exercise = getExercise(slug);
    const index = exercises.findIndex((e) => e.slug === slug);
    const [showAnswer, setShowAnswer] = useState(false);

    useEffect(() => setShowAnswer(false), [slug]);

    if (!exercise) {
        return (
            <div className='page'>
                <h2>Exercise not found</h2>
                <p>
                    <Link to='/exercises'>Back to all exercises</Link>
                </p>
            </div>
        );
    }

    return (
        <div className='page'>
            <h2>
                Exercise {index + 1}: {exercise.title}
            </h2>
            <div className='question'>{exercise.question}</div>
            <p className='hint'>
                Write your query and run it. Your result is automatically compared against the reference answer.
            </p>

            {/* key forces a fresh editor (and cleared results) per exercise */}
            <QueryRunner key={slug} referenceQuery={exercise.answer} />

            <div className='answer-block'>
                {showAnswer ? (
                    <>
                        <button className='secondary' onClick={() => setShowAnswer(false)}>
                            Hide answer
                        </button>
                        <pre>
                            <code>{exercise.answer}</code>
                        </pre>
                    </>
                ) : (
                    <button className='secondary' onClick={() => setShowAnswer(true)}>
                        Show answer
                    </button>
                )}
            </div>
        </div>
    );
}
