// List Firebase Auth users using the local serviceAccount.json
// Usage: node tools/listFirebaseUsers.js

const admin = require('firebase-admin')
const path = require('path')

const svcPath = path.resolve(__dirname, '..', 'serviceAccount.json')
try{
  const serviceAccount = require(svcPath)
  // Guard against duplicate initialization in environments where an app
  // may already have been initialized by another module.
  if (!admin.apps || !admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  } else {
    // reuse existing app
  }
} catch (e){
  console.error('Failed to initialize firebase-admin. Ensure serviceAccount.json exists at backend/serviceAccount.json')
  console.error(e.message)
  process.exit(1)
}

async function listAllUsers(nextPageToken) {
  // List batch of users, 1000 at a time.
  try{
    const result = await admin.auth().listUsers(1000, nextPageToken)
    result.users.forEach(userRecord => {
      console.log(`${userRecord.uid} | ${userRecord.email} | emailVerified=${userRecord.emailVerified}`)
    })
    if (result.pageToken) {
      await listAllUsers(result.pageToken)
    }
  }catch(e){
    console.error('Error listing users:', e.message)
  }
}

listAllUsers().then(()=> process.exit(0))
