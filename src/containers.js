
const dockerInit = require('./docker-init');
const _ = require('lodash');
const env = require('./env')

const docker = dockerInit.getDockerInstance();

async function getAllIds(options = {}) {
    
    const list = await docker.listContainers(options);

    return _.map(list, 'Id');
}


function getContainers(ids){
    
    const containers = ids.map( id => {
        return docker.getContainer(id);
    })

    return containers;
}

async function inspectContainers(containers, options = {}) {

    const inpectPromises = containers.map(container => container.inspect(options));

    const inspectedContainers = await Promise.all(inpectPromises);

    return inspectedContainers;
}

function getNetworkIdsFromInspection(inspection){
    return _.map(inspection.NetworkSettings.Networks, 'NetworkID')
}

async function inspectContainersOnNetwork(containers, networkIds, options = {}){
    const inspections = await inspectContainers(containers, options)
    const inspectionsOnNetwork = inspections.filter((container) => {
        const containerNetworkIds = getNetworkIdsFromInspection(container)
        return _.intersection(networkIds, containerNetworkIds).length
    })

    return inspectionsOnNetwork
}

async function getNetworkIdsforCurrentContainer(options = {}){
    const id = await env.getCurrentDockerId()
    const container = docker.getContainer(id)
    const inspection = await container.inspect(options)
    return getNetworkIdsFromInspection(inspection)
}

module.exports = {
    getAllIds,
    getContainers,
    inspectContainers,
    getNetworkIdsFromInspection,
    inspectContainersOnNetwork,
    getNetworkIdsforCurrentContainer
}