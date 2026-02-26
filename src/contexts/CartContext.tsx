import React, { createContext, useContext, useState, useCallback } from "react";
import type { DbVariant, DbProduct } from "@/hooks/useProducts";
import { toast } from "sonner";

export type CartItem = {
  product: DbProduct;
  variant: DbVariant;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (product: DbProduct, variant: DbVariant) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: DbProduct, variant: DbVariant) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variant.id === variant.id);
      if (existing) {
        toast.success(`Updated ${product.name} (${variant.weight}) quantity`);
        return prev.map((i) => (i.variant.id === variant.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      toast.success(`${product.name} (${variant.weight}) added to cart`);
      return [...prev, { product, variant, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variant.id !== variantId));
    toast.info("Item removed from cart");
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.variant.id !== variantId));
      return;
    }
    setItems((prev) => prev.map((i) => (i.variant.id === variantId ? { ...i, quantity } : i)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.variant.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
