const Docker = require('dockerode');
const DockerEvents = require('docker-events');

let docker = null;

function getDockerInstance(){
    
    if(docker) 
        return docker;

    docker = new Docker({socketPath: '/var/run/docker.sock'});

    return docker;
}


let dockerEvents = null;

function getDockerEventsInstance() {
    
    if(dockerEvents)
        return dockerEvents;

    dockerEvents = new DockerEvents({
        docker: getDockerInstance(),
    });
 
    return dockerEvents;
}

module.exports = {
    getDockerInstance,
    getDockerEventsInstance
}