import dotenv from 'dotenv';

import express from 'express';
import connectDB from './db/conn.js';

dotenv.config({ path: './env' });

connectDB(); 