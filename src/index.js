import dotenv from 'dotenv';
import app from './app.js';

import express from 'express';
import connectDB from './db/conn.js';

dotenv.config({ path: './env' });

connectDB()
.then(()=>{
    app.listen(process.env.PORT ||8000,()=>{
        console.log(`Server running port${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log(err);
})