import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import { handleError } from "./middlewares/handleError.middleware.js"


const app = express()

app.use(cors({
  origin:['http://localhost:3000'],
  credentials: true
}))



app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())



// Router import 
import healthcheckRouter from "./routes/healthcheck.routes.js"
import userRouter from "./routes/user.routes.js"
import TaskScheduler from "./utils/TaskScheduler.js"




//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/user", userRouter)


TaskScheduler();



// handle error
app.use(handleError)

export default app 
