const User = require('../models/User');
const Order = require('../models/Order');
const MenuItem = require('../models/Menu')


const initializeMenu = async () => {
  const count = await MenuItem.countDocuments();
  if (count === 0) {
    const menuItems = [
      { name: "Burger", price: 12.99, category: "Main", description: "Juicy beef burger" },
      { name: "Pizza", price: 15.99, category: "Main", description: "Classic margherita pizza" },
      { name: "Pasta", price: 11.99, category: "Main", description: "Creamy alfredo pasta" },
      { name: "Salad", price: 8.99, category: "Appetizer", description: "Fresh garden salad" },
      { name: "Steak", price: 24.99, category: "Main", description: "Grilled ribeye steak" }
    ];
    
    await MenuItem.insertMany(menuItems);
    console.log('Menu items initialized');
  }
};

initializeMenu();


const getOrCreateUser = async (sessionId) => {
  let user = await User.findOne({ sessionId });
  if (!user) {
    user = new User({ sessionId });
    await user.save();
  }
  return user;
};

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    const user = await getOrCreateUser(sessionId);
    const response = await processMessage(message, user);
    
    res.json({
      response,
      sessionId
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process user messages
const processMessage = async (message, user) => {
  const input = message.toLowerCase().trim();

  if (input === 'init') {
    return "Welcome to our Restaurant! How can I help you today?\n\nPlease select an option:\n1. Place an order\n2. Checkout order\n3. See order history\n4. See current order\n5. Cancel order";
  }

  if (input === '1') {
    const menuItems = await MenuItem.find({ available: true });
    const menuText = "Here's our menu:\n\n" + 
      menuItems.map((item, index) => `${index + 1}. ${item.name} - $${item.price}`).join('\n') +
      "\n\nEnter the item number to add to your order:";
    return menuText;
  }

  if (input === '2') {
    const pendingOrder = await Order.findOne({ 
      userId: user._id, 
      status: 'pending' 
    });
    
    if (!pendingOrder || pendingOrder.items.length === 0) {
      return "Your cart is empty. Please add items first.";
    } else {
      return "Type '99' to confirm checkout:";
    }
  }

  if (input === '3') {
    const orders = await Order.find({ 
      userId: user._id, 
      status: 'completed' 
    }).sort({ createdAt: -1 });
    
    if (orders.length === 0) {
      return "No order history found.";
    } else {
      const historyText = "Your order history:\n\n" +
        orders.map((order, index) => 
          `Order ${index + 1}: ${order.items.map(item => item.name).join(', ')} - Total: $${order.totalAmount}`
        ).join('\n');
      return historyText;
    }
  }

  if (input === '4') {
    let pendingOrder = await Order.findOne({ 
      userId: user._id, 
      status: 'pending' 
    });
    
    if (!pendingOrder || pendingOrder.items.length === 0) {
      return "Your cart is empty.";
    } else {
      const orderText = "Your current order:\n\n" +
        pendingOrder.items.map(item => `${item.name} - $${item.price}`).join('\n') +
        `\n\nTotal: $${pendingOrder.totalAmount.toFixed(2)}`;
      return orderText;
    }
  }

  if (input === '5') {
    await Order.findOneAndDelete({ 
      userId: user._id, 
      status: 'pending' 
    });
    return "Your order has been cancelled.";
  }

  if (input === '99') {
    const pendingOrder = await Order.findOne({ 
      userId: user._id, 
      status: 'pending' 
    });
    
    if (pendingOrder && pendingOrder.items.length > 0) {
      pendingOrder.status = 'completed';
      await pendingOrder.save();
      return "Order placed successfully!  Thank you for your order.";
    }
    return "No items in cart to checkout.";
  }

  // Check if it's a menu item number
  const itemIndex = parseInt(input) - 1;
  const menuItems = await MenuItem.find({ available: true });
  
  if (itemIndex >= 0 && itemIndex < menuItems.length) {
    const selectedItem = menuItems[itemIndex];
    
    // Get or create pending order
    let pendingOrder = await Order.findOne({ 
      userId: user._id, 
      status: 'pending' 
    });
    
    if (!pendingOrder) {
      pendingOrder = new Order({
        userId: user._id,
        sessionId: user.sessionId,
        items: [],
        totalAmount: 0,
        status: 'pending'
      });
    }
    
    // Add item to order
    pendingOrder.items.push({
      menuItemId: selectedItem._id,
      name: selectedItem.name,
      price: selectedItem.price,
      quantity: 1
    });
    
    // Update total
    pendingOrder.totalAmount = pendingOrder.items.reduce((total, item) => 
      total + (item.price * item.quantity), 0
    );
    
    await pendingOrder.save();
    
    return `${selectedItem.name} added to your order!`;
  }

  return "Sorry, I didn't understand. Please select from the available options:\n\n1. Place an order\n2. Checkout order\n3. See order history\n4. See current order\n5. Cancel order";
};

