// Local build preparation only. Does not invoke hosting, a wallet or any RPC.
import fs from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const frontend=fileURLToPath(new URL('../',import.meta.url)),evidence=new URL('../../docs/evidence/task7b/',import.meta.url)
const root=await fs.mkdtemp('/tmp/chog-task7b-candidates-'),results=[]
for(const mode of ['production','mainnet']){
 const directory=path.join(root,mode),env={...process.env,VITE_CHOG_ENV:mode,VITE_MONAD_RPC_URL:'',VITE_LOCAL_RPC_URL:'',VITE_LOCAL_CHOG_SURVIVOR_ADDRESS:'',VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK:''}
 const result=spawnSync('npm',['run','build','--','--outDir',directory],{cwd:frontend,env,encoding:'utf8',maxBuffer:5*1024*1024})
 await fs.writeFile(new URL(`${mode}-build.log`,evidence),result.stdout+result.stderr,{flag:'wx'})
 if(result.status!==0)throw Error(`${mode} build failed; inspect retained log`)
 const files=[]
 for(const entry of (await fs.readdir(directory,{recursive:true})).sort()){
  const full=path.join(directory,entry);if(!(await fs.stat(full)).isFile())continue
  const bytes=await fs.readFile(full);files.push({path:entry,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')})
 }
 results.push({mode,directory,files,inventorySHA256:createHash('sha256').update(JSON.stringify(files)).digest('hex')})
}
const report={createdAt:new Date().toISOString(),published:false,publicActivationAuthorized:false,candidates:results}
await fs.writeFile(new URL('build-candidates.json',evidence),JSON.stringify(report,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({root,candidates:results.map(({files,...r})=>r)},null,2))
