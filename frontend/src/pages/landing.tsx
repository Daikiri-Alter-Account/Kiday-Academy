import { useEffect } from "react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";

export function LandingPage() {
  useEffect(() => {
    document.title = "Kiday Studio | Estudia a tu manera";
  }, []);

  return (
    <>
      <Header />
      <Hero />
    </>
  );
}
