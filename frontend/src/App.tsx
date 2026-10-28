import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/layouts/app-layout";
import { AssistantPage } from "@/pages/assistant";
import { AveragerPage } from "@/pages/averager";
import { DashboardPage } from "@/pages/dashboard";
import { GroupsPage } from "@/pages/groups";
import { LandingPage } from "@/pages/landing";
import { NotFoundPage } from "@/pages/not-found";
import { SubjectsPage } from "@/pages/subjects";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export function App() {
  return (
    <ThemeProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="materias" element={<SubjectsPage />} />
          <Route path="grupos" element={<GroupsPage />} />
          <Route path="promediador" element={<AveragerPage />} />
          <Route path="asistente" element={<AssistantPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
}
