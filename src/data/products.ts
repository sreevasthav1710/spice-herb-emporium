export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  shortDescription: string;
  ingredients: string;
  benefits: string[];
  usage: string;
  weight: string;
  rating: number;
  reviews: number;
  badge?: string;
};

export const categories = [
  "All",
  "Masala Powders",
  "Organic Powders",
  "Pickles",
] as const;

export type Category = (typeof categories)[number];

export const products: Product[] = [
  {
    id: "1",
    name: "Premium Turmeric Powder",
    slug: "premium-turmeric-powder",
    category: "Organic Powders",
    price: 249,
    originalPrice: 349,
    image: "turmeric",
    description: "Our premium turmeric powder is sourced from the finest Erode turmeric roots, known for their high curcumin content. Stone-ground to preserve natural oils and nutrients, this golden spice brings vibrant color and earthy warmth to every dish.",
    shortDescription: "Stone-ground Erode turmeric with high curcumin content.",
    ingredients: "100% Pure Turmeric (Curcuma longa) root powder. No additives, no preservatives.",
    benefits: ["High curcumin content (5-6%)", "Anti-inflammatory properties", "Natural antioxidant", "Supports immunity", "Enhances skin health"],
    usage: "Add to curries, rice, milk (golden latte), smoothies, or use as a face mask. ½ tsp per serving recommended.",
    weight: "200g",
    rating: 4.8,
    reviews: 234,
    badge: "Bestseller",
  },
  {
    id: "2",
    name: "Kashmir Red Chili Powder",
    slug: "kashmir-red-chili-powder",
    category: "Masala Powders",
    price: 199,
    image: "chili",
    description: "Authentic Kashmiri red chili powder that delivers a deep, rich color with mild heat. Perfect for tandoori dishes, curries, and marinades where you want vibrant color without overwhelming spiciness.",
    shortDescription: "Mild heat, vibrant color. Perfect for tandoori and curries.",
    ingredients: "100% Kashmiri Red Chili (Capsicum annuum). No artificial colors.",
    benefits: ["Rich in Vitamin C", "Natural food coloring", "Mild heat level", "Boosts metabolism", "Rich antioxidant"],
    usage: "Use in curries, marinades, tandoori preparations. 1-2 tsp per dish.",
    weight: "150g",
    rating: 4.6,
    reviews: 178,
  },
  {
    id: "3",
    name: "Royal Garam Masala",
    slug: "royal-garam-masala",
    category: "Spice Blends",
    price: 299,
    originalPrice: 399,
    image: "garam-masala",
    description: "A royal blend of 12 whole spices, slow-roasted and stone-ground for an aromatic, complex flavor. This garam masala elevates any dish with its warm, fragrant notes of cardamom, cinnamon, cloves, and more.",
    shortDescription: "12-spice royal blend, slow-roasted and stone-ground.",
    ingredients: "Coriander, Cumin, Black Pepper, Cardamom, Cinnamon, Cloves, Bay Leaf, Nutmeg, Mace, Fennel, Star Anise, Black Cardamom.",
    benefits: ["Aids digestion", "Rich in antioxidants", "Boosts metabolism", "Anti-inflammatory", "Aromatic and flavorful"],
    usage: "Add at the end of cooking for best flavor. ½–1 tsp per serving.",
    weight: "100g",
    rating: 4.9,
    reviews: 312,
    badge: "Top Rated",
  },
  {
    id: "4",
    name: "Moringa Leaf Powder",
    slug: "moringa-leaf-powder",
    category: "Herbal Powders",
    price: 349,
    image: "moringa",
    description: "Shade-dried moringa leaves from organic farms, carefully powdered to retain maximum nutrition. Known as the 'Miracle Tree,' moringa is a superfood packed with vitamins, minerals, and amino acids.",
    shortDescription: "Organic superfood with 90+ nutrients.",
    ingredients: "100% Organic Moringa Oleifera leaf powder. Shade-dried, no heat processing.",
    benefits: ["Rich in iron & calcium", "Complete amino acid profile", "Supports energy levels", "Boosts immunity", "Natural detoxifier"],
    usage: "Mix 1 tsp in smoothies, juices, soups, or warm water. Can be added to rotis and parathas.",
    weight: "150g",
    rating: 4.7,
    reviews: 156,
    badge: "Organic",
  },
  {
    id: "5",
    name: "Sambar Masala Powder",
    slug: "sambar-masala-powder",
    category: "Masala Powders",
    price: 179,
    image: "garam-masala",
    description: "An authentic South Indian sambar masala made with traditional recipes passed down through generations. The perfect balance of toor dal-friendly spices for a comforting bowl of sambar.",
    shortDescription: "Authentic South Indian recipe for perfect sambar.",
    ingredients: "Coriander, Red Chili, Toor Dal, Chana Dal, Fenugreek, Curry Leaves, Turmeric, Asafoetida, Mustard, Black Pepper.",
    benefits: ["Protein-rich blend", "Digestive aid", "Rich in fiber", "Traditional recipe", "No preservatives"],
    usage: "Add 2-3 tsp to sambar while cooking with vegetables and tamarind.",
    weight: "200g",
    rating: 4.5,
    reviews: 98,
  },
  {
    id: "6",
    name: "Ashwagandha Root Powder",
    slug: "ashwagandha-root-powder",
    category: "Herbal Powders",
    price: 399,
    image: "moringa",
    description: "Premium ashwagandha root powder sourced from Rajasthan. This ancient adaptogenic herb helps reduce stress, boost energy, and improve overall vitality. Lab-tested for purity and potency.",
    shortDescription: "Adaptogenic herb for stress relief and vitality.",
    ingredients: "100% Withania somnifera root powder. Lab-tested for heavy metals.",
    benefits: ["Reduces stress & anxiety", "Improves sleep quality", "Boosts stamina", "Supports thyroid function", "Enhances cognitive function"],
    usage: "Mix 1 tsp in warm milk or water before bedtime. Can be added to smoothies.",
    weight: "100g",
    rating: 4.8,
    reviews: 203,
    badge: "Premium",
  },
  {
    id: "7",
    name: "Protein Power Mix",
    slug: "protein-power-mix",
    category: "Nutrition Powders",
    price: 499,
    originalPrice: 649,
    image: "moringa",
    description: "A carefully formulated plant-based protein powder combining sattu, almond flour, flaxseed, and pumpkin seed proteins. Ideal for fitness enthusiasts and anyone looking to boost their protein intake naturally.",
    shortDescription: "Plant-based protein blend with sattu and nuts.",
    ingredients: "Sattu (roasted gram flour), Almond Flour, Flaxseed Powder, Pumpkin Seed Powder, Jaggery, Cardamom.",
    benefits: ["25g protein per serving", "Plant-based & natural", "Rich in fiber", "Sustained energy", "No artificial sweeteners"],
    usage: "Mix 2 tbsp in milk, smoothie, or yogurt. Perfect post-workout or as breakfast.",
    weight: "500g",
    rating: 4.6,
    reviews: 145,
    badge: "New",
  },
  {
    id: "8",
    name: "Kitchen King Masala",
    slug: "kitchen-king-masala",
    category: "Spice Blends",
    price: 219,
    image: "garam-masala",
    description: "An all-purpose Indian spice blend that makes every vegetable dish taste restaurant-quality. A balanced mix of warming spices with a touch of dried mango powder for a subtle tang.",
    shortDescription: "All-purpose blend for restaurant-quality curries.",
    ingredients: "Coriander, Cumin, Turmeric, Red Chili, Amchur, Ginger, Cinnamon, Cardamom, Cloves, Black Pepper, Bay Leaf, Fenugreek.",
    benefits: ["Versatile all-purpose blend", "Balanced flavor profile", "Time-saving", "No MSG or additives", "Consistent quality"],
    usage: "Add 1-2 tsp while cooking any vegetable curry, paneer dish, or dal.",
    weight: "200g",
    rating: 4.7,
    reviews: 267,
  },
];

export const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug);
export const getProductsByCategory = (category: Category) =>
  category === "All" ? products : products.filter((p) => p.category === category);

export const imageMap: Record<string, string> = {};
