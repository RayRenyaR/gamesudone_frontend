import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { GamesCatalogPage } from './pages/GamesCatalogPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<GamesCatalogPage />} />
          <Route path="/games" element={<GamesCatalogPage />} />
          <Route path="/juego/:alias" element={<GamesCatalogPage />} />
          <Route path="/games/:alias" element={<GamesCatalogPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;