var SmapBreaker = require('./SmapBreaker')

function main() {
    if (!process.argv[2]) {
        console.log('使用说明：\n > node Disassemble.js <smap路径> <目标文件夹路径>')
        return
    }
    console.log('===================')
    console.log('将 smap (' + process.argv[2] + ") 打散到", process.argv[3])

    SmapBreaker.BreakSmap(process.argv[2], process.argv[3])

    console.log("smap的非文本部分打散完成，请享用！")
}

main()