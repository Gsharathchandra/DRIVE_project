const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username : {
        type :String,
        required : true,
        trim : true,
        lowercase:true,
        unique : true,
        minlength:[3,"name should be at least 3 charecters long"]
    },
    email : {
        type :String,
        required : true,
        trim : true,
        lowercase:true,
        unique : true,
        minlength:[13," email should be at least 13 charecters long"]
    },
    password : {
        type :String,
        required : true,
        trim : true,
        minlength:[5,"password should be at least 5 charecters long"]
    }
    
})

const user = mongoose.model('user',userSchema)
module.exports = user;