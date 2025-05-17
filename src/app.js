import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import { handleError } from "./middlewares/handleError.middleware.js"


const app = express()

app.use(cors({
  origin:['http://localhost:3000', "http://192.168.1.69:3000", "https://scrap-dai-admin.vercel.app" ],
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
import adminRouter from "./routes/admin.routes.js"
import collectorRouter from "./routes/collector.routes.js"
import scrapRouter from "./routes/scrap.routes.js"
import categoryRouter from "./routes/category.routes.js"
import orderRouter from "./routes/order.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"


import analyticsRoutes from "./routes/analytics.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import feedbackRouter from "./routes/feedback.routes.js";
import promotionRouter from "./routes/promotion.routes.js";

// print all request hit to server

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`)
  next()
})

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/user", userRouter)
app.use("/api/v1/admin", adminRouter)
app.use("/api/v1/collector", collectorRouter)
app.use("/api/v1/scrap", scrapRouter)
app.use("/api/v1/category", categoryRouter)
app.use("/api/v1/order", orderRouter)
app.use("/api/v1/dashboard", dashboardRouter)


app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/notification", notificationRouter)
app.use("/api/v1/feedback", feedbackRouter)
app.use("/api/v1/promotion", promotionRouter)


// TaskScheduler();



// handle error
app.use(handleError)

export default app 
