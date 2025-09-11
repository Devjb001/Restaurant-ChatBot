const mongoose = require ('mongoose')
require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI
function connectToDataBase() {

    mongoose.connect(MONGODB_URI)

    mongoose.connection.on('connected' , () => {
        console.log('Connected to Database Successfully ')
    })

     mongoose.connection.on('error' , () => {
        console.log('Failed Connecting to Database ')
    })
    
}

module.exports = {connectToDataBase}