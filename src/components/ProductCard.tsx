import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import type { ProductWithVariants } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useProductImage } from "@/hooks/useProductImage";

const ProductCard = ({ product }: { product: ProductWithVariants }) => {
  const { addToCart } = useCart();
  const imgSrc = useProductImage(product.image);
  const defaultVariant = product.variants.find(v => v.is_default) || product.variants[0];

  if (!defaultVariant) return null;

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg">
      {product.badge && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          {product.badge}
        </span>
      )}
      {!product.in_stock && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60">
          <span className="rounded-full bg-destructive px-4 py-1.5 text-sm font-semibold text-destructive-foreground">Out of Stock</span>
        </div>
      )}

      <Link to={`/products/${product.slug}`}>
        <div className="aspect-square overflow-hidden bg-secondary">
          <img src={imgSrc} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        </div>
      </Link>

      <div className="p-4">
        <p className="mb-1 text-xs font-medium text-muted-foreground">{product.category}</p>
        <Link to={`/products/${product.slug}`}>
          <h3 className="font-serif text-lg font-semibold text-foreground transition-colors hover:text-primary">{product.name}</h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.short_description}</p>

        <p className="mt-1 text-xs text-muted-foreground">{product.variants.map(v => v.weight).join(" | ")}</p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">₹{defaultVariant.price}</span>
            {defaultVariant.original_price && (
              <span className="text-sm text-muted-foreground line-through">₹{defaultVariant.original_price}</span>
            )}
          </div>
          <Button size="sm" onClick={() => addToCart(product, defaultVariant)} className="gap-1.5" disabled={!product.in_stock}>
            <ShoppingCart className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
