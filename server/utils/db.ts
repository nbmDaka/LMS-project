import mongoose from 'mongoose';
require('dotenv').config();

const dbUrl:string = process.env.DB_URL || '';

export async function connectDB() {
    try {
        await mongoose.connect(dbUrl).then((data:any) => {
            console.log(`Database Connected Successfully with ${data.connection.host}`);
        })
    } catch (error:any) {
        console.log(error.message);
        setTimeout(connectDB, 5000);
    }

}