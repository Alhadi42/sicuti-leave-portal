import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import "@/index.css";

import "@/utils/aggressiveResizeObserverSuppression.js";
import "@/lib/globalErrorHandler.js";
import { initDebugConsole } from "@/lib/debugConsole.js";
import "@/utils/errorUtils.js";
import "@/lib/productionOptimizer.js";
import "@/lib/healthChecker.js";
import "@/utils/resizeObserverSuppression.js";

try {
  initDebugConsole();
} catch (debugError) {
  console.error("Failed to initialize debug console:", debugError);
}

if (import.meta.env.DEV) {
  setTimeout(() => {
    import("@/utils/errorTestUtility.js");
    import("@/utils/consoleTest.js");
    import("@/utils/immediateConsoleTest.js");
    import("@/utils/resizeObserverTest.js");
  }, 100);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
