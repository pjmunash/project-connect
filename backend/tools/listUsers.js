// Simple script to list users in the configured MongoDB for debugging
// Run from the repo root or backend folder:
// node backend/tools/listUsers.js

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const User = require('../src/models/User')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/innterbridge-dev'

async function main(){
  try{
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    console.log('Connected to MongoDB (for listUsers)')
    const count = await User.countDocuments()
    console.log('User count:', count)
    const users = await User.find().limit(50).select('email role verified createdAt').lean()
    console.log('Sample users:')
    users.forEach(u=> console.log(u))
    await mongoose.disconnect()
  }catch(e){
    console.error('Error listing users:', e && e.message || e)
    process.exit(1)
  }
}

main()
