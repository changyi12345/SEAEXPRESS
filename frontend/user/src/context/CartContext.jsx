import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart')
    return saved ? JSON.parse(saved) : { items: [], restaurant: null, shop: null }
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (item, type, restaurantOrShop) => {
    setCart(prev => {
      // If adding from different restaurant/shop, clear cart
      if (type === 'restaurant' && prev.restaurant && prev.restaurant._id !== restaurantOrShop._id) {
        return {
          items: [{ ...item, itemType: type }],
          restaurant: restaurantOrShop,
          shop: null
        }
      }
      if (type === 'shop' && prev.shop && prev.shop._id !== restaurantOrShop._id) {
        return {
          items: [{ ...item, itemType: type }],
          restaurant: null,
          shop: restaurantOrShop
        }
      }

      // Check if item already exists
      const existingIndex = prev.items.findIndex(
        i => i.itemId === item._id && i.itemType === type
      )

      if (existingIndex >= 0) {
        const newItems = [...prev.items]
        newItems[existingIndex].quantity += item.quantity || 1
        return {
          ...prev,
          items: newItems,
          [type]: restaurantOrShop
        }
      }

      return {
        ...prev,
        items: [...prev.items, { ...item, itemId: item._id, itemType: type }],
        [type]: restaurantOrShop
      }
    })
  }

  const removeFromCart = (itemId, itemType) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.filter(
        item => !(item.itemId === itemId && item.itemType === itemType)
      )
    }))
  }

  const updateQuantity = (itemId, itemType, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId, itemType)
      return
    }
    setCart(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.itemId === itemId && item.itemType === itemType
          ? { ...item, quantity }
          : item
      )
    }))
  }

  const clearCart = () => {
    setCart({ items: [], restaurant: null, shop: null })
  }

  const getCartTotal = () => {
    return cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const getCartCount = () => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

