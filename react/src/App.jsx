import "./App.css";
import TerpeneShowcase from "./components/TerpeneShowcase/TerpeneShowcase";
import HeroMotion from "./components/HeroBanner/HeroMotion";
import ProductPage from "./components/ProductPage";
import SiteLayout from "./components/SiteLayout/SiteLayout";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AccountPage from "./pages/AccountPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route
            path="/"
            element={
              <>
                <TerpeneShowcase HeroBanner={HeroMotion} />
                <section id="contact" style={{ padding: 80, textAlign: 'center' }}>
                  <h2>Contact</h2>
                  <p style={{ fontSize: '18px', marginTop: '20px' }}>info@elementlab.shop</p>
                </section>
              </>
            }
          />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
