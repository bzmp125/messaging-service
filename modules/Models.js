var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PushData = new Schema({
    user_id:{type:String, required:true},
    token:{type:String, require:true},
    timestamp:{type:Date, default:Date.now}
})

var SMS = new Schema({
    message:{type:String, required:true},
    to:{type:String,required:true},
    from:{type:String, default:'default'},
    message_id:{type:String,default:''},
    timestamp:{type:Date, default:Date.now},
    sent:{type:Boolean,default:false}
})

var Email = new Schema({
    text:{type:String, required:true},
    headers:{type:String},
    to:{type:String,required:true},
    from:{type:String, required:true},
    email_id:{type:String,default:''},
    timestamp:{type:Date, default:Date.now},
    sent:{type:Boolean,default:false},
    user_id:{type:String}
})

var EmailQueue = new Schema({
    content:{type:Object, required:true},
    recipients:{type:Object, required:true},
    timestamp:{type:Date, default:Date.now},
    sent:{type:Boolean, default:false}
})

module.exports = {
    SMS:mongoose.model('SMS',SMS),
    Email:mongoose.model('Email',Email),
    EmailQueue:mongoose.model('EmailQueue',EmailQueue),
    PushData:mongoose.model('PushData',PushData),
}
