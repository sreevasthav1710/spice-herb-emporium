import { Link } from "react-router-dom";
import { ShoppingCart, Heart, Star } from "lucide-react";
import { Product } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useProductImage } from "@/hooks/useProductImage";

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const imgSrc = useProductImage(product.image);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg">
      {product.badge && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          {product.badge}
        </span>
      )}
      <button className="absolute right-3 top-3 z-10 rounded-full bg-card/80 p-2 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-card">
        <Heart className="h-4 w-4 text-muted-foreground" />
      </button>

      <Link to={`/products/${product.slug}`}>
        <div className="aspect-square overflow-hidden bg-secondary">
          <img
            src={imgSrc}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </Link>

      <div className="p-4">
        <p className="mb-1 text-xs font-medium text-muted-foreground">{product.category}</p>
        <Link to={`/products/${product.slug}`}>
          <h3 className="font-serif text-lg font-semibold text-foreground transition-colors hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.shortDescription}</p>

        <div className="mt-2 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
          <span className="text-sm font-medium text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice}</span>
            )}
          </div>
          <Button size="sm" onClick={() => addToCart(product)} className="gap-1.5">
            <ShoppingCart className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
