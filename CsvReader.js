const Fs = require('fs');
const CsvReadableStream = require('csv-reader');
const AutoDetectDecoderStream = require('autodetect-decoder-stream');

exports.ConvertCsvFileToOurJson = async function (csvPath) {
    return new Promise(function (resolve, reject) {
        let json = []

        let inputStream = Fs.createReadStream(csvPath, 'utf8')
            .pipe(new AutoDetectDecoderStream({ defaultEncoding: '1255' })); // If failed to guess encoding, default to 1255

        // The AutoDetectDecoderStream will know if the stream is UTF8, windows-1255, windows-1252 etc.
        // It will pass a properly decoded data to the CsvReader.

        inputStream
            .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
            .on('data', function (row) {
                json.push(row)
            }).on('end', function (data) {
                resolve(json)
            });
    })
}