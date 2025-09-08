import jwt from "jsonwebtoken"
import { prisma } from "../config/db.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../utils/ApiError.js";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../utils/AsyncHandler.js";

export class AuthService {

    private static userReturnSelectClause = {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
    }
    private static generateAccessToken(userId: string, email: string, role: string, name: string) {
        const payload = {
            userId,
            email,
            role,
            name
        }
        const secret = process.env.ACCESS_TOKEN_SECRET!
        const config = {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
        return jwt.sign(
            payload,
            secret,
            {
                expiresIn: "15m"
            }
        );
    }

    private static generateRefreshToken(userId: string, email: string, role: string) {
        return jwt.sign({
            userId,
            email,
            role,
        },
            process.env.REFRESH_TOKEN_SECRET!,
            {
                expiresIn: "7d"
            })
    }

    static async  register (email: string, password: string, name: string) {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) throw new ConflictError(`User already exixts with email ${email}`);

        const hashedPassword = bcrypt.hashSync(password, 12);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: "USER"
            },
            select: this.userReturnSelectClause
        });

        return user
    }

    static async login (email: string, password: string){
        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            throw new NotFoundError("User not found");
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new ForbiddenError("Invalid password");
        }

        // Generate new tokens
        const accessToken = this.generateAccessToken(user.id, user.email, user.role, user.name);
        const refreshToken = this.generateRefreshToken(user.id, user.email, user.role);


        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
            select: this.userReturnSelectClause
        });


        return { user: updatedUser, accessToken, refreshToken };
    }

    static async refreshAccessToken   (refreshToken: string) {
        const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as any;
        const user = await prisma.user.findUnique({
            where: {
                id: payload.userId,
            }
        })
        if (!user) throw new ForbiddenError("Session expired")
        if (user.refreshToken !== refreshToken) throw new ForbiddenError("Invalid refresh token")
        const newAccessToken = this.generateAccessToken(user.id, user.email, user.role, user.name);
        const newRefreshToken = this.generateRefreshToken(user.id, user.email, user.role);

        const updatedUser = await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                refreshToken: newRefreshToken
            },
            select: this.userReturnSelectClause
        });
        return { updatedUser, newAccessToken, newRefreshToken }
    }

    static async logout (userId: string)  {
        const updatedUser = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                refreshToken: null
            },
            select: this.userReturnSelectClause
        })
        return updatedUser
    }

    static  async getUserById  (userId: string)  {
        console.log(userId);
        
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: this.userReturnSelectClause
        })
        if (!user) throw new NotFoundError("User not found");
        return user;
    }



}