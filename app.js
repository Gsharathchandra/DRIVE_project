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

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectToDb = require('./config/db');
const authRouter = require('./routes/auth.routes');
const fileRouter = require('./routes/file.routes');


const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'html');

// Database connection
connectToDb();

// Routes
app.use('/auth', authRouter);
app.use('/files', fileRouter);

// Views
app.get('/', (req, res) => res.render('home'));
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});