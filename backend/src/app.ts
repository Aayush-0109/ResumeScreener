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
import { authMiddleware } from "./middleware/auth.middleware.js";
import { correlationMiddleware } from "./middleware/corelation.middleware.js";
import { requestLogger } from "./middleware/logging.middleware.js";

const app = express();

app.set('trust proxy', 1);
app.use(cookieParser())
app.use(express.json({limit : '10mb'}));
app.use(express.urlencoded({extended : true , limit : '10mb'}))
app.use(helmet());

const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-correlation-id']
}));

app.use(correlationMiddleware);
app.use(requestLogger);


  
app.use("/api/auth",authRouter)
app.use('/api/resumes', authMiddleware,resumeRouter);
app.use('/api/jobs',authMiddleware,jobRoutes);
app.use('/api/matches', authMiddleware, matchingRoutes);

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