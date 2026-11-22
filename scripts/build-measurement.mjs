import {build} from 'esbuild';
await build({entryPoints:['assets/site-measurement.mjs'],outfile:'assets/site-measurement.js',bundle:true,minify:true,platform:'browser',format:'esm',target:['es2020'],define:{'process.env.NODE_ENV':'"production"','process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG':JSON.stringify(process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG||'')}});
console.log('Built privacy-conscious site and speed measurement');
