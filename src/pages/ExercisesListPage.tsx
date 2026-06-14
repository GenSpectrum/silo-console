import { Link } from 'react-router-dom';
import { exercises } from '../data/exercises';

export default function ExercisesListPage() {
    return (
        <div className='page'>
            <h2>Exercises</h2>
            <p className='hint'>
                Practice writing SILO queries. Each exercise gives you a question — write the query, run it, and reveal
                the reference answer when you want to compare. Answers are not checked automatically.
            </p>
            <ul className='exercise-list'>
                {exercises.map((ex, i) => (
                    <li key={ex.slug}>
                        <span className='num'>Exercise {i + 1}</span>
                        <div>
                            <Link to={`/exercises/${ex.slug}`}>{ex.title}</Link>
                        </div>
                        <div className='hint'>{ex.question}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
