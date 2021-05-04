const _ = require('lodash')

function extractDataFromInspection(inspection, networkIds, excludeIds = []){
  let data = []
  inspection.forEach((container) => {
    if(excludeIds.indexOf(container.Id) > -1){
      return
    }

    if(!container.Config.Env.length){
      return
    }

    const env = {}
    container.Config.Env.forEach((value) => {
      const [name, val] = value.split('=')
      env[name] = val || ''
    })

    if(!env.VIRTUAL_HOST){
      return
    }

    const connectedNetworks = container.NetworkSettings.Networks
    let ip = ''
    for(let name in connectedNetworks){
      if(networkIds.includes(connectedNetworks[name].NetworkID)){
        ip = connectedNetworks[name].IPAddress
        break
      }
    }

    if(!ip){
      return
    }
    
    const hosts = env.VIRTUAL_HOST.replace(/[\s]+/, '').split(',')
    let ports = env.VIRTUAL_PORT ? env.VIRTUAL_PORT.replace(/[\s]+/, '').split(',') : ['80']

    const exposedPorts = Object.keys(container.Config.ExposedPorts).map((port) => parseInt(port) + '')

    ports = ports.concat(exposedPorts)
    ports = _.uniq(ports)

    hosts.forEach((host) => {
      data.push({
        host,
        ip,
        ports
      })
    })
  })

  return data
}

module.exports = {
  extractDataFromInspection
}