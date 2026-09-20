import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

const ua = navigator.userAgent;
const isIosSafari =
  /iP(hone|ad|od)/.test(ua) &&
  /WebKit/.test(ua) &&
  !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/.test(ua);

if (isIosSafari) {
  document.documentElement.dataset.safariOverlay = "1";
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
