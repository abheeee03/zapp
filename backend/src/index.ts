import express from 'express'
import { userRouter } from './routes/userRouter'
import { linkRouter } from './routes/linkRouter';

const app = express()

app.use('/api/user', userRouter);
app.use('/api/link', linkRouter)

app.listen(8080, ()=>{
    console.log("starting server at 8080");
    
})