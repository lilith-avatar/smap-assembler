var FS = require('fs')
var Path = require('path')
var CsvReader = require('./CsvReader')

var smapPath
var projectPath
var smapJson
var resourceFolderJsonStr
var archetypeFolderJsonStr
var archetypeLinkerJsonStr
var luaNodeJsonStr
var tableNodeJsonStr

archetypeLinkerJsonStr = FS.readFileSync('./archetype_linker_template.json') //Linker的Json模板

function SerializeGuid(guid) {
    let s = guid[0] + ',' + guid[1] + ',' + guid[2] + ',' + guid[3]
    return s
}
function GuidIsZero(guid) {
    for (let i = 0; i < 4; i++) {
        if (guid[i] != 0) {
            return false
        }
    }
    return true
}
function GuidEqual(guid0, guid1) {
    for (let i = 0; i < 4; i++) {
        if (guid0[i] != guid1[i]) {
            return false
        }
    }
    return true
}
function GenerateGuid() {
    let guid = []
    for (let i = 0; i < 4; i++) {
        let e = Math.floor(Math.random() * 2147483648)
        guid.push(e)
    }
    return guid
}

function TraverseResourceAndMakeJson(path, parentNode) {

    let subPaths = FS.readdirSync(path)
    subPaths.forEach(relSubPath => {

        let subPath = Path.join(path, relSubPath)
        let state = FS.statSync(subPath);

        if (state.isDirectory()) {
            //遇到文件夹就创建一个Folder节点
            let folderNode = JSON.parse(resourceFolderJsonStr)
            folderNode.guid = GenerateGuid()
            folderNode.name = relSubPath
            if (parentNode) {
                folderNode.parentGuid = parentNode.guid
            }
            smapJson.resourceCart.push(folderNode)

            //深度优先递归遍历
            TraverseResourceAndMakeJson(subPath, folderNode)

        } else if (state.isFile()) {

            //遇到文件
            let json = JSON.parse(FS.readFileSync(subPath))

            if (Path.extname(relSubPath) == '.data') {
                //是.data，是本地资源的二进制数据，放在resource节点
                smapJson.resources[0].default.push(json)

            } else {
                //是资源meta信息，放在resourceCart节点，并关联parentGuid
                let node = json
                if (parentNode) {
                    node.parentGuid = parentNode.guid
                }
                smapJson.resourceCart.push(node)
            }

        }
    })
}
function ImportAllResources() {
    resourceFolderJsonStr = FS.readFileSync('./resource_folder_template.json') //文件夹Json模板
    //遍历Resource文件夹
    let rootPath = Path.join(projectPath, 'Resource')
    TraverseResourceAndMakeJson(rootPath)
}

const SpaceId = [
    "kArchetypeSpace",
    "kDefaultSpace"
]
/**
 * 
 * @param {*} object 原ObjectData
 * @param {int} space 0-Archetype空间; 1-World空间
 */
function MakeLinkerNode(object, space) {
    let linker = JSON.parse(archetypeLinkerJsonStr)
    linker.class = object.class
    linker.name = object.name
    linker.guid = object.guid
    linker.spaceId = SpaceId[space]
    return linker
}

function TraverseArchetypeAndMakeJson(path, parentNode) {

    let subPaths = FS.readdirSync(path)
    subPaths.forEach(relSubPath => {

        let subPath = Path.join(path, relSubPath)
        let state = FS.statSync(subPath);

        if (state.isDirectory()) {

            //遇到文件夹就创建一个Folder节点
            let folderNode = JSON.parse(archetypeFolderJsonStr)
            folderNode.guid = GenerateGuid()
            folderNode.parentGuid = parentNode.guid

            smapJson.mapdata[0].ObjectsData.push(folderNode)

            //深度优先递归遍历
            TraverseArchetypeAndMakeJson(subPath, folderNode)

        } else if (state.isFile()) {

            //遇到文件
            let nodeList = JSON.parse(FS.readFileSync(subPath))
            //这里要展开列表，找到真Archetype，其他的都是并列的
            nodeList[0].parentGuid = parentNode.guid

            nodeList.forEach(node => {
                smapJson.mapdata[0].ObjectsData.push(node)
            })
        }
    })
}
function ImportAllArchetypes() {
    //重设workspace的guid
    smapJson.mapdata[0].ObjectsData[0].guid = GenerateGuid()

    archetypeFolderJsonStr = FS.readFileSync('./archetype_folder_template.json') //文件夹Json模板
    //遍历Archetype文件夹
    let rootPath = Path.join(projectPath, 'Archetype')
    TraverseArchetypeAndMakeJson(rootPath, smapJson.mapdata[0].ObjectsData[0])

    //在ObjectsLinker下创建镜像json
    smapJson.mapdata[0].ObjectsData.forEach(object => {
        let linker = MakeLinkerNode(object, 0)
        smapJson.mapdata[0].ObjectsLinker.push(linker)
    })
}


