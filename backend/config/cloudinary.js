import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dkibvmi0o',
    api_key:    process.env.CLOUDINARY_API_KEY || '413957754457226',  
    api_secret: process.env.CLOUDINARY_API_SECRET || 'hGvcWHLtqOs_HJH1lmKkW0RH_Qc'
});

export default cloudinary;