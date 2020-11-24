var FS = require('fs')
var Path = require('path')

function main() {
    if (!process.argv[2]) {
        console.log('使用说明：\n > node ConvertNodePathNameToNodeName.js <文件夹>')
        return
    }
    console.log('===================')
    let dir = process.argv[2]
    let relpaths = FS.readdirSync(dir)

    relpaths.forEach(filename => {
        if (FS.statSync(Path.join(dir, filename)).isFile()) {
            let lastQuote = filename.lastIndexOf("'")
            let secLastQuote = filename.lastIndexOf("'", lastQuote - 1)
            let realName = filename.substring(secLastQuote + 1, lastQuote)
            let extname = Path.extname(filename)
            FS.renameSync(Path.join(dir, filename), Path.join(dir, realName + extname))
        }
    });

    console.log("重命名完成，请享用！")
}

main()