// This file is used to differentiate between different relation map instances
// running on the same server. rm2 identifies the process by the js file name.
// It just redirects to rmServer.js, which will be updated frequently.

var fs = require('fs');

eval(fs.readFileSync('hsbServer.js')+'');