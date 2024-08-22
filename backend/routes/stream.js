const fs=require('fs')
const path=require('path')

const express=require('express')
const Router=express.Router()


Router.post('/stream',(req,res)=>{
    const path=req.body.path;
    const stat=fs.statSync(path)
    const filesize=stat.size
    const range = req.headers.range;
    if(range){
        const parts = range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
        const file = fs.createReadStream(path, { start, end });
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${totalSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
          };
        res.writeHead(206,headers)
        file.pipe(res);
    }
    else {
        const headers = {
          'Content-Length': videoSize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(200, headers);
        fs.createReadStream(videoPath).pipe(res);
      }
})


export default Router