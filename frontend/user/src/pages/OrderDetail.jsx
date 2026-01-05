import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useSocket } from '../context/SocketContext'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { addToCart, clearCart } = useCart()
  const { socket } = useSocket()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')

  useEffect(() => {
    if (!isAuthenticated) return
    fetchOrder()
  }, [id, isAuthenticated])

  // Real-time order updates via Socket.io
  useEffect(() => {
    if (!socket || !order) return

    // Join order room for updates
    socket.emit('join-room', `order-${id}`)

    // Listen for order updates
    const handleOrderUpdate = (updatedOrder) => {
      if (updatedOrder._id === order._id) {
        setOrder(updatedOrder)
      }
    }

    const handleOrderCancelled = (cancelledOrder) => {
      if (cancelledOrder._id === order._id) {
        setOrder(cancelledOrder)
      }
    }

    socket.on('order-updated', handleOrderUpdate)
    socket.on('order-cancelled', handleOrderCancelled)

    return () => {
      socket.off('order-updated', handleOrderUpdate)
      socket.off('order-cancelled', handleOrderCancelled)
    }
  }, [socket, order, id])

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`/users/orders/${id}`)
      console.log('Order response:', res.data)
      if (res.data && res.data.order) {
        setOrder(res.data.order)
        if (res.data.order.rating) {
          setRating(res.data.order.rating)
          setReview(res.data.order.review || '')
        }
      } else {
        console.error('Order not found in response')
        setOrder(null)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      console.error('Error response:', error.response?.data)
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!rating) {
      alert('Please select a rating')
      return
    }

    try {
      await axios.post(`/users/orders/${id}/review`, { rating, review })
      fetchOrder()
      alert('Review submitted successfully')
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review')
    }
  }

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return
    }

    try {
      await axios.post(`/orders/${id}/cancel`)
      fetchOrder()
      alert('Order cancelled successfully')
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert(error.response?.data?.message || 'Failed to cancel order')
    }
  }

  const canCancelOrder = () => {
    return ['pending', 'preparing'].includes(order.status)
  }

  const handleReorder = () => {
    if (!order.items || order.items.length === 0) {
      alert('No items to reorder')
      return
    }

    // Clear cart first
    clearCart()

    // Add all items from order to cart
    order.items.forEach(item => {
      const itemType = order.restaurant ? 'restaurant' : 'shop'
      const restaurantOrShop = order.restaurant || order.shop
      
      if (restaurantOrShop) {
        addToCart({
          _id: item.itemId,
          name: item.name,
          nameMyanmar: item.nameMyanmar,
          price: item.price,
          image: item.image,
          quantity: item.quantity
        }, itemType, {
          _id: restaurantOrShop._id,
          name: restaurantOrShop.name,
          nameMyanmar: restaurantOrShop.nameMyanmar
        })
      }
    })

    // Navigate to cart
    navigate('/cart')
  }

  const canReorder = () => {
    return order && (order.restaurant || order.shop) && order.items && order.items.length > 0
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  if (!order) {
    return <div className="container mx-auto px-4 py-8 text-center">Order not found</div>
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      'rider-assigned': 'bg-purple-100 text-purple-800',
      'picking-up': 'bg-indigo-100 text-indigo-800',
      'picked-up': 'bg-teal-100 text-teal-800',
      delivering: 'bg-green-100 text-green-800',
      delivered: 'bg-green-200 text-green-900',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pending',
      preparing: 'Preparing',
      'rider-assigned': 'Rider Assigned',
      'picking-up': 'Picking Up',
      'picked-up': 'Picked Up',
      delivering: 'Delivering',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled'
    }
    return texts[status] || status
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order #{order.orderNumber}</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
            {canCancelOrder() && (
              <button
                onClick={handleCancelOrder}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm"
              >
                Cancel Order
              </button>
            )}
          </div>
          <span className="text-primary font-bold text-xl">{order.total} Ks</span>
        </div>

        <div className="space-y-2 mb-4">
          <p><strong>Order Type:</strong> {order.orderType === 'user-to-user' ? 'User-to-User Delivery' : (order.restaurant ? 'Restaurant' : 'Shop')}</p>
          {order.restaurant && <p><strong>Restaurant:</strong> {order.restaurant.name}</p>}
          {order.shop && <p><strong>Shop:</strong> {order.shop.name}</p>}
          <p><strong>Payment Method:</strong> {order.paymentMethod.toUpperCase()}</p>
          <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
          {order.rider && (
            <div className="flex items-center space-x-2">
              <p><strong>Rider:</strong> {order.rider.name} - {order.rider.phone}</p>
              <a
                href={`tel:${order.rider.phone}`}
                className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition text-sm"
              >
                📞 Call Rider
              </a>
            </div>
          )}
          {order.restaurant && order.restaurant.phone && (
            <div className="flex items-center space-x-2">
              <p><strong>Restaurant Phone:</strong> {order.restaurant.phone}</p>
              <a
                href={`tel:${order.restaurant.phone}`}
                className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition text-sm"
              >
                📞 Call Restaurant
              </a>
            </div>
          )}
          {order.shop && order.shop.phone && (
            <div className="flex items-center space-x-2">
              <p><strong>Shop Phone:</strong> {order.shop.phone}</p>
              <a
                href={`tel:${order.shop.phone}`}
                className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition text-sm"
              >
                📞 Call Shop
              </a>
            </div>
          )}
        </div>

        {order.orderType === 'user-to-user' && order.pickupAddress && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Pickup Address</h3>
            <p><strong>From:</strong> {order.pickupAddress.name}</p>
            <p>{order.pickupAddress.street}</p>
            <p>{order.pickupAddress.township}, {order.pickupAddress.zone}</p>
            <p>Phone: {order.pickupAddress.phone}</p>
            {order.pickupAddress.notes && <p className="text-sm text-gray-600">Notes: {order.pickupAddress.notes}</p>}
            {order.proofOfPickup && (
              <div className="mt-3">
                <p className="text-sm font-semibold mb-2">📸 Proof of Pickup:</p>
                <img
                  src={order.proofOfPickup}
                  alt="Proof of Pickup"
                  className="w-full max-w-md h-48 object-cover rounded border"
                />
              </div>
            )}
          </div>
        )}

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Delivery Address</h3>
          {order.orderType === 'user-to-user' && order.deliveryAddress?.name && (
            <p><strong>To:</strong> {order.deliveryAddress.name}</p>
          )}
          <p>{order.deliveryAddress?.street}</p>
          <p>{order.deliveryAddress?.township}, {order.deliveryAddress?.zone}</p>
          <p>Phone: {order.deliveryAddress?.phone}</p>
          {order.deliveryAddress?.notes && <p className="text-sm text-gray-600">Notes: {order.deliveryAddress.notes}</p>}
          {order.proofOfDelivery && (
            <div className="mt-3">
              <p className="text-sm font-semibold mb-2">📸 Proof of Delivery:</p>
              <img
                src={order.proofOfDelivery}
                alt="Proof of Delivery"
                className="w-full max-w-md h-48 object-cover rounded border"
              />
            </div>
          )}
        </div>
      </div>

      {order.items && order.items.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Items</h2>
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.nameMyanmar}</p>
                <p className="text-sm">Quantity: {item.quantity}</p>
              </div>
              <p className="text-primary font-bold">{item.price * item.quantity} Ks</p>
            </div>
          ))}
          {order.subtotal > 0 && (
            <div className="flex justify-between pt-4">
              <span>Subtotal</span>
              <span>{order.subtotal} Ks</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>{order.deliveryFee} Ks</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span className="text-primary">{order.total} Ks</span>
          </div>
        </div>
      )}

      {order.orderType === 'user-to-user' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Delivery Summary</h2>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span className="text-primary font-bold">{order.deliveryFee} Ks</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
            <span>Total</span>
            <span className="text-primary">{order.total} Ks</span>
          </div>
        </div>
      )}

      {order.status === 'delivered' && !order.rating && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Rate Your Order</h2>
          <div className="mb-4">
            <label className="block mb-2">Rating</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-3xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-2">Review</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full px-4 py-2 border rounded"
              rows="4"
              placeholder="Write your review..."
            />
          </div>
          <button
            onClick={handleSubmitReview}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition"
          >
            Submit Review
          </button>
        </div>
      )}

      {order.rating && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Your Review</h2>
          <div className="flex items-center mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={`text-2xl ${star <= order.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                ⭐
              </span>
            ))}
          </div>
          {order.review && <p className="text-gray-700">{order.review}</p>}
        </div>
      )}

      {canReorder() && (
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={handleReorder}
            className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition font-semibold"
          >
            🔄 Reorder This Order
          </button>
        </div>
      )}
    </div>
  )
}

