import {redisClient} from "../config/redis.js"
import { Redis } from "ioredis";
import { ApiResponse } from "../utils/ApiResponse.js";
import { InternalServerError } from "../utils/ApiError.js";
class RedisService{
      redis :Redis ;

     constructor(client : Redis){
       this.redis = client
     }

     async set (key:string , data :ApiResponse<any>, ttl : number = 300){
           const jsonData = JSON.stringify(data)
        try {
          console.log("SET  : "+ data);
          
            const result  =  await this.redis.setex(key,ttl,jsonData)
            if(result!="OK") throw new InternalServerError("Error in setting cache"); 
         return result;
        } catch(e : any) {
             console.log(e.message);
        }
     }
     async get(key:string){
      try {
        const cacheData = await this.redis.get(key);
        const parsedData  : ApiResponse<any> = cacheData ? JSON.parse(cacheData) : null;
        console.log(key + " " + cacheData);
        
        return parsedData
        
      } catch (error : any) {
        console.log(error.message);
        
      }
     }
     async del(key:string){
      try {
        await this.redis.unlink(key);
       console.log("DEL : "+key);
       
      } catch (error : any) {
        console.log(error.message)
      }
     }
     async delPattern(pattern : string){
      try {
        const keys =await  this.redis.keys(pattern);
        if(keys.length){
        const result = await this.redis.unlink(keys);
        console.log("DELPATTERN : "+ pattern +" " + result);
        }
      } catch (error: any) {
        console.log(error.message);
        
      }
     }
}
   
export default  new RedisService(redisClient)