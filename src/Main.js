const Util = require("./Util");
const Constants = require("./Constants");
const miniget = require("miniget");
const m3u8 = require("m3u8stream");
const { PassThrough } = require("stream");

const createStream = () => {
    const stream = new PassThrough({
        highWaterMark: 1024 * 512,
    });
    stream.destroy = () => { stream._isDestroyed = true; };
    return stream;
}

class XVDL {

    constructor() {
        throw new Error("Cannot instantiate static class");
    }

    /**
     * Browse pages and get data. Defaults to homepage.
     * @param {string} [path] Browsing path
     */
    static async browse(path = undefined) {
        const html = await Util.getHTML(`${Constants.BASE_URL}${path && typeof path === "string" ? path : ""}`);
        const { document } = Util.getDOM(html).window;
        const videos = document.querySelectorAll('div[class="thumb-block  "]');
        const data = {
            videos: [],
            lastPage: parseInt(document.querySelector(".last-page").textContent) || 1
        };

        videos.forEach(video => {
            const paragraph = video.querySelector('p[class="title"]');

            data.videos.push({
                id: video.getAttribute("data-id"),
                title: paragraph.querySelector("a").title,
                url: `${Constants.BASE_URL}${paragraph.querySelector('a').href}`,
                duration: paragraph.querySelector('span[class="duration"]').textContent,
                channel: {
                    url: `${Constants.BASE_URL}${video.querySelector('p[class="metadata"]').querySelector('a').href}`,
                    name: video.querySelector('span[class="name"]').textContent
                },
                thumbnail: {
                    dynamic: video.querySelector('img').src,
                    static: video.querySelector('img').getAttribute("data-src")
                }
            })
        });

        return data;
    }

    /**
     * Returns video info
     * @param {string} url Video url
     */
    static async getInfo(url) {
        if (!url || typeof url !== "string") throw new Error("URL must be a string.");
        const html = await Util.getHTML(url);
        
        const { document } = Util.getDOM(html).window;
        const ratings = document.querySelectorAll('.rating-inbtn');
        const vidMetadata = document.querySelector('.video-metadata');

        const info = {
            url: url,
            title: document.querySelector("meta[property='og:title']").getAttribute("content"),
            length: parseInt(document.querySelector("meta[property='og:duration']").getAttribute("content")) || 0,
            views: parseInt(document.querySelector("#nb-views-number").textContent.split(",").join("")) || 0,
            streams: {
                hq: html.split("html5player.setVideoUrlHigh('")[1].split("');")[0],
                lq: html.split("html5player.setVideoUrlLow('")[1].split("');")[0],
                hls: html.split("html5player.setVideoHLS('")[1].split("');")[0]
            },
            thumbnail: document.querySelector('meta[property="og:image"]').getAttribute("content"),
            relatedVideos: Util.parseRelated(html.split("<script>var video_related=")[1].split(";window.wpn_categories")[0]),
            ratings: {
                likes: ratings[0].textContent,
                dislikes: ratings[1].textContent
            },
            comments: document.querySelector('.nb-video-comments').textContent,
            channel: {
                name: vidMetadata.querySelector('span[class="name"]').textContent,
                url: `${Constants.BASE_URL}${vidMetadata.querySelector("a").href}`,
                subscribers: vidMetadata.querySelector('span[class="count"]').textContent
            }
        };

        return info;
    }

    /**
     * Downloads a video
     * @param {string} url Video url
     * @param {object} options Download options
     */
    static download(url, options = { type: "hq" }) {
        if (!url || typeof url !== "string") throw new Error("URL must be a string.");
        const stream = createStream();

        setImmediate(() => {
            XVDL.getInfo(url)
                .then(info => {
                    let link = "";
                    switch (options && options.type) {
                        case "lq":
                            link = info.streams.lq;
                            break;
                        case "hq":
                            link = info.streams.hq;
                            break;
                        case "hls":
                            link = info.streams.hls;
                            break;
                        default:
                            throw new Error(`Unknown type "${options.type}"`);
                    }

                    const downloader = options.type === "hls" ? m3u8 : miniget;
                    downloader(link, options).pipe(stream);
                });
        });

        return stream;
    }

    /**
     * Search something
     * @param {string} query Search query
     * @param {number} [page] Page number to search
     */
    static async search(query, page = undefined) {
        if (!query || typeof query !== "string") throw new Error("Invalid search query!");

        return await XVDL.browse(`?k=${encodeURIComponent(query)}${page && !isNaN(page) ? `?p=${page}` : ""}`);
    }

}

module.exports = XVDL;