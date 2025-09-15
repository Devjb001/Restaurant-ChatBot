
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');


const initializeMenu = async () => {
  const count = await MenuItem.countDocuments();
  if (count === 0) {
    const menuItems = [
      { name: "Burger", price: 12.99, category: "Main", description: "Juicy beef burger", available: true },
      { name: "Pizza", price: 15.99, category: "Main", description: "Classic margherita pizza", available: true },
      { name: "Pasta", price: 11.99, category: "Main", description: "Creamy alfredo pasta", available: true },
      { name: "Salad", price: 8.99, category: "Appetizer", description: "Fresh garden salad", available: true },
      { name: "Steak", price: 24.99, category: "Main", description: "Grilled ribeye steak", available: true }
    ];
    await MenuItem.insertMany(menuItems);
    console.log('Menu items initialized');
  }
};


mongoose.connection.once('open', () => {
  initializeMenu().catch(err => console.error('Menu init error:', err));
});


const getOrCreateUser = async (sessionId) => {
  let user = await User.findOne({ sessionId });
  if (!user) {
    user = new User({ sessionId });
    await user.save();
  }
  return user;
};


const processMessage = async (message, user) => {
  const raw = String(message || '').trim();
  const input = raw.toLowerCase();

  
  if (input === 'init') {
    user.chatState = 'idle';
    await user.save();
    return "Welcome to our Restaurant!, How can I help you today?\n\nPlease select an option:\n1. Place an order\n2. Checkout order\n3. See order history\n4. See current order\n5. Cancel order";
  }

 
  if (user.chatState === 'awaiting_menu_selection') {
    const itemIndex = parseInt(raw, 10) - 1;
    const menuItems = await MenuItem.find({ available: true });

    if (!isNaN(itemIndex) && itemIndex >= 0 && itemIndex < menuItems.length) {
      const selectedItem = menuItems[itemIndex];

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


      pendingOrder.items.push({
        menuItemId: selectedItem._id,
        name: selectedItem.name,
        price: selectedItem.price,
        quantity: 1
      });

      pendingOrder.totalAmount = pendingOrder.items.reduce((total, it) => total + (it.price * it.quantity), 0);
      await pendingOrder.save();

      user.chatState = 'idle';
      await user.save();

      return `${selectedItem.name} added to your order!, \n\nType '1' to add more items, '4' to see current order, '2' to checkout.`;
    } else {
     
      return "Invalid selection. Enter a valid item number from the menu, or type '0' to cancel.";
    }
  }


  if (input === '1') {
    const menuItems = await MenuItem.find({ available: true });
    if (menuItems.length === 0) return "No menu items available right now.";

    const menuText = "Here's our menu:\n\n" +
      menuItems.map((item, index) => `${index + 1}. ${item.name} - $${item.price.toFixed(2)}`).join('\n') +
      "\n\nEnter the item number to add to your order:";

    user.chatState = 'awaiting_menu_selection';
    await user.save();
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

  if (input === '99') {
    const pendingOrder = await Order.findOne({
      userId: user._id,
      status: 'pending'
    });

    if (pendingOrder && pendingOrder.items.length > 0) {
      pendingOrder.status = 'completed';
      await pendingOrder.save();
      return "Order placed successfully! 🎉 Thank you for your order.";
    }
    return "No items in cart to checkout.";
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
          `Order ${index + 1}: ${order.items.map(item => item.name).join(', ')} - Total: $${(order.totalAmount || 0).toFixed(2)}`
        ).join('\n\n');
      return historyText;
    }
  }

  if (input === '4') {
    const pendingOrder = await Order.findOne({
      userId: user._id,
      status: 'pending'
    });

    if (!pendingOrder || pendingOrder.items.length === 0) {
      return "Your cart is empty.";
    } else {
      const orderText = "Your current order:\n\n" +
        pendingOrder.items.map(item => `${item.name} - $${item.price.toFixed(2)} x${item.quantity}`).join('\n') +
        `\n\nTotal: $${(pendingOrder.totalAmount || 0).toFixed(2)}`;
      return orderText;
    }
  }

  if (input === '5' || input === '0') {
    await Order.findOneAndDelete({
      userId: user._id,
      status: 'pending'
    });
    user.chatState = 'idle';
    await user.save();
    return "Your order has been cancelled.";
  }

  return "Sorry, I didn't understand. Please select from the available options:\n\n1. Place an order\n2. Checkout order\n3. See order history\n4. See current order\n5. Cancel order";
};


const handleChat = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    const user = await getOrCreateUser(sessionId);
    const response = await processMessage(message, user);

 
    res.json({
      response,
      sessionId: user.sessionId
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  handleChat
};
