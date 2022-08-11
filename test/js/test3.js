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

var router1 = new Dromeo(), router2 = new Dromeo();

router1.on([
    {
        route:'/foo/{:user}/{:id}',
        name: 'route1',
        handler: defaultHandler
    }
]);
router2.on([
    {
        route:'/foo{/%ALPHA%:user(1)}',
        name: 'route2',
        handler: defaultHandler
    }
]);

echo('Dromeo.VERSION = ' + Dromeo.VERSION);
echo();

router1.route('/FOO/USER/ID'.toLowerCase(), '*', true, '/FOO/USER/ID', 'ORIG');
router1.route('/FOO/Foo/ID'.toLowerCase(), '*', true, '/FOO/Foo/ID', 'ORIG');
router2.route('/FOO/USER'.toLowerCase(), '*', true, '/FOO/USER', 'ORIG');
router2.route('/FOO/Foo'.toLowerCase(), '*', true, '/FOO/Foo', 'ORIG');
