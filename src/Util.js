const miniget = require("miniget");
const { JSDOM } = require("jsdom");
const Constants = require("./Constants");

class Util {

    static async getHTML(url) {
        return await miniget(url).text();
    }

    static getDOM(html) {
        return new JSDOM(html);
    }

    static parseRelated(data) {
        const videos = [];

        try {
            data = JSON.parse(data);

            for (const v of data) {
                videos.push({
                    id: v.id,
                    thumbnail: v.i,
                    url: `${Constants.BASE_URL}${v.u}`,
                    title: v.tf || v.t,
                    views: v.n,
                    duration: v.d,
                    channel: {
                        name: v.pn || v.p,
                        url: `${Constants.BASE_URL}${v.pu}`
                    }
                });
            }
        } catch {}

        return videos;
    }

}

module.exports = Util;