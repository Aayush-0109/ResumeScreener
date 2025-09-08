import multer from "multer";
import { ValidationError } from "../utils/ApiError.js";

const MAX_FILE_SIZE = 10*1024*1024;
const MAX_FILES = 10;
const allowedMime = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
])
const storage = multer.memoryStorage();
const fileFilter:multer.Options['fileFilter'] = (_req,file,cb)=>{
    if(!allowedMime.has(file.mimetype)){
        return cb(new ValidationError("Only PDF, DOC, DOCX are allowed"))
    }
    else return cb(null , true);
}
export const uploadMultipleResumes = multer({
    storage,
    limits : {fieldSize : MAX_FILE_SIZE , files : MAX_FILES},
    fileFilter
}).array('files',MAX_FILES);