function ImportAllWorlds() {
    //目前只有1个World
    let worldFile = FS.readFileSync(Path.join(projectPath, 'World/world'))
    let node = JSON.parse(worldFile)
    smapJson.mapdata.push(node)
}

/**
 * 
 * @param {*} path 
 * @param {*} extname '.lua'、'.csv'
 * @param {*} pathList 
 */
function TraverseAndFindAllMetaPairs(path, extname, pathList) {
    let subPaths = FS.readdirSync(path)
    subPaths.forEach(relSubPath => {
        let subPath = Path.join(path, relSubPath)
        let state = FS.statSync(subPath);
        if (state.isDirectory()) {
            //遇到文件夹继续深度优先递归遍历
            TraverseAndFindAllMetaPairs(subPath, extname, pathList)
        } else if (state.isFile()) {
            //遇到文件，如果是extname.meta
            if (Path.extname(subPath) == extname) {
                let metaFilePath = subPath + '.meta'
                if (FS.existsSync(metaFilePath)) {
                    pathList.push(subPath)
                } else {
                    console.error(extname, '文件缺失了对应的meta文件. Path:', subPath)
                }
            } else if (Path.extname(subPath) == '.meta') {
                //是.meta，则找有没有extname
                let textFilePath = subPath.substr(0, subPath.length - 5)
                if (!FS.existsSync(textFilePath)) {
                    console.error('meta file misses its raw file. Path:', subPath)
                }
            }
        }
    })
}

/**
 * 
 * @param {string} textFilePath 文本文件路径 
 * @param {json} metaInfo lua.meta信息，JSON格式
 * @param {node} myNode 自己对应的节点
 * @param {int} space 0-Archetype空间; 1-World空间
 */
