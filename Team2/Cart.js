
//Stages changes: git add . or git add <file>
//git restore <file> doesn't save 
//git commit -m 'comment of what we'
//git push origin main
//git pull
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//fuxk this 
//speficiatation of connection details for MongoDatabse
const MONGO_URI = 'mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/website?retryWrites=true&w=majority&appName=Cluster0';


mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => console.error('Connection error', err));


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


const productSchema = new mongoose.Schema({
    price: Number, // Price field
        // Other fields like description, category, etc.
    });

const Product = mongoose.model('Product', productSchema, 'products');
const Cart = mongoose.model('Cart', cartSchema, 'carts');

async function getProductPrice(productId) {
    const product = await Product.findById(productId); // Use the Product model to find the product by ID
    
    // Check if the product was found
    if (!product) {
        // Return a default price if the product is not found
        const defaultPrice = 0; // Set your desired default price here
        return defaultPrice;
    }

    // Return the price field of the product if found
    return product.price;
}


async function addToCart(userId, productId, quantity) {
    const cart = await Cart.findOne({ userId: userId }) || new Cart({ userId, items: [], cartSubTotal: 0 });

    // Assuming you have a function to get the price of a product
    const pricePerItem = await getProductPrice(productId);
    const totalPrice = quantity * pricePerItem;

    const itemIndex = cart.items.findIndex(item => item.productId.equals(productId));

    if (itemIndex > -1) {
        // Update quantity for existing item
        cart.items[itemIndex].quantity += quantity;
        cart.cartSubTotal += totalPrice; // Update subtotal
    } else {
        // Add new item
        cart.items.push({ productId, quantity });
        cart.cartSubTotal += totalPrice; // Update subtotal
    }

    await cart.save();
    return cart;
}

async function removeFromCart(userId, productId, quantityToRemove) {
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

async function getCartDetails(userId) {
    if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
    }

    const cart = await Cart.findOne({ userId }).populate('items.productId').exec();

    if (!cart) {
        throw new Error("Cart not found");
    }

   
    return cart;
}

module.exports = {
    addToCart,
    removeFromCart,
    getCartDetails


}
