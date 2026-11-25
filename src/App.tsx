import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/AppShell';

const HubPage = lazy(() => import('./pages/HubPage').then((m) => ({ default: m.HubPage })));
const NewSptsPage = lazy(() =>
  import('./pages/NewSptsPage').then((m) => ({ default: m.NewSptsPage }))
);
const SptsClassicPage = lazy(() =>
  import('./pages/SptsClassicPage').then((m) => ({ default: m.SptsClassicPage }))
);
const SptlPage = lazy(() => import('./pages/SptlPage').then((m) => ({ default: m.SptlPage })));
const CalculatorPage = lazy(() =>
  import('./pages/CalculatorPage').then((m) => ({ default: m.CalculatorPage }))
);
const HelpPage = lazy(() => import('./pages/HelpPage').then((m) => ({ default: m.HelpPage })));
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
);
const ArturwolPage = lazy(() =>
  import('./pages/ArturwolPage').then((m) => ({ default: m.ArturwolPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

function RouteFallback() {
  return (
    <div
      aria-busy="true"
      className="min-h-[60vh] w-full rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50"
    />
  );
}

function LowercaseRedirector() {
  const location = useLocation();
  const lower = location.pathname.toLowerCase();
  if (location.pathname !== lower) {
    return <Navigate to={`${lower}${location.search}${location.hash}`} replace />;
  }

  return (
    <Suspense fallback={<RouteFallback />}>
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
          path="/spts/*"
          element={
            <AppShell>
              <NewSptsPage />
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
    </Suspense>
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
