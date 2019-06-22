const fs = require('fs');
const request = require('request')
const filenamify = require('filenamify');
const chalk = require('chalk')

const cda = require('./cda.js')

const argv = require('yargs')
    .usage('Usage: $0 <cda.pl video/folder link>')
    .demandCommand(1)
    .argv;

const url = argv._[0];

let type = 'unknown'
if (url.toLowerCase().indexOf('/video/') != -1) type = 'video';
else if (url.toLowerCase().indexOf('/folder/') != -1) type = 'folder';

if (type === 'unknown') {
    console.log('Unsupported URL.')
    console.log('If you believe this is an error, please create an issue at https://github.com/irth/cdad/issues')
    process.exit(1)
}

if (type === 'video') {
    const id = cda.idFromUrl(url)
    console.log(chalk.gray("Attempting to download ") + chalk.blue(id) + chalk.gray("..."))
    downloadVideo(id)
}
else if (type === 'folder') {
    console.log(chalk.gray("Fetching the folder ") + chalk.blue(url) + chalk.gray("..."))
    cda
        .getFolder(url)
        .catch(err => console.log(`${chalk.grey("An error occured:")} ${chalk.red(err)}.`))
        .then(videos => {
            console.log(chalk.grey("Found ") + chalk.blue(videos.length + " videos.") + chalk.grey("."))
            downloadSequentially(videos)
        })
}


function printProgress(name, current, total) {
    const percent = (current / total * 100).toFixed(1);
    const size = (total / 1024 / 1024).toFixed(1);
    const end = current < total ? '\r' : '\n'
    process.stdout.write(chalk.gray("Downloading ") + chalk.cyan(name) + chalk.gray(` (${size} MiB, `) + chalk.blue(`${percent}%`) + chalk.gray(')') + end)
}

function downloadSequentially(videos) {
    if (videos.length == 0) {
        return //done
    }
    video = videos.shift()
    downloadVideo(video.id).then(() => downloadSequentially(videos))
}

function downloadVideo(id) {
    return cda
        .getAvailableQualities(id)
        .then(qualities => cda.getVideoData(id, qualities.last()))
        .then(data => ({
            url: data.file,
            name: filenamify(data.title) + '.mp4',
            referer: url,
        }))
        .then(f => downloadFile(f))
        .catch(err => console.log(`${chalk.grey("An error occured:")} ${chalk.red(err)}.`))
}

function downloadFile(f) {
    return new Promise((resolve, reject) => {
        var file = fs.createWriteStream(f.name);
        request.get(f.url)
            .on('response', (response) => {
                if (response.statusCode !== 200) return reject("Non 200 response code.")
                const total = parseInt(response.headers['content-length'])
                let saved = 0;
                response.on('data', chunk => {
                    saved += chunk.length;
                    printProgress(f.name, saved, total)
                })
                response.pipe(file);
                file.on('finish', function () {
                    file.close();
                    resolve(f.name)
                });
            })
            .on('error', err => reject(err))
    });
}
