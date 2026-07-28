import { NavLink, Outlet } from 'react-router-dom';
import ContextualSidebar, { contextualNavClass } from '../components/ContextualSidebar';
import { exercises } from '../data/exercises';

export default function ExercisesLayout() {
    return (
        <ContextualSidebar label='Exercise navigation' navigation={<ExerciseMenu />}>
            <Outlet />
        </ContextualSidebar>
    );
}

function ExerciseMenu() {
    return (
        <ul className='menu w-full gap-0.5 menu-sm'>
            <li>
                <NavLink to='/exercises' end className={contextualNavClass}>
                    All exercises
                </NavLink>
            </li>
            <li className='mt-3'>
                <h2 className='menu-title'>Exercises</h2>
                <ul>
                    {exercises.map((exercise, index) => (
                        <li key={exercise.slug}>
                            <NavLink to={`/exercises/${exercise.slug}`} className={contextualNavClass}>
                                {index + 1}. {exercise.title}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </li>
        </ul>
    );
}
