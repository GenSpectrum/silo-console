import { Link } from 'react-router-dom';
import { exercises } from '../data/exercises';

export default function ExercisesListPage() {
    return (
        <div className='page'>
            <h2>Exercises</h2>
            <p className='hint'>
                Practice writing SILO queries. Each exercise gives you a question — write the query and run it: the
                answer will be automatically compared against the reference answer. The exercises are designed to be run
                against the SARS-CoV-2 dataset from INSDC, hosted by CoV-Spectrum.
            </p>
            <ul className='exercise-list'>
                {exercises.map((ex, i) => (
                    <li key={ex.slug}>
                        <span className='num'>Exercise {i + 1}</span>
                        <div>
                            <Link to={`/exercises/${ex.slug}`}>{ex.title}</Link>
                        </div>
                        <div className='hint'>{ex.question.split('\n\n')[0]}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
