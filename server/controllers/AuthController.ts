import { Request, Response } from "express"
import User from '../models/User.js'
import bcrypt from "bcrypt"

// Controllers for user registration
export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }

        // find user by email
        const user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: "User already exists" })
        }

        // Encrypt the password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        console.log("Password received:", !!password);
        console.log("Hashed password length:", hashedPassword.length);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        })

        console.log("Newly created user:", JSON.stringify(newUser.toObject()));

        // setting user data in session
        req.session.isLoggedIn = true;
        req.session.userId = newUser._id.toString();

        return res.status(201).json({
            message: 'Account created successfully',
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        })

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}


// Controller for User Login
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // find user by email with password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" })
        }

        // check password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password as string
        )

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid email or password' })
        }

        // setting user data in session
        req.session.isLoggedIn = true;
        req.session.userId = user._id.toString();

        return res.json({
            message: 'Login successful',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        })

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}


// Controller for user logout
export const logoutUser = async (req: Request, res: Response) => {
    req.session.destroy((error: any) => {
        if (error) {
            console.log(error)
            return res.status(500).json({ message: error.message })
        }
        return res.json({ message: "Logout successful" })
    })
}


// Controller for user verify
export const verifyUser = async (req: Request, res: Response) => {
    try {

        const { userId } = req.session;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }

        const user = await User.findById(userId).select('-password')

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        return res.json({ user });

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}