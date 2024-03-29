# 欢迎使用 Assembler 2

这是由 [Stephen Zhou](https://github.com/stv1024)  独立开发的效率工具。

该工具把smap打散成文件工程，或者把文件工程聚合成smap。

## 安装

首先需要安装node.js环境，到[官网](https://nodejs.org/)下载某一版本即可。

然后用双击```安装依赖库.bat```。

之后就可以用nodejs运行该工具中的js脚本。参数里的路径可以是相对路径也可以是绝对路径。当然这一切也都可以用.bat文件完成。

**目前不支持Terrain、Union！如果地图里有这些东西，会丢失甚至出错。**

## 修改.bat里的路径

本工具文件夹里提供了3个.bat文件模板：

- ```初始化工程.bat```

- ```打散.bat```

- ```聚合.bat```

你需要用记事本打开修改里面的路径信息，然后就可以双击使用了。

（如果你把.bat文件挪到了其他位置，还需要修改```node```后面的js脚本的路径）

## 初始化工程

双击```初始化工程.bat```

会在目标工程文件夹里生成5~6个文件夹和1个json文件。以后这个文件夹就是你的工程了，把它放在P4、git或svn里就可以实现多人协作了。

## 打散

双击```打散.bat```

会覆盖目标工程里的Resource、Archetype、World文件夹，不会影响Lua、Csv文件夹，**不会导出和覆盖lua、csv文件**。

资源以Resource节点为单位导入，但本地资源会附带一个.data文件，别弄丢了。

每一个Archetype都会导出成.arch文件，相当于Unity的Prefab。

World会作为一个整体导出成.world文件，相当于Unity的scene。

arch和world文件里的lua数据会被清空，并填入meta信息注释。Table节点的数据不会被清空，因为废弃的Table节点不影响游戏运行。

## 聚合

双击```聚合.bat```

会覆盖目标smap文件。除了聚合Archetype、Resource、world，还会从Lua、Csv文件夹导入所有的lua、csv。

lua、csv文件必须和正确的meta文件在一起，才能顺利导入。meta文件里是一个json，指定了节点类型和节点Guid。

如果你想创建新的lua文件，需要先在编辑器里的目标位置创建一个脚本节点，做好命名，保存smap，然后打散再聚合，再用编辑器打开新smap，刚才的脚本节点里会附带一段meta信息，把它做成文件即可。

csv同理。

## 提取lua、csv和meta（不常用）

> node .\ExtractLuaCsv.js <smap路径> <提取到文件夹路径>

提取工程里的Script、ModuleScript、Table节点，导出成lua、csv文件，同时会生成meta文件。

示例

# 工作流建议

## 开始工作

在p4（推荐）或git上保存工程文件夹。

开始工作，先打开编辑器。在p4上把工程Get Latest。

把工程聚合成smap，再用编辑器打开smap。即可开始开发！

lua、csv必须在编辑器外编辑，比如用VSCode、Excel。在编辑器内的编辑将无法导出（除非你用旧版的导出lua、csv功能）。其他内容可以在编辑器内编辑。

## 在编辑器外改lua、csv

**Lua、Csv两个文件夹里，可以随意添加更深的文件夹结构。只要.meta文件跟着主文件，就一定能聚合成功！**

**准备聚合lua、csv之前，一定要先保存编辑器里的内容然后打散 smap**，防止你在编辑器里对其他节点做的改动丢失。

然后再聚合，在编辑器内打开smap。

## 上传工作

编辑器里保存smap，打散。

在p4比对后上传即可。只有csv、lua可以merge，其他文件只能以文件为单位覆盖。


# 祝工作愉快，期待二十人团队的诞生！

2020年11月22日 晚
