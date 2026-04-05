import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import DriftCore from "./components/DriftCore.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DriftCore />
  </StrictMode>
);
