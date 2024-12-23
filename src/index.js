import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";


dotenv.config({
    path: "./.env"
})

// Data Base connection
connectDB()

.then( () => {

    app.on("error", (error) =>{
        console.log("app not able to talk to Db ERROR: ", error)
        throw error
    })

    app.listen(process.env.PORT || 3000, () => {
        console.log(`⚙️  Server is running at port : ${process.env.PORT}`)
    })

    console.log(`http://localhost:${process.env.PORT}`)


})
.catch( (err) =>{
    console.log("MONGoDb conncetion Failed !!", err);
})
