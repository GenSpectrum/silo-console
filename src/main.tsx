import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import { BASENAME } from './config';
import ConsolePage from './pages/ConsolePage';
import ExercisesListPage from './pages/ExercisesListPage';
import ExercisePage from './pages/ExercisePage';
import ExercisesLayout from './pages/ExercisesLayout';
import HomePage from './pages/HomePage';
import DocsLayout from './pages/docs/DocsLayout';
import DocsOverviewPage from './pages/docs/DocsOverviewPage';
import WhatIsSiloPage from './pages/docs/WhatIsSiloPage';
import DataModelPage from './pages/docs/DataModelPage';
import SqlComparisonPage from './pages/docs/SqlComparisonPage';
import LanguageReferencePage from './pages/docs/LanguageReferencePage';
import FunctionReferencePage from './pages/docs/FunctionReferencePage';
import HttpApiReferencePage from './pages/docs/HttpApiReferencePage';
import NotFoundPage from './pages/NotFoundPage';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <BrowserRouter basename={BASENAME}>
            <Routes>
                <Route element={<App />}>
                    <Route index element={<HomePage />} />
                    <Route path='console' element={<ConsolePage />} />
                    <Route path='docs' element={<DocsLayout />}>
                        <Route index element={<DocsOverviewPage />} />
                        <Route path='explanation/what-is-silo' element={<WhatIsSiloPage />} />
                        <Route path='explanation/data-model' element={<DataModelPage />} />
                        <Route path='explanation/from-sql' element={<SqlComparisonPage />} />
                        <Route path='reference/query-language' element={<LanguageReferencePage />} />
                        <Route path='reference/functions' element={<FunctionReferencePage />} />
                        <Route path='reference/http-api' element={<HttpApiReferencePage />} />
                    </Route>
                    <Route path='exercises' element={<ExercisesLayout />}>
                        <Route index element={<ExercisesListPage />} />
                        <Route path=':slug' element={<ExercisePage />} />
                    </Route>
                    <Route path='*' element={<NotFoundPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
);
