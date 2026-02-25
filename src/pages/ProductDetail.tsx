import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Star, Minus, Plus, Check } from "lucide-react";
import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { getProductBySlug } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useProductImage } from "@/hooks/useProductImage";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = getProductBySlug(slug || "");
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const imgSrc = useProductImage(product?.image || "");

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-serif text-2xl font-bold text-foreground">Product not found</h1>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/products">Back to Shop</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <Link to="/products" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Shop
        </Link>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl bg-secondary">
            <img src={imgSrc} alt={product.name} className="h-full w-full object-cover" />
          </div>

          <div>
            <p className="text-sm font-medium text-accent">{product.category}</p>
            <h1 className="mt-1 font-serif text-3xl font-bold text-foreground md:text-4xl">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-gold text-gold" : "text-muted"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{product.rating} ({product.reviews} reviews)</span>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-foreground">₹{product.price}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">₹{product.originalPrice}</span>
              )}
              {product.originalPrice && (
                <span className="rounded bg-accent/10 px-2 py-0.5 text-sm font-medium text-accent">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </span>
              )}
            </div>

            <p className="mt-4 text-sm text-muted-foreground">{product.weight}</p>
            <p className="mt-4 leading-relaxed text-muted-foreground">{product.description}</p>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center rounded-lg border border-border">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2.5 text-muted-foreground hover:text-foreground">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2.5rem] text-center text-sm font-medium">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="p-2.5 text-muted-foreground hover:text-foreground">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button size="lg" className="flex-1 gap-2" onClick={handleAdd}>
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </Button>
            </div>

            <div className="mt-8 space-y-4 border-t border-border pt-6">
              <div>
                <h3 className="font-serif text-lg font-semibold text-foreground">Ingredients</h3>
                <p className="mt-1 text-sm text-muted-foreground">{product.ingredients}</p>
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-foreground">Benefits</h3>
                <ul className="mt-1 space-y-1">
                  {product.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-primary" /> {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-foreground">How to Use</h3>
                <p className="mt-1 text-sm text-muted-foreground">{product.usage}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
