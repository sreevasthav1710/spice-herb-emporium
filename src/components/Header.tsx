import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, Leaf, User, LogOut, Shield } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Free delivery banner */}
      <div className="bg-primary py-1.5 text-center text-xs font-medium text-primary-foreground">
        🚚 Free Delivery on orders above ₹499
      </div>

      <div className="container flex h-16 items-center justify-between md:h-20">
        <Link to="/" className="flex items-center gap-2">
          <Leaf className="h-7 w-7 text-primary" />
          <span className="font-serif text-xl font-bold text-foreground md:text-2xl">SpiceRoot</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" size="icon" title="Admin">
                <Shield className="h-5 w-5 text-accent" />
              </Button>
            </Link>
          )}

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <Button variant="ghost" size="icon" onClick={() => signOut()} title="Sign Out">
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="icon" title="Sign In">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}

          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary ${
                  location.pathname === link.to ? "bg-secondary text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <button onClick={() => { signOut(); setMobileOpen(false); }}
                className="rounded-md px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:bg-secondary">
                Sign Out
              </button>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)}
                className="rounded-md px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary">
                Sign In / Sign Up
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)}
                className="rounded-md px-4 py-3 text-sm font-medium text-accent hover:bg-secondary">
                Admin Dashboard
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
