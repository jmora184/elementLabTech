import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { getCartCount } from "../../utils/cart";

// Reuse your existing header + mini-header styling so the look stays the same everywhere.
import "../TerpeneShowcase/TerpeneShowcase.css";

import elementLabsLogo from "../../assets/newnewlogo.png";
import cartIcon from "../../assets/cart.svg";

const DEFAULT_NAV_LINKS = [
  { label: "Applications", id: "applications" },
  { label: "Q&A", id: "q-and-a" },
  { label: "FAQ", id: "faq", placeholder: true },
  { label: "Blog", id: "blog", placeholder: true },
  { label: "Contact Sales", id: "contact-sales"},
];

const DEFAULT_MINI_LINKS = [
  { label: "Trending Now", id: "trending-now" },
  { label: "Best Sellers", id: "best-sellers" },
  { label: "Sample Sets", id: "signature-blends" },
  { label: "Isolates", id: "isolates" },
   { label: "Carriers", id: "carriers" },
];

const DEFAULT_MINI_MENU_LEFT = [
  "Savory",
  "Desserts",
  "Fruits",
  "Treats",
  "Mixers",
  "Fresh Picks",
  "Zest",
];

const DEFAULT_MINI_MENU_RIGHT = [
  "Essentials",
  "Wildcard",
  "Flavor Experiments",
  "Rebel Flavors",
  "Bizarre & Brilliant",
  "Taste Adventures",
  "Off the Map",
];

const MINI_MENU_ROUTES = {
  Savory: "/product/matrix-collection?profile=rosemary-olive",
  Desserts: "/product/matrix-collection?profile=pistachio-baklava",
  Fruits: "/product/fruity-fusion-forward?profile=blueberry-burst",
  Treats: "/product/matrix-collection?profile=cotton-candy",
  Mixers: "/product/matrix-collection?profile=mojito",
  "Fresh Picks": "/product/matrix-collection?profile=cucumber-mint",
  Zest: "/product/fruity-fusion-forward?profile=lime-note",
  Wildcard: "/product/matrix-collection?profile=strawberry-nesiquik",
  "Wild Card": "/product/matrix-collection?profile=strawberry-nesiquik",
  "Flavor Experiments": "/product/matrix-collection?profile=19",
  "Rebel Flavors": "/product/matrix-collection?profile=tajin",
  "Bizarre & Brilliant": "/product/fruity-fusion-forward?profile=charrd-coconut",
  "Bizarre and Brilliant": "/product/fruity-fusion-forward?profile=charrd-coconut",
  "Taste Adventures": "/product/matrix-collection?profile=black-sesame-honey",
  "Taste Adventure": "/product/matrix-collection?profile=black-sesame-honey",
  "Off the Map": "/product/matrix-collection?profile=charred-coconut",
};

