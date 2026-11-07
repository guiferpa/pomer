import { useEffect, useState } from "react";

// Os endereços do app, por hash: o principal (formulário de torneio ou relógio)
// e o da tela de estruturas. Um refresh continua no mesmo endereço.
export type Route = "main" | "structures";

export const ROUTE_HASHES: Record<Route, string> = {
  main: "#/",
  structures: "#/estruturas",
};

export const routeFromHash = (hash: string): Route =>
  hash === ROUTE_HASHES.structures ? "structures" : "main";

// Muda o endereço de qualquer lugar do app. O aviso é imediato, para todos os
// `useRoute` trocarem de tela sem esperar o evento do navegador.
export const navigateTo = (route: Route): void => {
  if (window.location.hash !== ROUTE_HASHES[route]) {
    window.location.hash = ROUTE_HASHES[route];
  }
  window.dispatchEvent(new HashChangeEvent("hashchange"));
};

export const useRoute = () => {
  const [route, setRoute] = useState<Route>(() =>
    routeFromHash(window.location.hash),
  );

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash(window.location.hash));

    window.addEventListener("hashchange", onHashChange);

    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return { route, navigate: navigateTo };
};
