import { NavLink, Outlet } from 'react-router-dom';
import { documentationSections } from '../../data/docs';
import ContextualSidebar, { contextualNavClass } from '../../components/ContextualSidebar';

export default function DocsLayout() {
    return (
        <ContextualSidebar label='Documentation navigation' navigation={<DocumentationMenu />}>
            <Outlet />
        </ContextualSidebar>
    );
}

function DocumentationMenu() {
    return (
        <ul className='menu w-full gap-0.5 menu-sm'>
            <li>
                <NavLink to='/docs' end className={contextualNavClass}>
                    Overview
                </NavLink>
            </li>
            {documentationSections.map((section) => (
                <li className='mt-3' key={section.title}>
                    <h2 className='menu-title'>{section.title}</h2>
                    <ul>
                        {section.pages.map((page) => (
                            <li key={page.path}>
                                <NavLink to={page.path} className={contextualNavClass}>
                                    {page.title}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </li>
            ))}
        </ul>
    );
}
