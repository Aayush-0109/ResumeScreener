
import dotenv from "dotenv"
import app from "./app.js";
import { connectDB } from "./config/db.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

connectDB().then(
()=>{
app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    })
}
).catch((err)=>{
    console.log(err);
    process.exit(1);
})
