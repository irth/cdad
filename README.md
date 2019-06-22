# cdad

A downloader for [CDA.pl](https://cda.pl).

## Installation

```
$ npm i -g cdad
```

## Usage

```
$ cdad https://www.cda.pl/video/<id>
$ cdad https://www.cda.pl/<user>/folder/<id>
```

or, as a library

```js
var cda = require('cdad');
// see cli.js for usage example
```

## Known issues

* Only downloads the first page of a folder, because I haven't needed to download a bigger folder yet.

## Other

If it doesn't work with a link for you, [create an issue](https://github.com/irth/cdad/issues/new), and I'll look into it when I have some spare time.

