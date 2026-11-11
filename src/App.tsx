import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { BentoCatalogView } from './pages/BentoCatalogView';
import { KaikDedicatedView } from './pages/KaikDedicatedView';
import { AvatarDedicatedView } from './pages/AvatarDedicatedView';
import { CreditsView } from './pages/CreditsView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<BentoCatalogView />} />
          <Route path="/games" element={<BentoCatalogView />} />
          <Route path="/kaik" element={<KaikDedicatedView />} />
          <Route path="/avatar" element={<AvatarDedicatedView />} />
          <Route path="/credits" element={<CreditsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;