import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./global.css";
import App from "./App2";
import ProtectedPage from "./ProtectedPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<ProtectedPage page={"admin"} />} />
        <Route
          path="/admin/approval"
          element={<ProtectedPage page={"approval"} />}
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
