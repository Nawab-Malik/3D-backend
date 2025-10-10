// Add this to your existing routes file or create a temporary one
// routes/testorder.js
const express = require('express');
const router = express.Router();

// Test order endpoint
router.post('/create', (req, res) => {
  console.log('Order creation request received:', req.body);
  
  // Simulate successful order creation
  res.status(201).json({
    success: true,
    message: 'Order created successfully (test)',
    order: {
      _id: 'test_order_id_123',
      user: 'test_user_id',
      items: req.body.items || [],
      total: 100,
      status: 'pending',
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      createdAt: new Date()
    }
  });
});

module.exports = router;