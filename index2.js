// import jwt from "jsonwebtoken";
// import bcrypt from "bcryptjs";


// let token = jwt.sign({id:"123456",email:"arjun@gmail.com"} , "oojandaejagdeep1322",{expiresIn:"10s"})

// console.log(token);


// let token2 = jwt.sign( {id:"12345",name:"Sagar"} , "secret key" , {expiresIn:"1h"})
// console.log(token2);


// let password = "Sagar@9865"
// let hashed_pass = await bcrypt.hash(password,10)
// console.log(hashed_pass);

// let compair =  await bcrypt.compare("sagar@9865" , hashed_pass)
// console.log(compair);




import express from "express"

const app = express();


app.use((req, res, next)=>{
 console.log("Middleware is running");
     next();

});

app.get("/", (req, res) => {
    res.send("Hello from server");
});

app.listen(5000);