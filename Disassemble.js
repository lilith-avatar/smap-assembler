var FS = require('fs')
var Path = require('path')
var InvalidCharConverter = require('./InvalidCharConverter')

var projectPath
var smapJson
//var exportTexts
var localResourceDataDict = {}


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

function MakeResourceFileOrFolder(resourceNode, nodeDict, folderNodeToPathDict) {
    let parentNodeGuid = resourceNode.parentGuid
    let dir
    if (!GuidIsZero(parentNodeGuid)) {
        //我不是根目录的儿子，所以要检查父节点对应的文件夹有没有准备好
        let parentId = SerializeGuid(parentNodeGuid)
        let parentNode = nodeDict[parentId]
        dir = folderNodeToPathDict[parentId]
        if (!dir) {
            //父节点对应的文件夹还没创建出来，所以先让父节点创建文件夹
            dir = MakeResourceFileOrFolder(parentNode, nodeDict, folderNodeToPathDict)
        }
    }
    //父节点对应的文件夹应该已经准备好了，可以创建我自己了
    if (GuidIsZero(parentNodeGuid)) {
        dir = Path.join(projectPath, 'Resource')
    }

    let id = SerializeGuid(resourceNode.guid)

    let convertedFilename = InvalidCharConverter.ConvertInvalidCharInString(resourceNode.name)
    if (convertedFilename) console.log(`原资源名"${resourceNode.name}"不能直接用于文件名，已转换成"${convertedFilename}"`)
    let filenameWithoutExt = convertedFilename || resourceNode.name

    if (resourceNode.type == "kGeneric") { //是文件夹
        let path = Path.join(dir, filenameWithoutExt)
        if (FS.existsSync(path)) {
            console.error(`资源文件夹重名，不影响打散，聚合时将只保留一个。Path:`, path)
        } else {
            FS.mkdirSync(path)
        }
        folderNodeToPathDict[id] = path
        return path //返回路径
    }

    //是文件
    let path = Path.join(dir, filenameWithoutExt + '.' + resourceNode.type)

    let localResourceData = localResourceDataDict[id]
    if (localResourceData) {
        //有本地资源数据，先写入
        dataPath = path + '.data'
        if (FS.existsSync(dataPath)) {
            console.error(`资源二进制数据文件重名，该文件无法导出。Path:`, dataPath)
        } else {
            FS.writeFileSync(dataPath, JSON.stringify(localResourceData))
        }
    }

    //写入res文件
    if (FS.existsSync(path)) {
        let filenameWithGuid = filenameWithoutExt + JSON.stringify(resourceNode.guid) + '.' + resourceNode.type
        console.error(`资源文件重名，已重命名为${filenameWithGuid}，引用关系不会受影响，但资源路径会改变。Path:`, path)
        path = Path.join(dir, filenameWithGuid)
    }

    FS.writeFileSync(path, JSON.stringify(resourceNode))

    //不是文件夹就不返回路径了
    return null
}

function ExportAllResources() {

    //拆解本地Resource，记录入Dict
    let localResourceDatas = smapJson.resources[0].default
    localResourceDatas.forEach(resData => {
        localResourceDataDict[SerializeGuid(resData.guid)] = resData
    });

    //生成Resource里的文件夹结构
    let resourceCart = smapJson.resourceCart //数组，元素是Resource空间里的节点

    let nodeDict = {} //nodeid→node的Json
    let folderNodeToPathDict = {} //文件夹nodeid→文件夹路径

    resourceCart.forEach(resourceNode => {
        let id = SerializeGuid(resourceNode.guid)
        nodeDict[id] = resourceNode
    });

    resourceCart.forEach(resourceNode => {
        MakeResourceFileOrFolder(resourceNode, nodeDict, folderNodeToPathDict)
    });
}


var archetypeTreeRoot //里面是树形结构的"极简node"
var archetypeIdToSimpleNode = {} //id→SimpleNode
var archetypeNodeDict = {} //id→ArchetypeNode

function CollectNodesInRealArchetype(list, curSimpleNode) {
    let curNode = archetypeNodeDict[curSimpleNode.id]
    list.push(curNode)
    curSimpleNode.children.forEach(childSimpleNode => {
        CollectNodesInRealArchetype(list, childSimpleNode)
    })
}
function TraverseTreeAndFindArchetypeAndExport(simpleNode, curPath) {
    let node = archetypeNodeDict[simpleNode.id]

    let convertedFilename = InvalidCharConverter.ConvertInvalidCharInString(node.name)
    if (convertedFilename) console.log(`原Archetype名"${node.name}"不能直接用于文件名，已转换成"${convertedFilename}"`)
    let filenameWithoutExt = convertedFilename || node.name

    if (node.class == "cFolderObject") {
        //是文件夹，创建文件夹
        let myPath = Path.join(curPath, filenameWithoutExt)
        FS.mkdirSync(myPath)

        //继续深度优先遍历
        simpleNode.children.forEach(simnode => {
            TraverseTreeAndFindArchetypeAndExport(simnode, myPath)
        })
    } else {
        //不是文件夹，说明是真Archetype，整体导出
        let list = [] //该真Archetype包含的所有节点
        CollectNodesInRealArchetype(list, simpleNode)//把树形结构转换成包含节点Data的list
        //输出list
        let myPath = Path.join(curPath, filenameWithoutExt + '.arch')
        FS.writeFileSync(myPath, JSON.stringify(list))
    }
}

