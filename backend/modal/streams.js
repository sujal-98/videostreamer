const mongoose =require('mongoose')

const { Schema } = mongoose;

const streamSchema=new Schema({
    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    room:{
        type:String,
        required:true
    },
    impressions:{
        type:Number,
        default:0
    },
    likes:{
        type:Number,
        default:0
    },
    dislikes:{
        type:Number,
        default:0
    }
},
{
    timestamps: true 
})


module.exports = mongoose.model('Stream', streamSchema);
