import {createHash} from 'node:crypto';
import {fail} from './server.mjs';
export const tokenHash=token=>createHash('sha256').update(token).digest('hex');
export function transferToken(req){const token=req.headers.authorization?.replace(/^Transfer /,'');if(!/^[a-f0-9]{64}$/.test(token||''))fail(401,'Open this transfer from the browser where you placed the order.');return tokenHash(token);}
export function cleanClaim(b){const sender=String(b.sender||'').trim(),reference=String(b.transfer_reference||'').trim();if(sender.length<2||sender.length>120)fail(400,'Enter the name on the sending bank account.');if(reference.length>150)fail(400,'Transfer reference is too long.');return {sender,reference};}
export function bankDetails(value){return value?.enabled===true&&Array.isArray(value.accounts)&&value.accounts.length>0&&value.accounts.every(a=>/^\d{10}$/.test(a.account_number||'')&&a.bank_name?.trim()&&a.account_name?.trim())?{accounts:value.accounts}:null;}
