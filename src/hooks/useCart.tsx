import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const selectedProduct = cart.find((product) => product.id === productId);
      const selectedProductAmount = selectedProduct?.amount || 0;
      const productStock = await api.get(`/stock/${productId}`);
      const productAmountOnStock = productStock.data.amount;

      if (productAmountOnStock < selectedProductAmount + 1) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (selectedProduct) {
        selectedProduct.amount = selectedProduct.amount + 1;

        setCart([...cart]);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
      } else {
        const response = await api.get(`/products/${productId}`);
        const product = response.data;

        const productData = {
          ...product,
          amount: 1,
        };

        setCart([...cart, productData]);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify([...cart, productData])
        );
      }
    } catch {
      // TODO
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const updatedCart = [...cart];
      const selectedProductIndex = updatedCart.findIndex(
        (product) => product.id === productId
      );

      if (selectedProductIndex > -1) {
        updatedCart.splice(selectedProductIndex, 1);
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      } else {
        throw Error();
      }
    } catch {
      // TODO
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount < 1) {
        return;
      }

      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updatedCart = [...cart];
      const selectedProduct = updatedCart.find(
        (product) => product.id === productId
      );

      if (selectedProduct) {
        selectedProduct.amount = amount;
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      } else {
        throw Error();
      }
    } catch {
      // TODO
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
