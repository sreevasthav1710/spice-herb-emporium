import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Truck, Shield, Leaf as LeafIcon, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import NewsletterPopup from "@/components/NewsletterPopup";
import { products } from "@/data/products";
import heroBanner from "@/assets/hero-banner.jpg";
import aboutStory from "@/assets/about-story.jpg";

const featuredProducts = products.filter((p) => p.badge).slice(0, 4);

const trustItems = [
  { icon: LeafIcon, title: "100% Natural", desc: "No preservatives or artificial additives" },
  { icon: Shield, title: "Lab Tested", desc: "Quality certified for purity & safety" },
  { icon: Truck, title: "Free Delivery", desc: "On orders above ₹499" },
  { icon: Star, title: "4.8★ Rated", desc: "Trusted by 10,000+ customers" },
];

const testimonials = [
  { name: "Priya Sharma", text: "The turmeric powder is the freshest I've ever used. You can smell the difference!", rating: 5 },
  { name: "Rajesh Kumar", text: "Switched to SpiceRoot for all my spices. The garam masala is absolutely divine.", rating: 5 },
  { name: "Anita Desai", text: "Love the moringa powder in my morning smoothie. Great quality, fast delivery!", rating: 4 },
];

const Index = () => {
  return (
    <Layout>
      <NewsletterPopup />

      {/* Hero */}
      <section className="relative h-[80vh] min-h-[500px] overflow-hidden">
        <img src={heroBanner} alt="Premium spice powders" className="absolute inset-0 h-full w-full object-cover" />
        <div className="bg-hero-overlay absolute inset-0" />
        <div className="container relative flex h-full flex-col items-start justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <span className="mb-4 inline-block rounded-full bg-accent/90 px-4 py-1.5 text-sm font-medium text-accent-foreground">
              Farm Fresh • Stone Ground • Pure
            </span>
            <h1 className="mb-4 font-serif text-4xl font-bold leading-tight text-cream md:text-6xl">
              Nature's Finest Spice Powders
            </h1>
            <p className="mb-8 text-lg text-cream/80">
              Discover handcrafted, stone-ground spice blends and herbal powders sourced directly from Indian farms. Pure, natural, and packed with flavor.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link to="/products">
                  Shop Now <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-cream/30 bg-cream/10 text-cream hover:bg-cream/20 hover:text-cream">
                <Link to="/about">Our Story</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-b border-border bg-secondary py-8">
        <div className="container grid grid-cols-2 gap-6 md:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2.5">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">Featured Products</h2>
              <p className="mt-2 text-muted-foreground">Our most loved spice powders and blends</p>
            </div>
            <Link to="/products" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline md:flex">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Button asChild variant="outline">
              <Link to="/products">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Story Preview */}
      <section className="bg-secondary py-16 md:py-24">
        <div className="container grid items-center gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl">
            <img src={aboutStory} alt="Our spice sourcing story" className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">From Farm to Your Kitchen</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              At SpiceRoot, we work directly with small-scale farmers across India to bring you the freshest, most flavorful spice powders. Every batch is stone-ground in small quantities to preserve natural oils, aroma, and nutrition.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              No chemicals. No fillers. No compromises. Just pure, honest spices the way nature intended.
            </p>
            <Button asChild className="mt-6 gap-2" variant="outline">
              <Link to="/about">Learn More <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="mb-10 text-center font-serif text-3xl font-bold text-foreground md:text-4xl">What Our Customers Say</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-3 flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-center text-primary-foreground">
        <div className="container">
          <h2 className="font-serif text-3xl font-bold md:text-4xl">Ready to Taste the Difference?</h2>
          <p className="mx-auto mt-3 max-w-lg opacity-80">
            Join thousands of health-conscious home cooks who trust SpiceRoot for pure, natural flavors.
          </p>
          <Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/products">Explore Our Collection</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
