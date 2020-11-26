const SmapBreaker = require('./SmapBreaker')
const extractor = require('./MetaExtractor')

function main() {
    if (!process.argv[2]) {
        console.log('使用说明：\n > node InitialDisassemble.js <smap路径> <目标文件夹路径>')
        return
    }
    console.log('===================')
    console.log('将 smap (' + process.argv[2] + ") 初始化打散成离散态工程，目标路径为", process.argv[3])

    SmapBreaker.BreakSmap(process.argv[2], process.argv[3])
    extractor.ExtractLuaCsv(process.argv[2], process.argv[3], false)

    console.log("离散态工程制作完成，请开启新的工作流吧！")
}

main()
