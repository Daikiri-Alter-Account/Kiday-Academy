import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ProtectedRoute } from "@/components/protected-route";
import { RequireAuth } from "@/components/require-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { AdminLayout } from "@/layouts/admin-layout";
import { AppLayout } from "@/layouts/app-layout";
import { AdminLoginPage } from "@/pages/admin-login";
import { AdminMessagesPage } from "@/pages/admin-messages";
import { AdminOverviewPage } from "@/pages/admin-overview";
import { AdminServicesPage } from "@/pages/admin-services";
import { AssistantPage } from "@/pages/assistant";
import { AveragerPage } from "@/pages/averager";
import { CalendarPage } from "@/pages/calendar";
import { DashboardPage } from "@/pages/dashboard";
import { GroupsPage } from "@/pages/groups";
import { LandingPage } from "@/pages/landing";
import { LoginPage } from "@/pages/login";
import { NotFoundPage } from "@/pages/not-found";
import { RegisterPage } from "@/pages/register";
import { SubjectsPage } from "@/pages/subjects";
import { TasksPage } from "@/pages/tasks";
import { AuthProvider } from "@/lib/auth-context";
import { StudyProvider } from "@/lib/study-store";

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
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<RequireAuth />}>
            <Route
              path="/app"
              element={
                <StudyProvider>
                  <AppLayout />
                </StudyProvider>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="materias" element={<SubjectsPage />} />
              <Route path="tareas" element={<TasksPage />} />
              <Route path="calendario" element={<CalendarPage />} />
              <Route path="grupos" element={<GroupsPage />} />
              <Route path="promediador" element={<AveragerPage />} />
              <Route path="asistente" element={<AssistantPage />} />
            </Route>
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="mensajes" element={<AdminMessagesPage />} />
              <Route path="servicios" element={<AdminServicesPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
