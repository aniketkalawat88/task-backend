

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();


const app = express();
app.use(bodyParser.json());
app.use(cors());


// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Order Schema and Model
const orderSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Success', 'Failed'], default: 'Pending' },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

// Routes

// 1. Create a new order
app.post('/api/payment/checkout-session', async (req, res) => {
  const { email, cartItems } = req.body;

  if (!email || !cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: 'Email and cart items are required' });
  }

  // Calculate the total amount
  const amount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  try {
    // Create the order in the database
    const order = new Order({
      email,
      items: cartItems,
      amount,
      status: 'Pending',
    });
    await order.save();

    // Simulate a payment response (success or failure)
    const paymentSuccess = Math.random() > 0.2; // 80% chance of success

    if (paymentSuccess) {
      order.status = 'Success';
      await order.save();
      return res.status(200).json({ message: 'Payment successful', order });
    } else {
      order.status = 'Failed';
      await order.save();
      return res.status(400).json({ message: 'Payment failed', order });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Fetch all orders (Admin functionality)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Fetch a single order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


