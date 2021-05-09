(async function () {
  const containers = require('./containers')
  const dockerInit = require('./docker-init')
  const util = require('util')
  const fs = require('fs')
  const env = require('./env')
  const extractor = require('./data-extractor')
  const _ = require('lodash')
  const template = require('./template')

  const exec = util.promisify(require('child_process').exec)
  const writeFile = util.promisify(fs.writeFile)

  const defaultConf = fs.readFileSync(__dirname + '/default.conf', 'utf-8')

  let lastIds = []
  let lastNetworkIds = []
  const generateProxyConf = _.throttle(async function () {
    
    const currentNetworkIds = await containers.getNetworkIdsforCurrentContainer()
    const currentContainerId = await env.getCurrentDockerId()
    let ids = await containers.getAllIds({
      filters: JSON.stringify({ network: currentNetworkIds })
    })
    
    if(_.isEqual(ids.sort(), lastIds.sort()) 
      && _.isEqual(currentNetworkIds.sort(), lastNetworkIds.sort())){
      return
    }
    lastIds = ids
    lastNetworkIds = currentNetworkIds
    
    ids = ids.filter(id => id != currentContainerId)
    const allContainters = containers.getContainers(ids)
    const inspections = await containers.inspectContainers(allContainters)
  
    const hostData = extractor.extractDataFromInspection(inspections, currentNetworkIds)
    const newConf = template.generate(hostData)

    await writeFile('/etc/nginx/conf.d/default.conf', defaultConf + newConf)
    await exec('nginx -s reload')
    
  }, 1000)
  
  const events = dockerInit.getDockerEventsInstance()
  const dockerListen = [
    'start',
    'stop',
    'update',
    'create',
    'destroy',
    'die',
    'kill',
    'restart'
  ]
  const networkListen = [
    'connect',
    'destroy',
    'disconnect',
  ]
  
  events.on('_message', message => {
    if(!['container', 'network'].includes(message.Type)){
      return
    }
    if(message.Type == 'container' && !dockerListen.includes(message.status)){
      return
    }
    if(message.Type == 'network' && !networkListen.includes(message.status)){
      return
    }

    generateProxyConf()
  })

  generateProxyConf()
  events.start()

})()