const _ = require('lodash')
const dedent = require('dedent')

function generate(data){
  let template = ''
  let allPorts = ['80']

  _.each(data, (hostData, host) => {

    const upstreamServers = {}

    let hostPorts = []
    hostData.forEach((server) => {
      server.ports.forEach((port) => {
        upstreamServers[port] = upstreamServers[port] || []
        upstreamServers[port].push(server.ip)
      })
      
      hostPorts = hostPorts.concat(server.ports)
      allPorts = allPorts.concat(server.ports)
    })

    let upstreams = ''
    _.each(upstreamServers, (ips, port) => {
      const serversTempl = ips.map(ip => `server ${ip}:${port};`).join('\n          ')
      
      upstreams += `
        upstream ${host}_${port} {
          ${serversTempl}
        }
      `
    })

    template += dedent`
        \n\n\n
        # ${host}
      ${upstreams}
    `


    hostPorts = _.uniq(hostPorts)
    
    const portsTmpl = hostPorts.map(port => `listen ${port};`).join('\n        ')
    const hostRegex = host.replace(/([\.\-])/g, '\\$1')
  
    const serversTmpl = dedent`
      \n
      server {
        server_name ~^p(?<current_port>\d+)\.${hostRegex}$;
        listen 80;

        access_log /var/log/nginx/access.log vhost;
        location / {
            proxy_pass http://${ hostData.length == 1 ? hostData[0].ip + ':' : host + '_' }$current_port;
        }
      }

      server {
        server_name ${host};
        ${portsTmpl}

        access_log /var/log/nginx/access.log vhost;
        location / {
            proxy_pass http://${host}_$server_port;
        }
      }
    `

    template += serversTmpl
  })

  allPorts = _.uniq(allPorts)

  const defaultPorts = allPorts.reduce((ports, port) => 
    ports += `listen ${port} default_server;\n      listen [::]:${port} default_server;\n      `, '')


  const defaultServer = dedent`
    server {
      ${defaultPorts}

      # Everything is a 404
      location / {
          return 404;
      }

      # You may need this to prevent return 404 recursion.
      location = /404.html {
          internal;
      }
    }
  `

  return defaultServer + template
}

module.exports = {
  generate
}