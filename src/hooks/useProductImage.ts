import turmericImg from "@/assets/product-turmeric.jpg";
import chiliImg from "@/assets/product-chili.jpg";
import garamMasalaImg from "@/assets/product-garam-masala.jpg";
import moringaImg from "@/assets/product-moringa.jpg";

const imageMap: Record<string, string> = {
  turmeric: turmericImg,
  chili: chiliImg,
  "garam-masala": garamMasalaImg,
  moringa: moringaImg,
};

export const useProductImage = (key: string) => {
  if (!key) return turmericImg;
  if (/^(https?:)?\/\//.test(key) || key.startsWith("/")) return key;
  return imageMap[key] || turmericImg;
};
