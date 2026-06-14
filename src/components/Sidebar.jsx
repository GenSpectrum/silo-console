import { NavLink } from 'react-router-dom';
import { exercises } from '../data/exercises.js';

// On small screens this is the slide-in menu toggled by the header hamburger; `open` controls the
// slide and `onNavigate` closes it after a link is followed.
export default function Sidebar({ open = false, onNavigate }) {
    return (
        <nav className={open ? 'sidebar open' : 'sidebar'}>
            <h2>Query</h2>
            <NavLink to='/console' onClick={onNavigate}>
                Console
            </NavLink>

            <h2>Learn</h2>
            <NavLink to='/languageReference' onClick={onNavigate}>
                Language Reference
            </NavLink>

            <h2>Exercises</h2>
            <NavLink to='/exercises' end onClick={onNavigate}>
                All exercises
            </NavLink>
            {exercises.map((ex, i) => (
                <NavLink key={ex.slug} to={`/exercises/${ex.slug}`} onClick={onNavigate}>
                    {i + 1}. {ex.title}
                </NavLink>
            ))}
        </nav>
    );
}
