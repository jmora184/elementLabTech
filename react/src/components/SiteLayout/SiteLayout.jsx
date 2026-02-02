import React, { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import SiteHeader from "../SiteHeader/SiteHeader";
import { terpeneCollections } from "../TerpeneShowcase/terpenesData";

// Global layout that renders the same header + mini-header on every page.
// It also wires the search + nav links to scroll to sections on the home page.
export default function SiteLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const collectionIdSet = useMemo(() => {
    return new Set((terpeneCollections || []).map((c) => String(c.id)));
  }, []);

  const scrollToHomeTarget = (fn) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(fn, 200);
    } else {
      fn();
    }
  };

  const handleSearchChange = (e) => {
    const next = String(e?.target?.value ?? "").trim();
    // Only auto-scroll when the typed id matches a known collection id.
    if (!collectionIdSet.has(next)) return;

    scrollToHomeTarget(() => {
      const el = document.getElementById(`card-${next}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleNavToSection = (sectionId) => {
    scrollToHomeTarget(() => {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <>
      <SiteHeader
        onSearchChange={handleSearchChange}
        onNavToSection={handleNavToSection}
        searchPlaceholder="Search collections"
      />
      <main className="ts-pageContent">
        <Outlet />
      </main>
    </>
  );
}
