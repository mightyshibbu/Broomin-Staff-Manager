import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { ToastViewport } from "@/components/ui/toast";

import { TempoDevtools } from "tempo-devtools";
TempoDevtools.init();

const basename = import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <ToastProvider>
        <App />
        <ToastViewport />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
