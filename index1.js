import express from "express";
import { db } from "./db_connect.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import "dotenv/config";
import multer from "multer";
import path from "path"

// console.log(process.env.JWT_SECRET)

let data = [
    {
        name: "Sagar",
        age: 21,
        course: "Web_Dev",
        mobile: 9874563210,
        roll_no: 5698
    },
    {
        name: "Nitin",
        age: 22,
        course: "Cift",
        mobile: 9874563211,
        roll_no: 5478
    }
];

let app = express();
let port = 5000;



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, "./uploads")
    },
    filename: function (req, file, cb) {
        return cb(null, `${Date.now()} - ${file.originalname}`)
    }
})


const uploads = multer({ storage })




app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));   // ← add this
const authenticateAdmin = (req, res, next) => {

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                message: "Token required"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token required"
            });
        }


        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.admin = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });

    }
};



app.get("/", (req, res) => {
    res.send("App is Running");
});



app.post("/signup", async (req, res) => {

    try {

        const { name, email, password, mobile } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const [existingAdmin] = await db.execute(
            "SELECT id FROM admins_details WHERE email = ?",
            [email]
        );

        if (existingAdmin.length > 0) {
            return res.status(409).json({
                message: "Admin with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            `INSERT INTO admins_details
            (name, email, password, mobile)
            VALUES (?, ?, ?, ?)`,
            [name, email, hashedPassword, mobile]
        );

        res.status(201).json({
            message: "Admin signup successful",
            admin_id: result.insertId
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });

    }

});




app.post("/admin/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const [admins] = await db.execute(
            "SELECT * FROM admins_details WHERE email = ?",
            [email]
        );

        if (admins.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const admin = admins[0];

        const isPasswordCorrect = await bcrypt.compare(
            password,
            admin.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: "1h" });


        res.status(200).json({
            success: true,
            message: "Login successful",
            token: token
        });

    } catch (error) {

        console.log("Login Error");

        res.status(500).json({
            message: "Internal server error"
        });

    }

});






app.post("/addUser", authenticateAdmin, uploads.single("user_photo"), async (req, res) => {

    try {

        // 1. Get form data
        const { name, age, course, mobile, roll_no } = req.body;

        // 2. Check required fields
        if (!name || !age || !course || !mobile || !roll_no) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // 3. Check student photo
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a student photo"
            });
        }

        // 4. Validate age
        if (!Number.isInteger(Number(age)) || Number(age) < 1 || Number(age) > 120) {
            return res.status(400).json({
                success: false,
                message: "Age must be a number between 1 and 120"
            });
        }

        // 5. Prepare student data
        const newUser = {
            name: name.trim(),
            age: Number(age),
            course: course.trim(),
            mobile: mobile.trim(),
            roll_no: roll_no.trim(),
            photo: req.file.filename
        };

        // 6. Insert student into database
        const [result] = await db.query(
            `INSERT INTO student_details
            (name, age, course, mobile, roll_no, photo)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                newUser.name,
                newUser.age,
                newUser.course,
                newUser.mobile,
                newUser.roll_no,
                newUser.photo
            ]
        );

        // 7. Send success response
        return res.status(201).json({
            success: true,
            message: "Student added successfully",
            data: {
                id: result.insertId,
                ...newUser
            }
        });

    } catch (error) {

        console.log("ADD USER ERROR:", error);

        // 8. Handle duplicate values
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "This roll number or another unique value already exists"
            });
        }

        // 9. Handle other errors
        return res.status(500).json({
            success: false,
            message: "Something went wrong while adding the student"
        });

    }

});




app.get("/users", authenticateAdmin, async (req, res) => {

    try {

        let [all_record] = await db.execute(
            "SELECT * FROM student_details"
        );
        console.log(all_record)
        res.json(all_record);

    } catch (error) {

        res.status(500).json({
            
            message: "Error fetching students",
            error: error.message
        });

    }

});



app.delete("/delete/:roll_no", authenticateAdmin, async (req, res) => {

    try {

        let roll_no = Number(req.params.roll_no);

        console.log("Roll No:", roll_no);

        let [result] = await db.execute(
            "DELETE FROM student_details WHERE roll_no = ?",
            [roll_no]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send("User Not Found");
        }

        let find_index = data.findIndex(
            (user) => user.roll_no === roll_no
        );

        if (find_index !== -1) {
            data.splice(find_index, 1);
        }

        let [all_record] = await db.execute(
            "SELECT * FROM student_details"
        );

        res.json({
            success: true,
            message: "User Deleted Successfully",
            users: all_record
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Error deleting user",
            error: error.message
        });

    }

});



app.patch("/edit/:roll", uploads.single("user_photo"), authenticateAdmin, async (req, res) => {

    try {

        let newUser = {
            name: req.body.name,
            age: req.body.age,
            course: req.body.course,
            mobile: req.body.mobile,
            roll_no: req.body.roll_no,
            photo:req.file.filename
        };

        let [result] = await db.execute(
            `UPDATE student_details
             SET name = ?, age = ?, course = ?, mobile = ?, roll_no = ?,photo = ?
             WHERE roll_no = ?`,
            [
                newUser.name,
                newUser.age,
                newUser.course,
                newUser.mobile,
                newUser.roll_no,
                newUser.photo,
                req.params.roll
            ]
        );

        res.json({
            success: true,
            message: "Student updated successfully",
            result: result
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Error updating student",
            error: error.message
        });

    }

});



if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;