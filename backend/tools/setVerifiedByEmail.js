// Set a Firebase user's emailVerified flag via Admin SDK (for dev only).
// Usage: node tools/setVerifiedByEmail.js user@example.com

const admin = require('firebase-admin')
const path = require('path')

const email = process.argv[2]
if (!email){ console.error('Usage: node tools/setVerifiedByEmail.js user@example.com'); process.exit(1) }

const svcPath = path.resolve(__dirname, '..', 'serviceAccount.json')
try{
  const serviceAccount = require(svcPath)
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
} catch (e){
  console.error('Failed to initialize firebase-admin. Ensure serviceAccount.json exists at backend/serviceAccount.json')
  console.error(e.message)
  process.exit(1)
}

async function run(){
  try{
    const user = await admin.auth().getUserByEmail(email)
    await admin.auth().updateUser(user.uid, { emailVerified: true })
    console.log(`Set emailVerified=true for ${email}`)
  }catch(e){
    console.error('Failed:', e.message)
  }
}

run().then(()=>process.exit(0))
