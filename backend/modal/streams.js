const mongoose =require('mongoose')

const { Schema } = mongoose;

const streamSchema=new Schema({
    name:{
        type:String,
        required:true,
    },
    room:{
        type:String,
        required:true
    },
    impressions:{
        type:Integer,
        default:0
    }
},
{
    timestamps: true 
})