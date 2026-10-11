import {storeItems} from '../commerce/storefront-data.mjs';
import {productImages} from '../commerce/product-images.mjs';
import {existsSync,writeFileSync} from 'node:fs';
const rows=storeItems.map(item=>{
 const local=item.image&&existsSync('.'+item.image);
 return {model:item.model,slug:item.slug,path:item.image||'',status:local?'Existing photo — model/colour and rights review pending':'Model-name placeholder — approved photo needed',source:productImages[item.model]?.source||'See commerce/store-image-sources.json; otherwise provenance unrecorded'};
});
writeFileSync('docs/image-coverage.md',`# Product image coverage\n\n${rows.length} listings; ${rows.filter(x=>x.path&&existsSync('.'+x.path)).length} existing local photos; ${rows.filter(x=>!x.path||!existsSync('.'+x.path)).length} model-name fallbacks.\n\nExisting photos were preserved, not independently certified. All placeholders identify the model and make no claim to be a product photo. No supplier images were copied: NeoStore did not expose usable licensed product assets in the available response; Revenes returned HTTP 403. Obtain merchant-authorized exact-model and colour photos before replacing placeholders. Manufacturer source URLs do not by themselves establish reuse permission.\n\n| Model | Listing | Photo | Status | Provenance |\n|---|---|---|---|---|\n`+rows.map(x=>`| ${x.model} | ${x.slug} | ${x.path||'—'} | ${x.status} | ${x.source} |`).join('\n')+'\n');
console.log(`Audited ${rows.length} listings`);
