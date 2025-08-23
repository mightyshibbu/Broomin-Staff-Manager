import { Suspense } from "react";
import { Routes, Route, Navigate, useRoutes } from "react-router-dom";
import Home from "./components/home";
import routes from "tempo-routes";

function App() {
  const tempoRoutes = import.meta.env.VITE_TEMPO === "true" ? useRoutes(routes) : null;
  
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Routes>
        <Route path="/" element={<Navigate to="/attendance" replace />} />
        <Route path="/:tab" element={<Home />} />
      </Routes>
      {tempoRoutes}
    </Suspense>
  );
}

export default App;
