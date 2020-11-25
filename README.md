# 欢迎使用 Assembler 2

这是由 Stephen Zhou 独立开发的效率工具。

该工具把smap打散成文件工程，或者把文件工程聚合成smap。

## 第一次使用需要安装

首先需要安装node.js环境，到[官网](https://nodejs.org/)下载某一版本即可。

然后用命令行打开到工具所在目录，运行

> npm install

之后就可以用nodejs运行该工具中的js脚本。参数里的路径可以是相对路径也可以是绝对路径。

**目前不支持Terrain、Union！如果地图里有这些东西，会丢失甚至出错。**

## 打散

> node .\Disassemble.js <smap路径> <目标工程文件夹路径>

会清空目标工程里的Resource、Archetype、World文件夹，不会影响Lua、Csv文件夹，不会打散出lua、csv文件。

资源以Resource节点为单位导入，但本地资源会附带一个.data文件，别弄丢了。

每一个Archetype都会导出成.arch文件，相当于Unity的Prefab。

World会作为一个整体导出成.world文件，相当于Unity的scene。

arch和world文件里的lua数据会被清空，并填入meta信息注释。Table节点的数据不会被清空，因为废弃的Table节点不影响游戏运行。

示例

> node .\Disassemble.js D:\test01.smap D:\test01Project

## 聚合

> node .\Assemble.js <目标smap路径> <工程文件夹路径>

会覆盖目标smap文件。会从Lua、Csv文件夹导入所有的lua、csv。

示例

> node .\Assemble.js D:\test01.smap D:\test01Project

lua、csv文件必须和正确的meta文件在一起，才能顺利导入。meta文件里是一个json，指定了节点类型和节点Guid。

如果你想创建新的lua文件，需要先在编辑器里的目标位置创建一个脚本节点，做好命名，保存smap，然后有两种方法获取meta信息：

1. 用ExtractLuaCsv.js，然后找到该脚本节点的meta。

1. 打散再聚合，再用编辑器打开新smap，刚才的脚本节点里会附带一段meta信息，把它做成文件即可。

csv同理。

## 提取lua、csv和meta

> node .\ExtractLuaCsv.js <smap路径> <提取到文件夹路径>

提取工程里的Script、ModuleScript、Table节点，导出成lua、csv文件，同时会生成meta文件。

示例

> node .\Assemble.js .\test01_assem.smap .\test01

# 工作中的使用建议

对于文本型节点，目前只支持Script、ModuleScript、Table节点的打散聚合，其他文本型节点的数据将会内嵌在.world，.arch文件内，无法在外部编辑。想要其他的可以跟Stephen提。

## 新建工程

1. 用Disassemble.js把一个正常的smap打散到目标工程目录。

1. 再用ExtractLuaCsv.js把smap里的lua、csv和meta信息提取出来，把两个文件夹名称的后缀去掉，得到Lua、Csv文件夹（重要）。

现在，你就得到了一个完整的离散态的工程！

world里只放静态场景，并由一个美术制作。其他人都用Archetype、脚本制作动态内容。

## 开始工作

在p4（推荐）或git上保存工程文件夹。

开始工作，先打开编辑器。在p4上把工程Get Latest。

用Assemble.js脚本把工程聚合成smap，再用编辑器打开smap。即可开始开发！

lua、csv必须在编辑器外编辑，比如用VSCode、Excel。在编辑器内的编辑将无法导出（除非你用旧版的导出lua、csv功能）。其他内容可以在编辑器内编辑。

## 在编辑器外改lua、csv

**Lua、Csv两个文件夹里，可以随意添加更深的文件夹结构。只要.meta文件跟着主文件，就一定能聚合成功！**

**准备刷新lua、csv之前，一定要先保存编辑器里的内容然后Disassemble smap**，这一步相当于把编辑器里的工作内容保存到工程文件夹里。

然后再Assemble，编辑器内打开smap，这相当于重新打开工程。

## 上传工作

编辑器里保存smap，Disassemble。

在p4比对后上传即可。只有csv、lua可以merge，其他文件只能以文件为单位覆盖。


# 祝工作愉快，期待二十人团队的诞生！

2020年11月22日 晚