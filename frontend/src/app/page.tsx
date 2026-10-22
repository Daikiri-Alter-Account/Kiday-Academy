import { Header } from "@/components/header";
import { Hero } from "@/components/hero";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      <Header />
      <Hero />
    </main>
  );
}
