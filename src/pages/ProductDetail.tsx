import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Star, Minus, Plus, Check } from "lucide-react";
import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { getProductImages } from "@/hooks/useProductImage";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || "");
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageOpen, setIsImageOpen] = useState(false);

  if (isLoading) return <Layout><div className="container py-20 text-center text-muted-foreground">Loading...</div></Layout>;

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-serif text-2xl font-bold text-foreground">Product not found</h1>
          <Button asChild className="mt-4" variant="outline"><Link to="/products">Back to Shop</Link></Button>
        </div>
      </Layout>
    );
  }

  const selectedVariant = product.variants.find(v => v.id === selectedVariantId) || product.variants.find(v => v.is_default) || product.variants[0];
  const productImages = getProductImages(product.image, product.gallery_images);
  const activeImage = selectedImage && productImages.includes(selectedImage) ? selectedImage : productImages[0];
  const showRatingSummary = (product.show_rating_summary ?? true) && product.rating !== null;
  const showIngredients = (product.show_ingredients ?? true) && Boolean(product.ingredients?.trim());
  const showUsageInstructions = (product.show_usage_instructions ?? true) && Boolean(product.usage_instructions?.trim());
  const showDetailsSection = showIngredients || (product.benefits && product.benefits.length > 0) || showUsageInstructions;

  const handleAdd = () => {
    if (!selectedVariant) return;
    for (let i = 0; i < qty; i++) addToCart(product, selectedVariant);
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <Link to="/products" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Shop
        </Link>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-4">
            <button
              type="button"
              className="block w-full overflow-hidden rounded-xl bg-secondary text-left"
              onClick={() => setIsImageOpen(true)}
            >
              <img src={activeImage} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
            </button>
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {productImages.map((image) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`overflow-hidden rounded-lg border bg-secondary ${activeImage === image ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                  >
                    <img src={image} alt={`${product.name} thumbnail`} className="aspect-square h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-accent">{product.category}</p>
            <h1 className="mt-1 font-serif text-3xl font-bold text-foreground md:text-4xl">{product.name}</h1>
            {!product.in_stock && (
              <span className="mt-2 inline-block rounded-full bg-destructive px-3 py-1 text-sm font-medium text-destructive-foreground">Out of Stock</span>
            )}
            {showRatingSummary && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating!) ? "fill-gold text-gold" : "text-muted"}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{product.rating} ({product.reviews} reviews)</span>
              </div>
            )}

            {/* Variant selector */}
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-foreground">Select Size:</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(v => (
                  <button key={v.id} onClick={() => setSelectedVariantId(v.id)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      selectedVariant?.id === v.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}>
                    {v.weight} — ₹{v.price}
                    {v.original_price && <span className="ml-1 text-xs line-through text-muted-foreground">₹{v.original_price}</span>}
                  </button>
                ))}
              </div>
            </div>

            {selectedVariant && (
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-foreground">₹{selectedVariant.price}</span>
                {selectedVariant.original_price && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">₹{selectedVariant.original_price}</span>
                    <span className="rounded bg-accent/10 px-2 py-0.5 text-sm font-medium text-accent">
                      {Math.round(((selectedVariant.original_price - selectedVariant.price) / selectedVariant.original_price) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
            )}

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
              <Button size="lg" className="flex-1 gap-2" onClick={handleAdd} disabled={!product.in_stock}>
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </Button>
            </div>

            {showDetailsSection && (
              <div className="mt-8 space-y-4 border-t border-border pt-6">
                {showIngredients && (
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-foreground">Ingredients</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{product.ingredients}</p>
                  </div>
                )}
                {product.benefits && product.benefits.length > 0 && (
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
                )}
                {showUsageInstructions && (
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-foreground">How to Use</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{product.usage_instructions}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent className="max-w-5xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{product.name} image preview</DialogTitle>
          <div className="overflow-hidden rounded-xl bg-background">
            <img src={activeImage} alt={product.name} className="max-h-[85vh] w-full object-contain" />
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ProductDetail;
