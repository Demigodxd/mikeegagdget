import {readdir,rm,mkdir,cp} from 'node:fs/promises';
import {join} from 'node:path';
// Ship only public assets and pages; source, tests and credentials stay out of dist.
await rm('dist',{recursive:true,force:true});await mkdir('dist');
const runtimeDirectories=new Set(['assets','images','commerce','easy-buy']);
for(const entry of await readdir('.',{withFileTypes:true})){
 if(entry.isDirectory()){
  if(runtimeDirectories.has(entry.name))await cp(entry.name,join('dist',entry.name),{recursive:true});
  else if(!['dist','node_modules'].includes(entry.name)&&!entry.name.startsWith('.')){
   const copyPages=async(dir)=>{for(const child of await readdir(dir,{withFileTypes:true})){const path=join(dir,child.name);if(child.isDirectory())await copyPages(path);else if(child.name.endsWith('.html')){await mkdir(join('dist',dir),{recursive:true});await cp(path,join('dist',path));}}};
   await copyPages(entry.name);
  }
 }else if(/\.(html|css|js|svg|xml|txt)$/.test(entry.name)||entry.name==='_redirects')await cp(entry.name,join('dist',entry.name));
}
console.log('Packaged static storefront in dist');
