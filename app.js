require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcrypt");


const app = express();

app.use(cors({
    origin: "https://react-meals-a9vf.onrender.com"
}))

app.use(express.json());

const User = require("./models/User");

mongoose.connect("mongodb+srv://tacobellcommercial:" + process.env.PASSWORD + "@cluster0.1kx4ukd.mongodb.net/");


app.post("/create-user", async (req, res)=>{
    console.log("hi")
    console.log(req.body);
    const user_found = await User.findOne({username: req.body.username})

    if (!user_found){
        const newUser = new User({
            username: req.body.username,
            password: await bcrypt.hash(req.body.password, 10),
            cart: []
        })

        await newUser.save();
        res.json({message: "User created successfully"});
        console.log("User send...");
    }else{
        res.json({message: "User already exists"});
    }
})

app.post("/login", async (req, res)=>{
    console.log("Login route");
    const username = req.body.username;
    const password = req.body.password;

    const userObject = await User.findOne({username: username});
    if (userObject && await bcrypt.compare(password, userObject.password)){
        const token = jwt.sign({userId: userObject._id, username: userObject.username}, process.env.SECRET_KEY, {expiresIn: "1h"});
        res.json({token: token, message: "Token created, logged in..."});
    }else{
        res.json({message: "Invalid credentials..."});
    }
})

function authenticateTokenAndGetUser(req, res, next){
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; /* Bearer *@DS@*aio2EUHA@Eah2 */
    if (!token){
        console.log("Unauthorized...");
        return res.sendStatus(404) /*unauthorized*/
    }else{
        jwt.verify(token, process.env.SECRET_KEY, (err, user)=>{
            if (!err){
                req.user = user;
                next();
            }else{
                return res.sendStatus(403);
            }
        })
    }
}

app.get("/get-cart", authenticateTokenAndGetUser, async (req, res)=>{
    const userId = req.user.userId;
    const userObject = await User.findOne({_id: userId})
    res.status(201).json({userCart: userObject.cart});
})

app.post("/add-item-to-cart", authenticateTokenAndGetUser, async (req, res)=>{
    const userId = req.user.userId;
    await User.updateOne({_id: userId}, {$push: {cart: req.body}});
    res.json({data: "Successfully updated..."})
})

app.post("/remove-item-from-cart", authenticateTokenAndGetUser, async (req, res)=>{
    const userId = req.user.userId;
    await User.updateOne({_id: userId}, {$pull: {cart: {id: req.body.id}}})
    res.json({data: "Successfully deleted..."})
})


app.listen(process.env.PORT, (req, res)=>{
    console.log("Listening on port 3001...");
})