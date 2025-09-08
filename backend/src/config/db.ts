import {PrismaClient} from "@prisma/client"

export const prisma = new PrismaClient();
export const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("Connected to database");
    } catch (error) {
        console.log("Error in connecting to database", error);
        process.exit(1);
    }
}