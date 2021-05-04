const _ = require('lodash')
const dedent = require('dedent')

function generate(data){
  let template = ''
  let allPorts = []

  data.forEach((server) => {

    const ports = server.ports.reduce((ports, port) => ports += `listen ${port};\n        `, '')
    allPorts = allPorts.concat(server.ports)
    const hostRegex = server.host.replace(/([\.\-])/g, '\\$1')

    template += dedent`
      \n\n\n# ${server.host}
      server {
        server_name ~^p(?<current_port>\\d+)\\.${hostRegex}$;
        listen 80;
        access_log /var/log/nginx/access.log vhost;
        location / {
            proxy_pass http://${server.ip}:$current_port;
        }
      }

      server {
        server_name ${server.host};
        ${ports}
        access_log /var/log/nginx/access.log vhost;
        location / {
            proxy_pass http://${server.ip}:$server_port;
        }
      }
    `

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