// const express = require('express');
// const userRouter = require('./routes/user.routes');
// // const {body,validationResult} =  require('express-validator');
// const dotenv = require('dotenv')
// dotenv.config()
// const connectToDb = require('./config/db')
// const cookieParser = require('cookie-parser')
// connectToDb()
// const app = express();
// const indexRouter = require('./routes/index.routes')
// app.use(cookieParser())
// app.use(express.json())
// app.use(express.urlencoded({extended:true}))
// app.set('view engine','ejs');

// app.get('/',(req,res)=>{
//     res.render("index")
// })
// app.use('/',indexRouter)
// app.use('/user',userRouter)

// app.listen(3000,()=>{
//     console.log("running baby");
    
// })

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
// const connectToDb = require('./db/connect');
const connectToDb = require('./config/db')
const userRouter = require('./routes/user.routes');
const fileRouter = require('./routes/file.routes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to DB
connectToDb();

// Routes
app.use('/user', userRouter);
app.use('/files', fileRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});