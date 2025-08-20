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
function get_from_source(source)
{
    return function(key, val, start, end, input) {
        return source.slice(start, end);
    };
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
        route:'/foo{/%ALPHA%-%ALPHA%:user(2)}',
        name: 'route2',
        handler: defaultHandler
    }
]);

echo('Dromeo.VERSION = ' + Dromeo.VERSION);
echo();

router1.route('/FOO/USER/ID'.toLowerCase(), '*', true, get_from_source('/FOO/USER/ID'));
router1.route('/FOO/Foo/ID'.toLowerCase(), '*', true, get_from_source('/FOO/Foo/ID'));
router2.route('/FOO/USER-User'.toLowerCase(), '*', true, get_from_source('/FOO/USER-User'));
router2.route('/FOO/Foo-fOO'.toLowerCase(), '*', true, get_from_source('/FOO/Foo-fOO'));
