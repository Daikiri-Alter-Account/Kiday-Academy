import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Brand } from "@/components/brand";
import { ContactSection } from "@/components/contact-section";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { ServicesSection } from "@/components/services-section";
import { useServices } from "@/lib/use-services";

export function LandingPage() {
  const { services, status, error, reload } = useServices();
  const [subject, setSubject] = useState("Consulta general");

  useEffect(() => {
    document.title = "Kiday Studio | Estudia a tu manera";
  }, []);

  function handleSelectPlan(planName: string) {
    setSubject(planName);
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <Header />
      <Hero />
      <ServicesSection
        services={services}
        status={status}
        error={error}
        onRetry={reload}
        onSelectPlan={handleSelectPlan}
      />
      <ContactSection services={services} subject={subject} onSubjectChange={setSubject} />
      <footer className="border-t border-[var(--border)] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Brand />
          <p className="text-[11px] text-[var(--muted)]">
            © {new Date().getFullYear()} Kiday Studio. Hecho para estudiantes.
          </p>
          <nav aria-label="Enlaces del pie" className="flex items-center gap-4 text-[11px] text-[var(--muted)]">
            <a href="#planes" className="transition hover:text-[var(--foreground)]">Planes</a>
            <a href="#contacto" className="transition hover:text-[var(--foreground)]">Contacto</a>
            <Link to="/app" className="transition hover:text-[var(--foreground)]">Entrar</Link>
            <Link to="/admin/login" className="transition hover:text-[var(--foreground)]">Admin</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
