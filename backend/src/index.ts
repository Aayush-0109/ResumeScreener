
import dotenv from "dotenv"
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { redisClient } from "./config/redis.js";
import { validateEnv } from "./config/env.js";
import { validateConnections } from "./config/health.js";

dotenv.config();


const startServer = async() =>{
    const env = validateEnv();
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    await connectDB();
    await redisClient.connect();
    await validateConnections(env);

    app.listen(env.PORT , ()=>{
        console.log(`🚀 Server running on port ${env.PORT}`);
    })
}

startServer().catch((err: Error) => {
    console.error('💥 Startup failed:', err.message);
    process.exit(1);
  });