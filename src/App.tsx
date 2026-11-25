import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { BentoCatalogView } from './pages/BentoCatalogView';
import { DeveloperPortalLayout } from './pages/DeveloperPortalLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<BentoCatalogView />} />
          <Route path="/games" element={<BentoCatalogView />} />
          <Route path="/juego/:alias" element={<BentoCatalogView />} />
          <Route path="/games/:alias" element={<BentoCatalogView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/developer" element={<DeveloperPortalLayout />} />
          <Route path="/developer/:section" element={<DeveloperPortalLayout />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;