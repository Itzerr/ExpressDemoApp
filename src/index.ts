import express from 'express'
import fs from 'fs'

const server = express();
const port = 3000;

server.use(express.static('public'));

server.get('/videos/:videoId', (req, res) => {
  const videoPath = `assets/${req.params['videoId']}.mp4`;
  if (!fs.existsSync(videoPath)) {
    res.sendStatus(404);
    return;
  }

  const videoRange = req.headers.range;
  if (!videoRange) {
    res.status(400).send("Requires Range header");
    return;
  }

  const videoSize = fs.statSync(videoPath).size;
  const parts = videoRange.match(/^bytes=(\d+)-(\d*)$/);
  if (!parts) {
    res.status(400).send("Invalid Range header");
    return
  }
  const start = Number(parts[1]);
  let end = 0;
  if (parts[2] == '') {
    end = videoSize - 1;
  }
  let contentLength = end - start + 1;
  const chunkSize = 2 ** 21;
  if (contentLength > chunkSize) {
    end = start + chunkSize - 1;
  }
  console.log(`${start}-${end}`);
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": 'bytes',
    "Content-Length": contentLength,
    "Content-Type": "video/mp4"
  };

  res.writeHead(206, headers);

  const videoStream = fs.createReadStream(videoPath, { start, end });

  videoStream.pipe(res);
});

server.listen(port, () => {
  console.log(`Started listening on port ${port}`)
})