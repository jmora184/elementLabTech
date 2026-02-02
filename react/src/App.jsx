
import "./App.css";
import TerpeneShowcase from "./components/TerpeneShowcase/TerpeneShowcase";
import HeroMotion from "./components/HeroBanner/HeroMotion";
import ProductPage from "./components/ProductPage";
import SiteLayout from "./components/SiteLayout/SiteLayout";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
                <section id="contact" style={{ padding: 80 }}>
                  <h2>Contact</h2>
                  <p>Drop your real contact form or CTA section here.</p>
                </section>
              </>
            }
          />
          <Route path="/product/:id" element={<ProductPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
//