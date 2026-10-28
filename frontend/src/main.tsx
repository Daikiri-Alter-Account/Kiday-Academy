import React from "react";
import { createRoot } from "react-dom/client";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { ThemeProvider } from "@/components/theme-provider";
import "@/app/globals.css";

function App() {
  return (
    <ThemeProvider>
      <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        <Header />
        <Hero />
      </main>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
