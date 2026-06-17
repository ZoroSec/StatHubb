"use client";

import { useStatHub } from "@/lib/stathub/store";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { HomePage } from "./HomePage";
import { DatasetPage } from "./DatasetPage";
import { TopicPage } from "./TopicPage";
import { CountryPage } from "./CountryPage";
import { BoardPage } from "./BoardPage";
import { ComparePage } from "./ComparePage";
import { AdminPage } from "./AdminPage";
import { useEffect } from "react";

export function StatHubApp() {
  const { route, theme, navigate } = useStatHub();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && route.name !== "home") {
        navigate({ name: "home" });
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [route, navigate]);

  return (
    <div className="sh-app flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1">
        {route.name === "home" && <HomePage />}
        {route.name === "dataset" && <DatasetPage id={route.id} />}
        {route.name === "topic" && <TopicPage id={route.id} />}
        {route.name === "country" && <CountryPage id={route.id} />}
        {route.name === "board" && <BoardPage />}
        {route.name === "compare" && <ComparePage a={route.a} b={route.b} />}
        {route.name === "admin" && <AdminPage />}
      </main>
      <Footer />
    </div>
  );
}
