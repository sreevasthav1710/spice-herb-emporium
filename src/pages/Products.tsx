import { useState } from "react";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";

const categories = ["All", "Masala Powders", "Organic Powders", "Herbal Powders", "Nutrition Powders", "Spice Blends"];

const Products = () => {
  const [active, setActive] = useState("All");
  const { data: products = [], isLoading } = useProducts();
  const filtered = active === "All" ? products : products.filter((p) => p.category === active);

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container">
          <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">Our Products</h1>
          <p className="mt-2 text-muted-foreground">Pure, natural food powders for every kitchen</p>

          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button key={cat} variant={active === cat ? "default" : "outline"} size="sm" onClick={() => setActive(cat)}>
                {cat}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <p className="mt-12 text-center text-muted-foreground">Loading products...</p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <p className="mt-12 text-center text-muted-foreground">No products found in this category.</p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Products;
