var FS = require('fs')
var Path = require('path')
var InvalidCharConverter = require('./InvalidCharConverter')
var CsvUtil = require('./CsvUtil')

var projectPath
var luaPath
var csvPath
var smapJson

const ScriptClasses = ["cScriptObject", "cModuleScriptObject"]
function IsNodeScriptClass(node) {
    for (let i = 0; i < ScriptClasses.length; i++) {
        const c = ScriptClasses[i];
        if (c == node.class) return true
    }
    return false
}
function IsNodeTableClass(node) {
    if ('cTableObject' == node.class) return true
    return false
}

function CreateLuaAndMetaFile(node, luaContent) {

    let convertedFilename = InvalidCharConverter.ConvertInvalidCharInString(node.name)
    if (convertedFilename) console.log(`原脚本节点名"${node.name}"不能直接用于文件名，已转换成"${convertedFilename}"`)
    let filenameWithoutExt = convertedFilename || node.name

    let filename = filenameWithoutExt + '.lua'

    //防重名
    let i = 0
    while (FS.existsSync(Path.join(projectPath, filename))) {
        filename = filenameWithoutExt + ' (' + i + ').lua'
        i++
    }

    FS.writeFileSync(Path.join(luaPath, filename), luaContent ?? '') //如果脚本节点的代码为空，则smap就没有这个属性，真鸡贼

    let metaInfo = {
        "class": node.class,
        "guid": node.guid,
    }
    FS.writeFileSync(Path.join(luaPath, filename + '.meta'), JSON.stringify(metaInfo, null, 4))
}
function CreateCsvAndMetaFile(node, tableData) {

    let convertedFilename = InvalidCharConverter.ConvertInvalidCharInString(node.name)
    if (convertedFilename) console.log(`原Table节点名"${node.name}"不能直接用于文件名，已转换成"${convertedFilename}"`)
    let filenameWithoutExt = convertedFilename || node.name

    let filename = filenameWithoutExt + '.csv'

    //防重名
    let i = 0
    while (FS.existsSync(Path.join(projectPath, filename))) {
        filename = filenameWithoutExt + ' (' + i + ').csv'
        i++
    }

    //tableData Json转csv

    let csv = CsvUtil.JsonToOurCsv(tableData)

    FS.writeFileSync(Path.join(csvPath, filename), csv)

    let metaInfo = {
        "class": node.class,
        "guid": node.guid,
    }
    FS.writeFileSync(Path.join(csvPath, filename + '.meta'), JSON.stringify(metaInfo, null, 4))
}

function Extract() {

    luaPath = Path.join(projectPath, 'Lua(Extract)')
    csvPath = Path.join(projectPath, 'Csv(Extract)')
    if (!FS.existsSync(projectPath)) {
        FS.mkdirSync(projectPath)
    }
    if (!FS.existsSync(luaPath)) {
        FS.mkdirSync(luaPath)
    } if (!FS.existsSync(csvPath)) {
        FS.mkdirSync(csvPath)
    }

    //遍历所有节点，找到脚本节点
    for (let space = 0; space < 2; space++) {
        smapJson.mapdata[space].ObjectsData.forEach(node => {
            if (IsNodeScriptClass(node)) {
                node.components.forEach(comp => {
                    if (comp.class == 'sLuaComponent') {
                        CreateLuaAndMetaFile(node, comp.data.m_luaContent)
                    }
                })
            } else if (IsNodeTableClass(node)) {
                let tableData
                for (let i = 0; i < node.components.length; i++) {
                    const comp = node.components[i];
                    if (comp.class == 'sTableComponent') {
                        tableData = comp.data.m_dataModel.m_tableData
                        break
                    }
                }
                if (tableData) {
                    CreateCsvAndMetaFile(node, tableData)
                } else {
                    console.error('Table节点里缺失tableData。节点名:', node.name)
                }
            }
        })
    }
}


function main() {
    if (!process.argv[2]) {
        console.log('使用说明：\n > node ExtractLuaCsv.js <smap路径> <提取到文件夹路径>')
        return
    }
    console.log('===================')
    console.log('将 smap (' + process.argv[2] + ") 里的 lua、csv 数据和 meta 信息提取到", process.argv[3])

    let smapPath = process.argv[2]
    projectPath = process.argv[3]
    let rawdata = FS.readFileSync(smapPath)
    //smapJson = JSON.parse(rawdata)
    smapJson = eval('(' + rawdata + ')')
    Extract(projectPath)

    console.log("提取完成，请享用！")
}

main()