import { Link } from "react-router-dom";
import { Leaf, Mail, Phone } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-primary text-primary-foreground">
    <div className="container py-12 md:py-16">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Leaf className="h-6 w-6" />
            <span className="font-serif text-xl font-bold">SpiceRoot</span>
          </div>
          <p className="text-sm opacity-80">
            Pure, natural food powders sourced directly from farms. No preservatives, no additives — just nature's best.
          </p>
          {/* <div className="mt-4 flex gap-3">
            <a href="#" className="rounded-full bg-primary-foreground/10 p-2 transition-colors hover:bg-primary-foreground/20">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" className="rounded-full bg-primary-foreground/10 p-2 transition-colors hover:bg-primary-foreground/20">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" className="rounded-full bg-primary-foreground/10 p-2 transition-colors hover:bg-primary-foreground/20">
              <Twitter className="h-4 w-4" />
            </a>
          </div> */}
        </div>

        <div>
          <h4 className="mb-4 font-serif text-lg font-semibold">Quick Links</h4>
          <nav className="flex flex-col gap-2 text-sm opacity-80">
            <Link to="/products" className="hover:opacity-100">Shop All</Link>
            <Link to="/contact" className="hover:opacity-100">Contact</Link>
            {/* <Link to="/" className="hover:opacity-100">FAQ</Link>
            <Link to="/" className="hover:opacity-100">Blog</Link> */}
          </nav>
        </div>

        <div>
          <h4 className="mb-4 font-serif text-lg font-semibold">Categories</h4>
          <nav className="flex flex-col gap-2 text-sm opacity-80">
            <Link to="/products" className="hover:opacity-100">Masala Powders</Link>
            <Link to="/products" className="hover:opacity-100">Organic Powders</Link>
            <Link to="/products" className="hover:opacity-100">Pickles</Link>
          </nav>
        </div>

        <div>
          <h4 className="mb-4 font-serif text-lg font-semibold">Contact</h4>
          <div className="flex flex-col gap-3 text-sm opacity-80">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span>+91 99894 61148</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span>tennetisridevi1807@gmail.com</span>
            </div>
            {/* <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>123 Spice Lane, Kochi, Kerala, India - 682001</span>
            </div> */}
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/20 pt-8 text-xs opacity-60 md:flex-row">
        <p>© 2026 SpiceRoot. All rights reserved.</p>
        <div className="flex gap-4">
          
          <span>UPI</span>
          
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
