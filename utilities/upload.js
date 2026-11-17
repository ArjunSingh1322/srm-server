
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { configDotenv } from "dotenv";
import { CloudinaryStorage } from "multer-storage-cloudinary-v2";



configDotenv()
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const storage = new CloudinaryStorage({
    cloudinary, params: {
        folder: 'student-avatar', format: async (req, file) => {

            let file_array = file.originalname.split(".")
            let extention = file_array[file_array.length - 1]
            return extention
        }
    }
})


const uploads = multer({
    storage,
    fileFilter: (req, file, cb) => {

        let allowedExt = ["jpg", "jpeg", "png"];

        let extention = file.originalname.split(".").pop().toLowerCase()
        if (!allowedExt.includes(extention)) {
            return cb(new Error("Only JPG, JPEG and PNG files are allowed!"));
        }

        cb(null, true);
    }
})


export default uploads;
