import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import React, { useState } from "react";
import Layout from "./components/Layout";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import AnalysisEngine from "./pages/AnalysisEngine";
import AnalysisHistory from "./pages/AnalysisHistory";
import DataIngestion from "./pages/DataIngestion";
import DataPreview from "./pages/DataPreview";
import ResultsDashboard from "./pages/ResultsDashboard";
import type { AnalysisResult } from "./types/analysis";
import type { TableData } from "./types/schema";

// ─── Shared App State ─────────────────────────────────────────────────────────
// We use a module-level store so route components can share state without prop drilling
let _currentTable: TableData | null = null;
let _analysisResult: AnalysisResult | null = null;

export function setCurrentTable(t: TableData | null) {
  _currentTable = t;
}
export function getCurrentTable(): TableData | null {
  return _currentTable;
}
export function setAnalysisResult(r: AnalysisResult | null) {
  _analysisResult = r;
}
export function getAnalysisResult(): AnalysisResult | null {
  return _analysisResult;
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
function RootLayout() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <Layout>
      <ProfileSetupModal open={showProfileSetup} />
      <Outlet />
    </Layout>
  );
}

// ─── Page Wrappers (access shared state) ─────────────────────────────────────
function DataIngestionPage() {
  return <DataIngestion onTableReady={(t) => setCurrentTable(t)} />;
}

function DataPreviewPage() {
  const table = getCurrentTable();
  if (!table) {
    // Redirect handled by route beforeLoad, but fallback:
    return (
      <div className="text-center py-20 font-mono text-muted-foreground">
        No data loaded.{" "}
        <a href="/" className="text-neon-green underline">
          Go back to Step 1
        </a>
      </div>
    );
  }
  return (
    <DataPreview
      table={table}
      onTableUpdated={(t) => setCurrentTable(t)}
      onAnalysisReady={(r) => setAnalysisResult(r)}
    />
  );
}

function AnalysisEnginePage() {
  const table = getCurrentTable();
  if (!table) {
    return (
      <div className="text-center py-20 font-mono text-muted-foreground">
        No data loaded.{" "}
        <a href="/" className="text-neon-green underline">
          Go back to Step 1
        </a>
      </div>
    );
  }
  return (
    <AnalysisEngine table={table} onComplete={(r) => setAnalysisResult(r)} />
  );
}

function ResultsDashboardPage() {
  const result = getAnalysisResult();
  const table = getCurrentTable();
  if (!result || !table) {
    return (
      <div className="text-center py-20 font-mono text-muted-foreground">
        No analysis results.{" "}
        <a href="/" className="text-neon-green underline">
          Start a new analysis
        </a>
      </div>
    );
  }
  return <ResultsDashboard result={result} table={table} />;
}

// ─── Routes ───────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DataIngestionPage,
});

const previewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/preview",
  component: DataPreviewPage,
});

const analysisRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analysis",
  component: AnalysisEnginePage,
});

const resultsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/results",
  component: ResultsDashboardPage,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: AnalysisHistory,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  previewRoute,
  analysisRoute,
  resultsRoute,
  historyRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return <RouterProvider router={router} />;
}
