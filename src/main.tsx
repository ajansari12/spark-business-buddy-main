import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initPerformanceMonitoring } from "./utils/performanceMonitoring";
import { configureDOMPurify } from "./utils/sanitizeHtml";

// Initialize security and performance monitoring
if (typeof window !== 'undefined') {
  configureDOMPurify();
  initPerformanceMonitoring();
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
