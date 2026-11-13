import { useCartContext } from '../features/cart/CartContext';

export const useCart = () => {
  return useCartContext();
};

export default useCart;
