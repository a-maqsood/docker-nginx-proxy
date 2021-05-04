const util = require('util')
const exec = util.promisify(require('child_process').exec)

let currentDockerId = ''
async function getCurrentDockerId(){
    if(currentDockerId){
        return currentDockerId
    }

    const output = await exec('basename "$(cat /proc/1/cpuset)"')
    let id = output.stdout || ''
    currentDockerId = id.replace(/[\/\s]+/g, '')
    return currentDockerId
}

module.exports = {
  getCurrentDockerId
}