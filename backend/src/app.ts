import express from "express";
import cors from "cors";
import helmet from "helmet"
import morgan from "morgan"
import { errorMiddleware, notFound } from "./middleware/Error.middleware.js";
import authRouter from "./routes/auth.routes.js"
import cookieParser from "cookie-parser"
import matchingRoutes from './routes/matching.routes.js';
import resumeRouter from './routes/resume.routes.js';
import jobRoutes from './routes/job.routes.js';

const app = express();

app.set('trust proxy', 1);
app.use(cookieParser())
app.use(express.json({limit : '10mb'}));
app.use(express.urlencoded({extended : true , limit : '10mb'}))
app.use(helmet());
app.use(cors());
// app.use(morgan('combined'));



app.use("/api/auth",authRouter)
app.use('/api/resumes', resumeRouter);
app.use('/api/jobs', jobRoutes);
app.use('/api/matches', matchingRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',  
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    })
})

app.use(notFound);
app.use(errorMiddleware);

export default app; 