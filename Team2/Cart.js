
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
const userSchema = new mongoose.Schema({
        email: {
            type: String,
            required: true,
            unique: true
        },
        // other fields like name, password, etc., if necessary
    });


const Product = mongoose.model('Product', productSchema, 'products');
const Cart = mongoose.model('Cart', cartSchema, 'carts');
const User = mongoose.model('User', userSchema, 'users'); // Ensure the collection name is correct

async function getUserIdFromEmail(email) {
    try {
        const user = await User.findOne({ email: email }).exec();
        if (!user) {
            console.log("No user found with that email");
            return null; // Or handle as you see fit
        }
        return user._id; // Assuming _id is the field for the user ID
    } catch (error) {
        console.error("Error finding user by email:", error);
        throw error; // Rethrow or handle error as appropriate
    }
}


async function getProductPrice(productId) {
        const product = await Product.findById(productId);
        if (!product) {
            console.error("Product not found, returning price as 0");
            return 0; // Ensure a number is returned
        }
        return product.price; // Ensure this is always a number
}


async function addToCart(userId, productId, quantity) {
    if (!productId || !quantity) {
        throw new Error("ProductId and Quantity must be provided");
    }

    const cart = await Cart.findOne({ userId: userId }) || new Cart({ userId, items: [], cartSubTotal: 0 });
    const pricePerItem = await getProductPrice(productId);

    if (pricePerItem === 0) {
        throw new Error("Invalid product price, cannot add to cart");
    }

    const totalPrice = quantity * pricePerItem;
    if (isNaN(totalPrice)) {
        throw new Error("Total price calculation failed, resulting in NaN");
    }

    const itemIndex = cart.items.findIndex(item => item.productId.equals(productId));

    if (itemIndex > -1) {
        const oldTotalPrice = cart.items[itemIndex].quantity * pricePerItem;
        cart.items[itemIndex].quantity += quantity;
        const newTotalPrice = cart.items[itemIndex].quantity * pricePerItem;
        cart.cartSubTotal = cart.cartSubTotal - oldTotalPrice + newTotalPrice;
    } else {
        cart.items.push({ productId, quantity });
        cart.cartSubTotal += totalPrice;
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


async function getCart(userId) {
    console.log("Received userId:", userId);  // Log the received userId
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
    getCart,
    getUserIdFromEmail


}
