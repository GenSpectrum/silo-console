import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App.jsx';
import { BASENAME } from './config.js';
import { ServerProvider } from './server/ServerContext.jsx';
import ConsolePage from './pages/ConsolePage.jsx';
import LanguageReferencePage from './pages/LanguageReferencePage.jsx';
import ExercisesListPage from './pages/ExercisesListPage.jsx';
import ExercisePage from './pages/ExercisePage.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
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
