const http = require('http');

http.get('http://localhost:3000/dashboard', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTTP Status /dashboard:', res.statusCode);
    const cssMatches = data.match(/href="(\/_next\/static\/css\/[^"]+\.css)"/g);
    console.log('CSS Link Tags Found:', cssMatches);

    if (cssMatches && cssMatches.length > 0) {
      const match = cssMatches[0].replace('href="', '').replace('"', '');
      const cssUrl = 'http://localhost:3000' + match;
      http.get(cssUrl, (cssRes) => {
        let cssData = '';
        cssRes.on('data', chunk => cssData += chunk);
        cssRes.on('end', () => {
          console.log('CSS URL:', cssUrl);
          console.log('CSS HTTP Status:', cssRes.statusCode);
          console.log('CSS Content-Type:', cssRes.headers['content-type']);
          console.log('CSS Size in Bytes:', cssData.length);
          console.log('Contains bg-indigo-600:', cssData.includes('bg-indigo-600'));
          console.log('Contains bg-slate-900:', cssData.includes('bg-slate-900'));
          console.log('Contains text-white:', cssData.includes('text-white'));
          console.log('Contains rounded-2xl:', cssData.includes('rounded-2xl'));
          console.log('Contains flex / grid:', cssData.includes('.flex') && cssData.includes('.grid'));
        });
      });
    } else {
      console.log('Next.js dev mode uses Webpack Fast Refresh runtime CSS injection');
    }
  });
}).on('error', (err) => {
  console.error('Request failed:', err.message);
});
