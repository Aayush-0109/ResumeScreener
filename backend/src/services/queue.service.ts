// import {prisma} from "../config/db.js"
// import { QueueJobOptions } from "../types/queue.types.js"
// import redisService from "./redis.service.js"

// class QueueService {
//     async enqueueJob(jobId: string ,userId : string , options : QueueJobOptions={}):Promise<string>{
//         const resumeCount = await prisma.resume.count({
//             where : {userId,parseStatus : 'DONE'}
//         });
       
//     const queueJob = await prisma.jobQueue.create({
//         data : {
//             jobId,
//             userId,
//             topN : options.topN,
//             weights : options.weights,
//             insightTopK : options.insightsTopK ||5,
//             totalResumes : resumeCount,
//             status : 'PENDING'
//         }
//     });

    

//     }
// }