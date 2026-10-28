import { useCallback, useEffect, useState } from "react";
import { api, type Service } from "@/lib/api";

type ServicesState = {
  status: "loading" | "ready" | "error";
  services: Service[];
  error: string;
};

export function useServices() {
  const [state, setState] = useState<ServicesState>({
    status: "loading",
    services: [],
    error: "",
  });

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading", error: "" }));
    try {
      const result = await api.services();
      setState({ status: "ready", services: result.services, error: "" });
    } catch (error) {
      setState({
        status: "error",
        services: [],
        error: error instanceof Error ? error.message : "No pudimos cargar el catálogo.",
      });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...state, reload };
}
