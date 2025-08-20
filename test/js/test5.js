"use strict";
var path = require('path'),
    Dromeo = require(path.join(__dirname, '../../src/js/Dromeo.js')),
    echo = console.log, stringify = JSON.stringify
;

function defaultHandler(route)
{
    echo('Default Handler');
    echo(route);
}

var router = new Dromeo();

router.on([
    {
        route:'/γεια/{:user}/{:id}',
        name: 'route1',
        handler: defaultHandler
    }
]);

// UTF8 BOM
const UTF8_BOM = Buffer.from([0xEF,0xBB,0xBF]);
require('fs').writeSync(process.stdout.fd, UTF8_BOM, 0, UTF8_BOM.length);

echo('Dromeo.VERSION = ' + Dromeo.VERSION);
echo();

router.route('/γεια/σου/1', '*', true);
router.route('/γεια/toyou/2', '*', true);
