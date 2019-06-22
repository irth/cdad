const https = require('https')

const request = require('request')
const cheerio = require('cheerio')


Array.prototype.last = function () {
    return this[this.length - 1]
}

const idRegexp = /.*https?\:\/\/(?:www\.)?cda\.pl\/(?:video|[^\/]+\/folder)\/([^\/\s]+).*$/

function idFromUrl(urlStr) {
    return urlStr.match(idRegexp)[1]
}

function embedUrl(id, quality) {
    return 'https://ebd.cda.pl/620x368/' + id + (quality != null ? '?wersja=' + quality : '')
}

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        request.get(url)
            .on('response', res => {
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
    $ = wrapper.find.bind(wrapper);
    const url = 'https://www.cda.pl' + $("a").attr('href');
    return {
        id: idFromUrl(url),
        url: url,
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

module.exports = {
    idFromUrl,
    getAvailableQualities,
    getVideoData,
    getFolder,
}