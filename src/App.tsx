import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { HomeView } from './pages/HomeView';
import { CatalogLaunchboxView } from './pages/CatalogLaunchboxView';
import { GameViewerView } from './pages/GameViewerView';
import { CreditsView } from './pages/CreditsView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomeView />} />
          <Route path="/games" element={<CatalogLaunchboxView />} />
          <Route path="/play/:alias" element={<GameViewerView />} />
          <Route path="/credits" element={<CreditsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;