const MINI_LINK_ROUTES = {
  "trending-now": "/product/matrix-collection?profile=tres-leches",
  "best-sellers": "/product/matrix-collection?profile=hawiiana-snow-cone",
  "signature-blends": "/samples",
  "isolates": "/isolates",
  "carriers": "/carriers",
};

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
  onCartClick,
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Local state so this component works even if you don't pass controlled props.
  const [localSearch, setLocalSearch] = useState("");
  const value = searchValue ?? localSearch;

  const [menuOpen, setMenuOpen] = useState(false);
  const [miniMenuOpen, setMiniMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(() => getCartCount());

  useEffect(() => {
    const handleCartUpdated = (event) => {
      const detailCount = Number(event?.detail?.count);
      if (Number.isFinite(detailCount)) {
        setCartCount(detailCount);
        return;
      }
      setCartCount(getCartCount());
    };

    window.addEventListener("el-cart-updated", handleCartUpdated);
    return () => {
      window.removeEventListener("el-cart-updated", handleCartUpdated);
    };
  }, []);

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

  const handleMiniMenuItemClick = (label) => {
    const route = MINI_MENU_ROUTES[label];
    if (!route) return;
    setMenuOpen(false);
    setMiniMenuOpen(false);
    navigate(route);
  };

  const handleCartButtonClick = () => {
    setMenuOpen(false);
    setMiniMenuOpen(false);
    if (typeof onCartClick === "function") {
      onCartClick();
      return;
    }
    navigate("/cart");
  };

  return (
    <>
      <header className="ts-siteHeader">
        <nav className="ts-siteNav" aria-label="Primary">
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

          <a
            href="/"
            className="ts-logoLink"
            aria-label="Element Lab Home"
            onClick={handleLogoClick}
          >
            <img src={logoSrc} alt="Element Lab Logo" className="ts-siteLogo" />
          </a>

          <div className="ts-headerActions">
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
              <React.Fragment key={l.id}>
                  {l.id === "q-and-a" ? (
                    <a
                      href="/qna"
                      className="ts-siteNavLink"
                      onClick={(e) => {
                        e.preventDefault();
                        setMenuOpen(false);
                        setMiniMenuOpen(false);
                        navigate("/qna");
                      }}
                    >
                      {l.label}
                    </a>
                  ) : l.id === "faq" ? (
                    <a
                      href="/faq"
                      className="ts-siteNavLink"
                      onClick={(e) => {
                        e.preventDefault();
                        setMenuOpen(false);
                        setMiniMenuOpen(false);
                        navigate("/faq");
                      }}
                    >
                      {l.label}
                    </a>
                  ) : l.id === "blog" ? (
                    <a
                      href="/blog"
                      className="ts-siteNavLink"
                      onClick={(e) => {
                        e.preventDefault();
                        setMenuOpen(false);
                        setMiniMenuOpen(false);
                        navigate("/blog");
                      }}
                    >
                      {l.label}
                    </a>
                  ) : (
                    <a
                      href={`/#${l.id}`}
                      className="ts-siteNavLink"
                      onClick={(e) => {
                        e.preventDefault();
                        if (l.placeholder) return;
                        goToSection(l.id);
                      }}
                    >
                      {l.label}
                    </a>
                  )}
                {l.id === "contact-sales" ? (
                  <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                    <button
                      className="ts-cartIconBtn"
                      type="button"
                      aria-label={`Cart with ${cartCount} item${cartCount === 1 ? "" : "s"}`}
                      onClick={handleCartButtonClick}
                    >
                      <img src={cartIcon} alt="Cart" />
                      {cartCount > 0 ? <span>{cartCount}</span> : null}
                    </button>
                  </div>
                ) : null}
              </React.Fragment>
            ))}
            <div className="ts-authArea">
              {user ? (
                <>
                  <button
                    className="ts-authBtn"
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setMiniMenuOpen(false);
                      navigate("/account");
                    }}
                  >
                    Account
                  </button>
                  <button
                    className="ts-authBtn ts-authBtnSecondary"
                    type="button"
                    onClick={async () => {
                      setMenuOpen(false);
                      setMiniMenuOpen(false);
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
                  onClick={() => {
                    setMenuOpen(false);
                    setMiniMenuOpen(false);
                    navigate("/login");
                  }}
                >
                  Login
                </button>
              )}
            </div>
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
              ☰ Flavor Archive
            </button>

            {miniMenuOpen && (
              <div id="mini-menu-panel" className="ts-miniMenuPanel">
                <div className="ts-miniMenuGrid">
                  <div className="ts-miniMenuCol">
                    {miniMenuLeft.map((label) => (
                      <button
                        key={label}
                        type="button"
                        className="ts-miniMenuItem"
                        onClick={() => handleMiniMenuItemClick(label)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="ts-miniMenuCol">
                    {miniMenuRight.map((label) => (
                      <button
                        key={label}
                        type="button"
                        className="ts-miniMenuItem"
                        onClick={() => handleMiniMenuItemClick(label)}
                      >
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
                  const route = MINI_LINK_ROUTES[l.id];
                  if (route) {
                    setMenuOpen(false);
                    setMiniMenuOpen(false);
                    navigate(route);
                    return;
                  }
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
