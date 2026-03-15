import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

export function mountPage(page: React.ReactElement) {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>{page}</React.StrictMode>
  );
}
