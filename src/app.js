import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app =express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"300kb"}))
app.use(express.urlencoded({extended:true,limit:"300kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// Routes import
import userRouter from './routes/user.routes.js'
import postRouter from './routes/post.routes.js'

// Routes Declaration
app.use("/api/v1/users",userRouter)
app.use("/api/v1/posts",postRouter)

app.get("/",(req,res)=>{
    res.json({
        success:true,
        message:"Welcome to the backend of the social media application"
    })
})

export default app