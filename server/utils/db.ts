import mongoose = require('mongoose');
require('dotenv').config();


const dbUrl:string = process.env.DB_URL;
const connectDB = async () => {
    try {
        await mongoose.connect(dbUrl, {
        } as mongoose.ConnectOptions).then((data:any) => {
            console.log(`Database connected with: ${data.connection.host}`);
        })
    } catch (error) {
        console.error(error);
        setTimeout(connectDB, 5000)
    }
}
export default connectDB;