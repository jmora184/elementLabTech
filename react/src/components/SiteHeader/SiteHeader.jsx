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
  { label: "Contact Sales", id: "contact-sales" },
];

const DEFAULT_MINI_LINKS = [
  { label: "Trending Now", id: "trending-now" },
  { label: "Best Sellers", id: "best-sellers" },
  { label: "Sample Sets", id: "signature-blends" },
  { label: "Isolates", id: "isolates" },
  { label: "Customize", id: "customize" },
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
  "customize": "/customize",
};

const RESOURCE_ITEMS = [
  { label: "Applications", id: "applications", type: "section" },
  { label: "Blog", id: "blog", type: "route", route: "/blog" },
  { label: "Q&A", id: "q-and-a", type: "route", route: "/qna" },
  { label: "FAQ", id: "faq", type: "route", route: "/faq" },
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
  onCartClick,
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Local state so this component works even if you don't pass controlled props.
  const [localSearch, setLocalSearch] = useState("");
  const value = searchValue ?? localSearch;

  const [menuOpen, setMenuOpen] = useState(false);
  const [miniMenuOpen, setMiniMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
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
    setResourcesOpen(false);
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
    setResourcesOpen(false);

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
    setResourcesOpen(false);
    navigate(route);
  };

  const handleCartButtonClick = () => {
    setMenuOpen(false);
    setMiniMenuOpen(false);
    setResourcesOpen(false);
    if (typeof onCartClick === "function") {
      onCartClick();
      return;
    }
    navigate("/cart");
  };

  const handleResourceItemClick = (item) => {
    setMenuOpen(false);
    setMiniMenuOpen(false);
    setResourcesOpen(false);

    if (item.type === "route" && item.route) {
      navigate(item.route);
      return;
    }

    goToSection(item.id);
  };

  // Responsive: precompute mobile rows for flavor archive
  let mobileMiniMenuRows = [];
  if (typeof window !== 'undefined' && window.innerWidth <= 520) {
    const allLabels = [...miniMenuLeft, ...miniMenuRight];
    for (let i = 0; i < allLabels.length; i += 2) {
      mobileMiniMenuRows.push([
        allLabels[i],
        allLabels[i + 1] || null
      ]);
    }
  }

  return (
    <>
      <style>{`
        .ts-desktopOnlyResourceLink {
          display: inline-flex;
        }

        .ts-desktopResources {
          position: relative;
          display: none;
          align-items: center;
          padding-bottom: 10px;
          margin-bottom: -10px;
        }

        .ts-desktopResourcesBtn {
          background: transparent;
          border: 0;
          padding: 0;
          margin: 0;
          cursor: pointer;
          font: inherit;
          color: inherit;
        }

        .ts-desktopResourcesChevron {
          display: inline-block;
          margin-left: 6px;
          font-size: 0.75em;
          transform: translateY(-1px);
        }

        .ts-desktopResourcesMenu {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          min-width: 180px;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14);
          padding: 18px 0 8px;
          z-index: 50;
        }

        .ts-desktopResourcesItem {
          width: 100%;
          display: block;
          background: transparent;
          border: 0;
          text-align: left;
          padding: 10px 14px;
          cursor: pointer;
          font: inherit;
          color: #1f2937;
        }

        .ts-desktopResourcesItem:hover {
          background: rgba(0, 0, 0, 0.04);
        }

        @media (min-width: 901px) {
          .ts-desktopOnlyResourceLink {
            display: none !important;
          }

          .ts-desktopResources {
            display: inline-flex;
          }
        }
      `}</style>

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
              onClick={() => {
                setMenuOpen((v) => !v);
                setResourcesOpen(false);
              }}
            >
              ☰
            </button>
          </div>

          <div className={`ts-navLinks ${menuOpen ? "isOpen" : ""}`}>
            {resolvedNavLinks.map((l) => {
              const isDesktopResourceLink =
                l.id === "applications" || l.id === "q-and-a" || l.id === "faq" || l.id === "blog";

              return (
                <React.Fragment key={l.id}>
                  {l.id === "contact-sales" ? (
                    <>
                      <div
                        className="ts-desktopResources"
                        onMouseEnter={() => setResourcesOpen(true)}
                        onMouseLeave={() => setResourcesOpen(false)}
                      >
                        <button
                          className="ts-siteNavLink ts-desktopResourcesBtn"
                          type="button"
                          aria-haspopup="menu"
                          aria-expanded={resourcesOpen}
                          onClick={() => setResourcesOpen((v) => !v)}
                        >
                          Resources
                          <span className="ts-desktopResourcesChevron">▾</span>
                        </button>

                        {resourcesOpen ? (
                          <div className="ts-desktopResourcesMenu" role="menu" aria-label="Resources">
                            {RESOURCE_ITEMS.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                role="menuitem"
                                className="ts-desktopResourcesItem"
                                onClick={() => handleResourceItemClick(item)}
                              >
                                {item.label}
                              </button>
                            ))}
                            {user?.role === "admin" && (
                              <button
                                key="admin-orders"
                                type="button"
                                role="menuitem"
                                className="ts-desktopResourcesItem"
                                onClick={() => handleResourceItemClick({ label: "Admin Orders", id: "admin-orders", type: "route", route: "/admin/orders" })}
                              >
                                Admin Orders
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>

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
                    </>
                  ) : l.id === "q-and-a" ? (
                    <a
                      href="/qna"
                      className={`ts-siteNavLink ${isDesktopResourceLink ? "ts-desktopOnlyResourceLink" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setMenuOpen(false);
                        setMiniMenuOpen(false);
                        setResourcesOpen(false);
                        navigate("/qna");
                      }}
                    >
                      {l.label}
                    </a>
                  ) : l.id === "faq" ? (
                    <a
                      href="/faq"
                      className={`ts-siteNavLink ${isDesktopResourceLink ? "ts-desktopOnlyResourceLink" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setMenuOpen(false);
                        setMiniMenuOpen(false);
                        setResourcesOpen(false);
                        navigate("/faq");
                      }}
                    >
                      {l.label}
                    </a>
                  ) : l.id === "blog" ? (
                    <a
                      href="/blog"
                      className={`ts-siteNavLink ${isDesktopResourceLink ? "ts-desktopOnlyResourceLink" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setMenuOpen(false);
                        setMiniMenuOpen(false);
                        setResourcesOpen(false);
                        navigate("/blog");
                      }}
                    >
                      {l.label}
                    </a>
                  ) : (
                    <a
                      href={`/#${l.id}`}
                      className={`ts-siteNavLink ${isDesktopResourceLink ? "ts-desktopOnlyResourceLink" : ""}`}
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
              );
            })}

            <div className="ts-authArea">
              {user ? (
                <>
                  <button
                    className="ts-authBtn"
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setMiniMenuOpen(false);
                      setResourcesOpen(false);
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
                      setResourcesOpen(false);
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
                    setResourcesOpen(false);
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
                {/* Responsive: desktop = two columns, mobile = two-button rows */}
                {typeof window !== 'undefined' && window.innerWidth <= 520 ? (
                  <div className="ts-miniMenuGrid">
                    {mobileMiniMenuRows.map((row, idx) => (
                      <div className="ts-miniMenuRow" key={`row-${idx}`}>
                        <button
                          key={row[0]}
                          type="button"
                          className="ts-miniMenuItem"
                          onClick={() => handleMiniMenuItemClick(row[0])}
                        >
                          {row[0]}
                        </button>
                        {row[1] && (
                          <button
                            key={row[1]}
                            type="button"
                            className="ts-miniMenuItem"
                            onClick={() => handleMiniMenuItemClick(row[1])}
                          >
                            {row[1]}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ts-miniMenuGrid">
                    <div className="ts-miniMenuCol ts-miniMenuCol-left">
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
                    <div className="ts-miniMenuCol ts-miniMenuCol-right">
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
                )}
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
                    setResourcesOpen(false);
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
