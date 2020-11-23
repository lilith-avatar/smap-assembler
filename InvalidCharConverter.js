//非法字符
const invalidchars = `\\/:*?"<>|`
//映射表
const mappingchars = `}{-#~'[];`

/**
 * 检查转换用于文件名的字符串。如果有不合法字符，则会相应地转换；若没有，则返回false。
 * @param {string} str 待检验和转换的字符串
 */
exports.ConvertInvalidCharInString = function(str){
    let chars = str.split('')
    let invalid = false
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        let targetInd = invalidchars.indexOf(char)
        if (targetInd >= 0){
            invalid = true
            chars[i] = mappingchars.charAt(targetInd)
        }
    }
    return invalid ? chars.join('') : null
}