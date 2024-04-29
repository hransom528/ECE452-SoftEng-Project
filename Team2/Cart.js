
//Stages changes: git add . or git add <file>
//git restore <file> doesn't save 
//git commit -m 'comment of what we'
//git push origin main
//git pull
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getUserInfo } = require('../Team1/Reg_lgn/oAuthHandler');


//speficiatation of connection details for MongoDatabse
const MONGO_URI = 'mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/website?retryWrites=true&w=majority&appName=Cluster0';


mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => console.error('Connection error', err));
// thi is a change

const cartItemSchema = new mongoose.Schema({

//cart
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
        required: true
    },


    quantity: {
        type: Number,
        required: true,
        min: 1 // Ensure that at least one item must be ordered
    },

    });

const cartSchema = new mongoose.Schema({
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'Users', // Assuming you have a User model
            required: true,
            unique: true // Each cart is linked to a unique user
        },
        items: [cartItemSchema], // Array of cart items - Note the comma here
        cartSubTotal: {
            type: Number,
            required: true,
            default: 0
        }
    });

// this is a change here
const productSchema = new mongoose.Schema({
    price: Number, // Price field
        // Other fields like description, category, etc.
    });

const Product = mongoose.model('Product', productSchema, 'products');
const Cart = mongoose.model('Cart', cartSchema, 'carts');

async function getProductPrice(productId) {
        const product = await Product.findById(productId);
        if (!product) {
            return 0; // Ensure a number is returned
        }
        return product.price; // Ensure this is always a number
}

// Helper function to retrieve user from token
async function getUserFromToken(token) {
    const user = await getUserInfo(token);  // Implement this according to your token structure
    if (!user) throw new Error("Authentication failed: User not found");
    return user;
}

async function addToCart(token, productId, quantity) {
    const user = await getUserFromToken(token);
    if (!user) {
        return { error: "User not found. Please log in before adding to the watchlist." };
    }

    const userId = user._id; 

    const cart = await Cart.findOne({ userId: userId }) || new Cart({ userId, items: [], cartSubTotal: 0 });

    // Assuming you have a function to get the price of a product
    const pricePerItem = await getProductPrice(productId);
    const totalPrice = quantity * pricePerItem;

    const itemIndex = cart.items.findIndex(item => item.productId.equals(productId));

    if (itemIndex > -1) {
        // Calculate the old total price for this item
        const oldTotalPrice = cart.items[itemIndex].quantity * pricePerItem;

        // Update quantity for existing item
        cart.items[itemIndex].quantity += quantity;

        // Calculate the new total price for this item
        const newTotalPrice = cart.items[itemIndex].quantity * pricePerItem;

        // Update the cart subtotal by removing the old total and adding the new total
        cart.cartSubTotal = cart.cartSubTotal - oldTotalPrice + newTotalPrice;
    } else {
        // Add new item
        cart.items.push({ productId, quantity });
        // Update subtotal
        cart.cartSubTotal += totalPrice;
    }

    await cart.save();
    return cart;
}

async function removeFromCart(token, productId, quantityToRemove) {
    const user = await getUserFromToken(token);
    const userId = user._id;
    const cart = await Cart.findOne({ userId: userId });
    
    if (!cart) throw new Error("Cart not found");
    
        const itemIndex = cart.items.findIndex(item => item.productId.equals(productId));
    
        if (itemIndex > -1) {
            const item = cart.items[itemIndex];
            const pricePerItem = await getProductPrice(productId);
            const totalPrice = quantityToRemove * pricePerItem;
    
            if (quantityToRemove >= item.quantity) {
                // Remove the item if quantity to remove is greater or equal
                cart.cartSubTotal -= item.quantity * pricePerItem; // Decrease subtotal
                cart.items.splice(itemIndex, 1);
            } else {
                // Decrease quantity
                cart.items[itemIndex].quantity -= quantityToRemove;
                cart.cartSubTotal -= totalPrice; // Decrease subtotal
            }
    
            await cart.save();
            return cart;
        } else {
            throw new Error("Item not found in cart");
        }
    }

async function getCart(token) {
    const user = await getUserFromToken(token);
    const userId = user._id;
    // Log the received userId
    try {
                // Convert userId from string to ObjectId
        const userIdAsObjectId = new mongoose.Types.ObjectId(userId);
        const cartDetails = await Cart.findOne({ userId: userIdAsObjectId });
    
    
        if (!cartDetails) {
                    throw new Error("Cart not found");
        }
        return cartDetails;
    
    
        } catch (error) {
            console.error("Error retrieving cart:", error);
                // Provide a more specific error message if the ObjectId conversion fails
            if (error instanceof mongoose.Error.CastError) {
                    throw new Error("Invalid UserId format");
                }
                throw new Error("Internal Server Error");
        }
    }
    
module.exports = {
    addToCart,
    removeFromCart,
    getCart

}
