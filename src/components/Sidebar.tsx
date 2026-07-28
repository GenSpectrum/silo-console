import { NavLink } from 'react-router-dom';
import { exercises } from '../data/exercises';

type SidebarProps = {
    onNavigate: () => void;
};

function navClass({ isActive }: { isActive: boolean }) {
    return isActive ? 'bg-primary/15 font-semibold text-primary' : '';
}

export default function Sidebar({ onNavigate }: SidebarProps) {
    return (
        <aside
            id='sidebar-navigation'
            className='min-h-full w-64 overflow-y-auto border-r border-base-300 bg-base-200 p-3'
        >
            <nav aria-label='Main navigation'>
                <ul className='menu w-full gap-0.5 menu-sm'>
                    <li className='menu-title'>Query</li>
                    <li>
                        <NavLink to='/console' className={navClass} onClick={onNavigate}>
                            Console
                        </NavLink>
                    </li>

                    <li className='mt-3 menu-title'>Learn</li>
                    <li>
                        <NavLink to='/languageReference' className={navClass} onClick={onNavigate}>
                            Language Reference
                        </NavLink>
                    </li>

                    <li className='mt-3 menu-title'>Exercises</li>
                    <li>
                        <NavLink to='/exercises' end className={navClass} onClick={onNavigate}>
                            All exercises
                        </NavLink>
                    </li>
                    {exercises.map((exercise, index) => (
                        <li key={exercise.slug}>
                            <NavLink to={`/exercises/${exercise.slug}`} className={navClass} onClick={onNavigate}>
                                {index + 1}. {exercise.title}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
}
