import { Link } from "react-router-dom";
import { Trash2, Minus, Plus, ArrowLeft, ShoppingBag, CreditCard } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useCart, CartItem } from "@/contexts/CartContext";
import { useProductImage } from "@/hooks/useProductImage";

const CartItemRow = ({ item }: { item: CartItem }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const imgSrc = useProductImage(item.product.image);

  return (
    <div className="flex gap-4 border-b border-border py-4">
      <img src={imgSrc} alt={item.product.name} className="h-20 w-20 rounded-lg object-cover" />
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link to={`/products/${item.product.slug}`} className="font-serif font-semibold text-foreground hover:text-primary">
            {item.product.name}
          </Link>
          <p className="text-xs text-muted-foreground">{item.variant.weight}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center rounded border border-border">
            <button onClick={() => updateQuantity(item.variant.id, item.quantity - 1)} className="p-1.5"><Minus className="h-3 w-3" /></button>
            <span className="min-w-[1.5rem] text-center text-xs font-medium">{item.quantity}</span>
            <button onClick={() => updateQuantity(item.variant.id, item.quantity + 1)} className="p-1.5"><Plus className="h-3 w-3" /></button>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-foreground">₹{item.variant.price * item.quantity}</span>
            <button onClick={() => removeFromCart(item.variant.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Cart = () => {
  const { items, totalPrice, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container flex flex-col items-center py-20 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
          <h1 className="mt-4 font-serif text-2xl font-bold text-foreground">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Discover our pure, natural spice powders</p>
          <Button asChild className="mt-6"><Link to="/products">Start Shopping</Link></Button>
        </div>
      </Layout>
    );
  }

  const shipping = totalPrice >= 499 ? 0 : 49;
  const total = totalPrice + shipping;

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <Link to="/products" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Continue Shopping
        </Link>
        <h1 className="font-serif text-3xl font-bold text-foreground">Shopping Cart</h1>

        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {items.map((item) => (
              <CartItemRow key={item.variant.id} item={item} />
            ))}
            <button onClick={clearCart} className="mt-4 text-sm text-muted-foreground underline hover:text-foreground">Clear cart</button>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-serif text-xl font-semibold text-foreground">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{totalPrice}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? "Free" : `₹${shipping}`}</span></div>
              {shipping > 0 && <p className="text-xs text-accent">Free shipping on orders above ₹499</p>}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><span>Total</span><span>₹{total}</span></div>
            </div>

            <Button className="mt-6 w-full gap-2" size="lg" asChild>
              <Link to="/checkout"><CreditCard className="h-4 w-4" /> Proceed to Checkout</Link>
            </Button>

            <div className="mt-4 text-center text-xs text-muted-foreground">
              <p>We accept: Visa • Mastercard • UPI • PayPal • COD</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
