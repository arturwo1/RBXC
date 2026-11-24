import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ArturwolPage } from './pages/ArturwolPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { HelpPage } from './pages/HelpPage';
import { HubPage } from './pages/HubPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SptlPage } from './pages/SptlPage';
import { SptsClassicPage } from './pages/SptsClassicPage';

function LowercaseRedirector() {
  const location = useLocation();
  const lower = location.pathname.toLowerCase();
  if (location.pathname !== lower) {
    return <Navigate to={`${lower}${location.search}${location.hash}`} replace />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <AppShell>
            <HubPage />
          </AppShell>
        }
      />
      <Route
        path="/sptsc/*"
        element={
          <AppShell>
            <SptsClassicPage />
          </AppShell>
        }
      />
      <Route
        path="/sptlc/*"
        element={
          <AppShell>
            <SptlPage />
          </AppShell>
        }
      />
      <Route
        path="/calculator/*"
        element={
          <AppShell>
            <CalculatorPage />
          </AppShell>
        }
      />
      <Route
        path="/help/*"
        element={
          <AppShell>
            <HelpPage />
          </AppShell>
        }
      />
      <Route
        path="/privacy/*"
        element={
          <AppShell>
            <PrivacyPage />
          </AppShell>
        }
      />
      <Route
        path="/arturwol/*"
        element={
          <AppShell>
            <ArturwolPage />
          </AppShell>
        }
      />
      <Route
        path="*"
        element={
          <AppShell hideAds>
            <NotFoundPage />
          </AppShell>
        }
      />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <LowercaseRedirector />
    </BrowserRouter>
  );
}

export default App;
