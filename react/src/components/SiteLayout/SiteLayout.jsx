import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import SiteHeader from "../SiteHeader/SiteHeader";

// Global layout that renders the same header + mini-header on every page.
export default function SiteLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToHomeTarget = (fn) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(fn, 200);
    } else {
      fn();
    }
  };

  const handleNavToSection = (sectionId) => {
    if (sectionId === "applications") {
      navigate("/applications");
      return;
    }

    if (sectionId === "q-and-a") {
      navigate("/contact");
      return;
    }

    if (sectionId === "contact-sales") {
      navigate("/contact");
      return;
    }

    scrollToHomeTarget(() => {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <>
      <SiteHeader
        onNavToSection={handleNavToSection}
        searchPlaceholder="Search flavors & isolates"
      />
      <main className="ts-pageContent">
        <Outlet />
      </main>
    </>
  );
}
