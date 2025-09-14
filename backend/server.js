const express = require('express')
const { connectToDataBase } = require('./config/db')
const cors = require('cors');
require('dotenv').config()


const app = express()
const PORT = process.env.PORT


// Middleware
app.use(express.json());
app.use(cors());
connectToDataBase()

app.get('/' , (req,res)=> {
    res.status(200).json({
        message : 'welcome to home page'
    })
    console.log('welcome to home page')
})
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(process.env.PORT, ()=>{
    console.log(`app is listening on http://localhost:${PORT}`)
    console.log(`MONGO URL :`, process.env.MONGODB_URI)
})