async function FillLuaCsv(textFilePath, metaInfo, myNode, space) {

    let extname = Path.extname(textFilePath) //形如".lua", ".csv"
    let shouldNodeName = Path.basename(textFilePath, extname)

    //判断所需节点类型
    let targetClass = metaInfo.class
    if (!targetClass) {
        console.error("meta信息缺失class信息。Path: " + textFilePath + '.meta')
        return
    }

    //检查name和class
    if (myNode.class != targetClass) {
        console.warn('导入lua, csv时，meta里指定的class和原节点class不一致，该文件导入失败，请修复。Path:', textFilePath, '；class: ', myNode.class)
    }
    if (myNode.name != shouldNodeName) {
        console.warn('导入lua, csv时，文件名和节点名不一致，不影响导入，但建议修复。Path:', textFilePath, '；NodeName: ', myNode.name)
    }

    /* 不需要插入新节点了
    let node
    if (shouldOverrideNode) {
        myNode = shouldOverrideNode
    } else {
        //没找到要覆盖的节点，所以创建并插入新节点
        if (extname == '.lua') {
            myNode = JSON.parse(luaNodeJsonStr)
        } else if (extname == '.csv') {
            myNode = JSON.parse(tableNodeJsonStr)
        } else {
            console.error('文本文件的扩展名错误，无法导入。Path: ' + textFilePath)
            return
        }

        myNode.class = targetClass
        myNode.guid = GenerateGuid()
        myNode.parentGuid = myNode.guid
        //记得有两个name需要改
        myNode.name = shouldNodeName
        myNode.components.forEach(comp => {
            if (comp.data && comp.data.m_name) {
                comp.data.m_name = shouldNodeName
            }
        })
        smapJson.mapdata[space].ObjectsData.push(myNode)
        //别忘了插入Linker镜像
        smapJson.mapdata[space].ObjectsLinker.push(MakeLinkerNode(myNode, space))
    }*/

    if (extname == '.lua') {
        //填入lua文本数据
        myNode.components.forEach(comp => {
            if (comp.class == 'sLuaComponent') {
                comp.data.m_luaContent = FS.readFileSync(textFilePath).toString()
                if (targetClass == 'cModuleScriptObject') {
                    //ModuleScript多一个额外的属性，真鸡贼
                    comp.data.m_scriptType = 'kModuleScript'
                }
            }
        })
    } else if (extname == '.csv') {
        //填入csv数据

        let json = await CsvReader.ConvertCsvFileToOurJson(textFilePath)

        //检查行列数
        let rowNum = json.length
        let columnNum = rowNum > 0 ? json[0].length : 0
        let columnEqual = true
        for (let i = 0; i < rowNum; i++) {
            const row = json[i];
            if (row.length > columnNum) {
                columnNum = row.length
                columnEqual = false
            }
        }
        if (!columnEqual) {
            console.error("csv文件里列数不一致。Path: " + textFilePath)
        }

        myNode.components.forEach(comp => {
            if (comp.class == 'sTableComponent') {
                comp.data.m_dataModel.m_rowNum = rowNum
                comp.data.m_dataModel.m_columnNum = columnNum
                comp.data.m_dataModel.m_tableData = json
            }
        })

    } else {
        console.error('文本文件的扩展名错误，无法导入。Path: ' + textFilePath)
        return
    }

}
async function ImportAllLuaCsv() {

    let allTextPaths = []
    let luaFolderPath = Path.join(projectPath, 'Lua')
    if (FS.existsSync(luaFolderPath)) {
        //遍历Lua文件夹，拿到所有有meta文件的.lua列表
        TraverseAndFindAllMetaPairs(luaFolderPath, '.lua', allTextPaths)
    } else {
        console.error('No Lua Folder. Skip assembling lua files.')
    }

    let csvFolderPath = Path.join(projectPath, 'Csv')
    if (FS.existsSync(csvFolderPath)) {
        //遍历Csv文件夹，拿到所有有meta文件的.csv列表
        TraverseAndFindAllMetaPairs(csvFolderPath, '.csv', allTextPaths)
    } else {
        console.error('No Csv Folder. Skip assembling csv files.')
    }

    luaNodeJsonStr = FS.readFileSync('./lua_template.json')
    tableNodeJsonStr = FS.readFileSync('./table_template.json')

    let nlua = 0
    let ncsv = 0
    for (let i = 0; i < allTextPaths.length; i++) {
        const textFilePath = allTextPaths[i]
        let metaFilePath = textFilePath + '.meta'
        let metaFile = FS.readFileSync(metaFilePath)
        let metaInfo
        try {
            metaInfo = JSON.parse(metaFile)
        } catch (error) {
            console.error('meta文件无法解析成JSON。Path: ' + metaFilePath)
            continue
        }

        if (!metaInfo.guid) {
            //必须有guid
            console.error("meta文件里缺失guid。Path: " + metaFilePath)
            continue
        }

        let foundNode
        //在Archetype, World空间下按guid找自己的节点
        for (let space = 0; space < 2; space++) {
            let allNodes = smapJson.mapdata[space].ObjectsData
            for (let i = 0; i < allNodes.length; i++) {
                const node = allNodes[i];
                if (GuidEqual(metaInfo.guid, node.guid)) {
                    foundNode = node
                    break
                }
            }
            if (foundNode) break
        }

        if (!foundNode) {
            console.error('找不到meta文件里guid指定的节点。请在编辑器里创建节点后用ExtractLuaCsv.js提取正确的meta信息。Path: ' + metaFilePath)
            continue
        }

        //找到节点了，填入lua,csv
        await FillLuaCsv(textFilePath, metaInfo, foundNode, 1)

        if (Path.extname(textFilePath) == '.lua') nlua++
        else if (Path.extname(textFilePath) == '.csv') ncsv++
    }

    console.log(`导入了 ${nlua} 个.lua 和 ${ncsv} 个.csv 文件。`)
}

async function Assemble(projectPath) {
    //1.创建全空JSON
    smapJson = JSON.parse(FS.readFileSync('./empty_smap_template.json'))

    //3.1.导入 Resource
    ImportAllResources()

    //3.2.导入 Archetype
    ImportAllArchetypes()

    //3.3.导入 World
    ImportAllWorlds()

    //4.导入 Lua, Csv
    await ImportAllLuaCsv()

    //写入文件
    FS.writeFileSync(smapPath, JSON.stringify(smapJson))
}


async function main() {
    if (!process.argv[2]) {
        console.log('使用说明：\n > node Assamble.js <目标smap路径> <工程文件夹路径>')
        return
    }
    console.log('===================')
    console.log('将工程 (' + process.argv[3] + ") 聚合到", process.argv[2])

    smapPath = process.argv[2]
    projectPath = process.argv[3]

    await Assemble(projectPath)

    console.log("聚合完成，请享用！")
}

main()