const http = require('http');

function req(method, path, body){
  return new Promise((res, rej)=>{
    const opts = { method, hostname: '127.0.0.1', port: 4000, path, headers: { 'Content-Type': 'application/json' } };
    const r = http.request(opts, resp => {
      let data = '';
      resp.on('data', c => data += c);
      resp.on('end', () => res({ status: resp.statusCode, body: data }));
    });
    r.on('error', e => rej(e));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

(async ()=>{
  try{
    console.log('GET /api/internships');
    console.log(await req('GET','/api/internships'));

    console.log('POST /api/auth/signup');
    const signup = await req('POST','/api/auth/signup',{ email:'smoke-test@example.com', password:'Test1234!', name:'Smoke Test', role:'student' });
    console.log('signup:', signup);
    const token = signup.body ? JSON.parse(signup.body).token : null;
    console.log('token length:', token ? token.length : 'none');

    if (token){
      console.log('GET /api/auth/me');
      const me = await req('GET','/api/auth/me');
      console.log('me:', me);
    }
  }catch(e){
    console.error('smoke error', e.message || e);
  }
})();
