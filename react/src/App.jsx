import { useEffect } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";

import HeroMotion from "./components/HeroBanner/HeroMotion";
import TerpeneShowcase from "./components/TerpeneShowcase/TerpeneShowcase";
import SampleShowcase from "./components/SampleShowcase/SampleShowcase";
import SampleShowcaseProductPage from "./components/SampleShowcaseProductPage/SampleShowcaseProductPage";
import IsolatesShowcase from "./components/IsolatesShowcase/IsolatesShowcase";
import CarriersShowcase from "./components/CarriersShowcase/CarriersShowcase";
import ApplicationsPage from "./components/ApplicationsPage/ApplicationsPage";
import ContactPage from "./components/ContactPage/ContactPage";
import ProductPage from "./components/ProductPage/ProductPage";
import SiteLayout from "./components/SiteLayout/SiteLayout";

import QnAPage from "./pages/QnAPage";
import CustomizePage from "./pages/CustomizePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AccountPage from "./pages/AccountPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import CartPage from "./pages/CartPage";
import BlogPage from "./pages/BlogPage";
import FAQPage from "./pages/FAQPage";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route
            path="/"
            element={
              <>
                <TerpeneShowcase HeroBanner={HeroMotion} />
                <section id="contact" style={{ padding: 80, textAlign: "center" }}>
                  <h2>Contact</h2>
                  <p style={{ fontSize: "18px", marginTop: "20px", fontWeight: 700 }}>
                    info@elementlab.shop
                  </p>
                  <p style={{ fontSize: "16px", marginTop: "18px" }}>
                    FL Office: 515 N Flagler DrWest Palm Beach, 33401
                  </p>
                  <p style={{ fontSize: "16px", marginTop: "8px" }}>
                    CA Office: 10250 Constellation Blvd, Los Angeles, 90067
                  </p>
                  <div
                    style={{
                      marginTop: 40,
                      width: "100%",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <p style={{ fontSize: "13px", margin: 0 }}>
                      Copyright© 2026 Element Lab. All rights reserved.
                    </p>
                  </div>
                </section>
              </>
            }
          />
          <Route path="/samples" element={<SampleShowcase />} />
          <Route path="/samples/:id" element={<SampleShowcaseProductPage />} />
          <Route path="/isolates" element={<IsolatesShowcase HeroBanner={HeroMotion} />} />
          <Route path="/carriers" element={<CarriersShowcase HeroBanner={HeroMotion} />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/qna" element={<QnAPage />} />
          <Route path="/customize" element={<CustomizePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/faq" element={<FAQPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
