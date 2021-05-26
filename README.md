# Node XVDL
Video downloader for xvideos.com written in pure JavaScript.

> ⚠ NSFW Content, 18+ Only!

# Installation

```sh
$ npm install xvdl
```

# Examples
## Getting info

```js
const { XVDL } = require("xvdl");
const url = "VIDEO_URL_HERE";

XVDL.getInfo(url)
    .then(info => console.log(info))
    .catch(e => console.error(e));

/*
{
    title,
    length,
    views,
    streams,
    thumbnail,
    relatedVideos,
    ratings,
    comments,
    channel
}
*/
```

## Downloading a video

```js
const { XVDL } = require("xvdl");
const fs = require("fs");
const url = "VIDEO_URL_HERE";

XVDL.download(url, { type: "hq" }).pipe(fs.createWriteStream("./video.mp4"))
```

# API
## getInfo(url)
This method returns basic info of a video.

## download(url, options?)
This method downloads a video of the given url.

## search(query, page?)
This method can be used to search videos. You can also specify the page to search on.

## browse(path?)
This method is used by search function. By default, it returns the videos of homepage.