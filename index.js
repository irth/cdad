const https = require('https')
const url = require('url')
const cheerio = require('cheerio')


Array.prototype.last = function () {
    return this[this.length - 1]
}

function idFromUrl(urlStr) {
    const u = url.parse(urlStr)
    return u.pathname.replace(/\/$/, '').split('/').last()
}

function embedUrl(id, quality) {
    return 'https://ebd.cda.pl/620x368/' + id + (quality != null ? '?wersja=' + quality : '')
}

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            if (res.statusCode != 200) {
                return reject("non-200 http response: " + res.statusCode)
            }
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                resolve(cheerio.load(rawData))
            });
        });
    });
}

function getAvailableQualities(id) {
    return fetchUrl(embedUrl(id))
        .then(
            $ => $('.quality-btn')
                .map((_, el) => $(el).text())
                .get()
        );
}

function getVideoData(id, quality) {
    return fetchUrl(embedUrl(id, quality)).then($ => {
        const player = $("#mediaplayer" + id);
        const videoData = JSON.parse(player.attr("player_data"))["video"];
        videoData.title = decodeURIComponent(videoData.title)
        return videoData
    });
}

function videoInfoFromThumb(wrapper) {
    $ = wrapper.find.bind(wrapper)
    return {
        id: idFromUrl($("a").attr('href')),
        url: 'https://www.cda.pl' + $("a").attr('href'),
        thumb: $("img.thumb").attr('src'),
        title: $(".link-title-visit").text(),
        duration: $(".time-inline").text()
    }
}

function getFolder(folderUrl) {
    return fetchUrl(folderUrl).then(
        $ => $(`[data-foldery_id=${idFromUrl(folderUrl)}] .thumbnail`)
            .map((_, el) => videoInfoFromThumb($(el)))
            .get()
    )
}