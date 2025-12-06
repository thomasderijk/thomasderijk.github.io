import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Set random favicon on page load
const setRandomFavicon = () => {
  const faviconCount = 27; // Total number of favicon SVGs
  const randomIndex = Math.floor(Math.random() * faviconCount);
  const faviconPath = `/favicons/favicon-${randomIndex}.svg`;

  // Update or create favicon link element
  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = faviconPath;
  link.type = 'image/svg+xml';
};

// Set favicon immediately
setRandomFavicon();

createRoot(document.getElementById("root")!).render(<App />);
