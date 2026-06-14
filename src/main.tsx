import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import { BASENAME } from './config';
import { ServerProvider } from './server/ServerContext';
import ConsolePage from './pages/ConsolePage';
import LanguageReferencePage from './pages/LanguageReferencePage';
import ExercisesListPage from './pages/ExercisesListPage';
import ExercisePage from './pages/ExercisePage';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <BrowserRouter basename={BASENAME}>
            <ServerProvider>
                <Routes>
                    <Route element={<App />}>
                        <Route index element={<Navigate to='/console' replace />} />
                        <Route path='console' element={<ConsolePage />} />
                        <Route path='languageReference' element={<LanguageReferencePage />} />
                        <Route path='exercises' element={<ExercisesListPage />} />
                        <Route path='exercises/:slug' element={<ExercisePage />} />
                        <Route path='*' element={<Navigate to='/console' replace />} />
                    </Route>
                </Routes>
            </ServerProvider>
        </BrowserRouter>
    </React.StrictMode>,
);
