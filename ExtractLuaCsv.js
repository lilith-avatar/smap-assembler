const extractor = require('./MetaExtractor')

function main() {
    if (!process.argv[2]) {
        console.log('使用说明：\n > node ExtractLuaCsv.js <smap路径> <提取到文件夹路径>')
        return
    }
    console.log('===================')
    console.log('将 smap (' + process.argv[2] + ") 里的 lua、csv 数据和 meta 信息提取到", process.argv[3])

    extractor.ExtractLuaCsv(process.argv[2], process.argv[3])

    console.log("提取完成，请享用！")
}

main()