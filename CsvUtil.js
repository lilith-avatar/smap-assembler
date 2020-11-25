const Fs = require('fs');
const CsvReadableStream = require('csv-reader');
const AutoDetectDecoderStream = require('autodetect-decoder-stream');
const json2csv = require('json2csv');

exports.ConvertCsvFileToOurJson = async function (csvPath) {
    return new Promise(function (resolve, reject) {
        let json = []

        let inputStream = Fs.createReadStream(csvPath, 'utf8')
            .pipe(new AutoDetectDecoderStream({ defaultEncoding: '1255' })); // If failed to guess encoding, default to 1255

        // The AutoDetectDecoderStream will know if the stream is UTF8, windows-1255, windows-1252 etc.
        // It will pass a properly decoded data to the CsvReader.

        inputStream
            .pipe(new CsvReadableStream({ parseNumbers: false, parseBooleans: false, trim: false }))
            .on('data', function (row) {
                json.push(row)
            }).on('end', function (data) {
                resolve(json)
            });
    })
}

exports.JsonToOurCsv = function (json) {

    if (json.length <= 0) return ""

    for (let i = 0; i < json[0].length; i++) {
        switch (json[0][i]) {
            case "Type":
            case "Int":
                for (let j = 2; j < json.length; j++) {
                    const row = json[j];
                    try {
                        let num = Number.parseInt(row[i])
                        row[i] = Number.isNaN(num) ? "" : num
                    } catch (error) {
                    }
                }
                break
            case "Float":
                for (let j = 2; j < json.length; j++) {
                    const row = json[j];
                    try {
                        let num = Number.parseFloat(row[i])
                        row[i] = Number.isNaN(num) ? "" : num
                    } catch (error) {
                    }
                }
                break
        }

    }

    let csv = json2csv.parse(json, { header: false })

    return csv
}