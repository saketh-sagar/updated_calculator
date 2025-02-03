const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    calculations:[String]
})
module.exports = mongoose.model('History',Schema)