function ExportAllArchetypes() {
    let archetypeSpace = smapJson.mapdata[0]
    let archetypeNodeDatas = archetypeSpace.ObjectsData

    //还原archetypeTree树形结构
    archetypeNodeDatas.forEach(node => {
        let id = SerializeGuid(node.guid)
        archetypeNodeDict[id] = node

        let simpleNode = archetypeIdToSimpleNode[id]
        if (!simpleNode) {
            simpleNode = { //用来还原树形结构的简单node类
                id: id,
                children: []
            }
            archetypeIdToSimpleNode[id] = simpleNode
        }
        if (GuidIsZero(node.parentGuid)) {
            //这是workspace根节点
            archetypeTreeRoot = simpleNode //把根节点记下来
        }
        else {
            //如果不是根节点，则把自己塞到父节点simnode的children中
            let parentId = SerializeGuid(node.parentGuid)
            let parentSimpleNode = archetypeIdToSimpleNode[parentId]
            if (!parentSimpleNode) {
                //如果父节点simnode还没有创建，则帮它创建
                parentSimpleNode = {
                    id: parentId,
                    children: []
                }
                archetypeIdToSimpleNode[parentId] = parentSimpleNode
            }
            parentSimpleNode.children.push(simpleNode) //把自己塞入父节点simnode的children里
        }
    })
    //树形结构还原完毕

    //从根节点开始，寻找所有的真正Archetype
    archetypeTreeRoot.children.forEach(simnode => {
        TraverseTreeAndFindArchetypeAndExport(simnode, Path.join(projectPath, 'Archetype'))
    })

}


function ExportAllWorlds() {
    //目前只有1个World
    let worldSpace = smapJson.mapdata[1]
    FS.writeFileSync(Path.join(projectPath, 'World/world'), JSON.stringify(worldSpace))
}

function DeletePath(path) {
    var files = [];
    if (FS.existsSync(path)) {
        files = FS.readdirSync(path);
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (FS.statSync(curPath).isDirectory()) { // recurse
                DeletePath(curPath);
            } else { // delete file
                FS.unlinkSync(curPath);
            }
        });
        FS.rmdirSync(path);
    }
}

const ScriptClasses = ["cScriptObject", "cModuleScriptObject"]
function IsNodeScriptClass(node) {
    for (let i = 0; i < ScriptClasses.length; i++) {
        const c = ScriptClasses[i];
        if (c == node.class) return true
    }
    return false
}

const luaPlaceholder = FS.readFileSync('./lua_placeholder.txt').toString()
function ReplaceAllLuaData() {
    let n = 0
    for (let space = 0; space < 2; space++) {
        smapJson.mapdata[space].ObjectsData.forEach(node => {
            if (IsNodeScriptClass(node)) {
                node.components.forEach(comp => {
                    if (comp.class == 'sLuaComponent') {
                        comp.data.m_luaContent = luaPlaceholder.replace('<class>', '"' + node.class + '"').replace('<guid>', '[' + node.guid + ']')
                        n++
                    }
                })
            }
        })
    }
    console.log('检测到Script, ModuleScript节点', n, '个')
}

function Disassemble(projectPath) {

    if (!FS.existsSync(projectPath)) {
        FS.mkdirSync(projectPath)
    }

    //1.删除Resource, Archetype, World文件夹
    let arr = ['Resource', 'Archetype', 'World']

    for (let i = 0; i < arr.length; i++) {
        try {
            let path = Path.join(projectPath, arr[i])
            if (FS.existsSync(path)) {
                DeletePath(path)
            }
        } catch (error) {
            console.error(error)
        }
    }

    // arr.push('Lua', 'Csv') //无需创建这俩文件夹
    
    for (let i = 0; i < arr.length; i++) {
        try {
            let path = Path.join(projectPath, arr[i])
            if (!FS.existsSync(path)) FS.mkdirSync(path)
        } catch (error) {
            console.error(error)
        }
    }

    //2.将lua、csv内容替换成注释，但不单独导出它们
    ReplaceAllLuaData()

    //3.1.导出 Resource
    ExportAllResources(projectPath)

    //3.2.导出 Archetype
    ExportAllArchetypes()

    //3.3.导出 World
    ExportAllWorlds()

}

function main() {
    if (!process.argv[2]) {
        console.log('使用说明：\n > node Disassemble.js <smap路径> <目标文件夹路径>')
        return
    }
    console.log('===================')
    console.log('将 smap (' + process.argv[2] + ") 打散到", process.argv[3])

    let smapPath = process.argv[2]
    projectPath = process.argv[3]
    let rawdata = FS.readFileSync(smapPath)
    //smapJson = JSON.parse(rawdata)
    smapJson = eval('(' + rawdata + ')')
    Disassemble(projectPath)

    console.log("lua、csv将不会被打散成文件。csv的数据会留存在节点数据里；而节点里的lua文本会被替换成meta信息，你可以借此制作自己的meta文件。")
    console.log("想要批量获取meta信息，请使用ExtractLuaCsv.js。")
    console.log("打散完成，请享用！")
}

main()