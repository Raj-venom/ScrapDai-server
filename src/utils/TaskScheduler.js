import corn from "node-cron"
import { autoDeleteUsers } from "../controllers/user.controller.js"


const TaskScheduler = () => {

    corn.schedule("* * * * *", async () => {
        console.log("Running a task every minute");
        try {
            autoDeleteUsers()

        } catch (error) {
            console.log("Error in TaskScheduler", error)
        }
    })

    console.log("TaskScheduler started")

}

export default TaskScheduler;