import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

// Reuse your existing header + mini-header styling so the look stays the same everywhere.
import "../TerpeneShowcase/TerpeneShowcase.css";

import elementLabsLogo from "../../assets/ElementLabsLogos.png";

const DEFAULT_NAV_LINKS = [
  { label: "Shop", id: "shop" },
  { label: "Applications", id: "applications" },
  { label: "Q&A", id: "q-and-a" },
  { label: "Contact Sales", id: "contact-sales"},
];

const DEFAULT_MINI_LINKS = [
  { label: "Trending Now", id: "trending-now" },
  { label: "Best Sellers", id: "best-sellers" },
  { label: "Signature Blends", id: "signature-blends" },
  { label: "Isolates", id: "isolates" },
   { label: "Carriers", id: "carriers" },
];

const DEFAULT_MINI_MENU_LEFT = [
  "Savory",
  "Desserts",
  "Fruits",
  "Botanicals",
  "Treats",
  "Mixers",
  "Sips & Bites",
  "Fresh Picks",
  "Zest",
  "Essentials",
];

const DEFAULT_MINI_MENU_RIGHT = [
  "Wildcard",
  "Flavor Experiments",
  "Curiosities",
  "Twist & Shout",
  "Rebel Flavors",
  "Bizarre & Brilliant",
  "Taste Adventures",
  "Quirk & Perk",
  "Off the Map",
  "WTF Flavors",
];

/**
 * Shared Site Header (+ mini header)
 *
 * Goals:
 * - Keep your current styling/structure (same classNames)
 * - Stop rewriting header markup on every page
 * - Improve mobile behavior via CSS (no layout cut-offs)
 */
export default function SiteHeader({
  logoSrc = elementLabsLogo,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search collections",
  navLinks = DEFAULT_NAV_LINKS,
  miniLinks = DEFAULT_MINI_LINKS,
  miniMenuLeft = DEFAULT_MINI_MENU_LEFT,
  miniMenuRight = DEFAULT_MINI_MENU_RIGHT,
  onNavToSection,
  onLogoClick,
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Local state so this component works even if you don't pass controlled props.
  const [localSearch, setLocalSearch] = useState("");
  const value = searchValue ?? localSearch;

  const [menuOpen, setMenuOpen] = useState(false);
  const [miniMenuOpen, setMiniMenuOpen] = useState(false);

  const resolvedNavLinks = useMemo(() => navLinks ?? DEFAULT_NAV_LINKS, [navLinks]);
  const resolvedMiniLinks = useMemo(() => miniLinks ?? DEFAULT_MINI_LINKS, [miniLinks]);

  const handleLogoClick = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    setMiniMenuOpen(false);
    if (typeof onLogoClick === "function") {
      onLogoClick();
      return;
    }
    navigate("/");
    // best-effort scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const goToSection = (id) => {
    setMenuOpen(false);
    setMiniMenuOpen(false);

    if (typeof onNavToSection === "function") {
      onNavToSection(id);
      return;
    }

    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSearchChange = (e) => {
    const next = e.target.value;
    setLocalSearch(next);
    if (typeof onSearchChange === "function") {
      onSearchChange(e);
    }
  };

  return (
    <>
      <header className="ts-siteHeader">
        <nav className="ts-siteNav" aria-label="Primary">
          <a
            href="/"
            className="ts-logoLink"
            aria-label="Element Labs Home"
            onClick={handleLogoClick}
          >
            <img src={logoSrc} alt="Element Labs Logo" className="ts-siteLogo" />
          </a>

          <div className="ts-headerActions">
            <div className="ts-jump ts-headerJump">
              <input
                id="collectionJump"
                className="ts-select ts-selectSearch"
                type="text"
                value={value}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
              />
            </div>

            <div className="ts-authArea">
              {user ? (
                <>
                  <button
                    className="ts-authBtn"
                    type="button"
                    onClick={() => navigate("/account")}
                  >
                    Account
                  </button>
                  <button
                    className="ts-authBtn ts-authBtnSecondary"
                    type="button"
                    onClick={async () => {
                      await logout();
                      navigate("/");
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  className="ts-authBtn"
                  type="button"
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>
              )}
            </div>

            <button
              className="ts-menuBtn"
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              ☰
            </button>
          </div>

          <div className={`ts-navLinks ${menuOpen ? "isOpen" : ""}`}>
            {resolvedNavLinks.map((l) => (
              <a
                key={l.id}
                href={`/#${l.id}`}
                className="ts-siteNavLink"
                onClick={(e) => {
                  e.preventDefault();
                  goToSection(l.id);
                }}
              >
                {l.label}
              </a>
            ))}
          </div>
        </nav>
      </header>

      <div className="ts-miniHeader">
        <div className="ts-miniHeaderInner">
          <div className="ts-miniMenu">
            <button
              className="ts-miniMenuBtn"
              type="button"
              aria-expanded={miniMenuOpen}
              aria-controls="mini-menu-panel"
              onClick={() => setMiniMenuOpen((v) => !v)}
            >
              ☰ All
            </button>

            {miniMenuOpen && (
              <div id="mini-menu-panel" className="ts-miniMenuPanel">
                <div className="ts-miniMenuGrid">
                  <div className="ts-miniMenuCol">
                    {miniMenuLeft.map((label) => (
                      <button key={label} type="button" className="ts-miniMenuItem">
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="ts-miniMenuCol">
                    {miniMenuRight.map((label) => (
                      <button key={label} type="button" className="ts-miniMenuItem">
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="ts-miniLinks">
            {resolvedMiniLinks.map((l) => (
              <a
                key={l.id}
                href={`/#${l.id}`}
                className="ts-miniLink"
                onClick={(e) => {
                  e.preventDefault();
                  goToSection(l.id);
                }}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
