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

router.onGroup('/foo', function(router) {
    router
        .on({
            'route': '/koo',
            'method': '*',
            'handler': defaultHandler
        })
        .onGroup('/moo', function(router) {
            router
                .on({
                    'route': '',
                    'method': '*',
                    'handler': defaultHandler
                })
                .on({
                    'route': '/soo',
                    'method': '*',
                    'handler': defaultHandler
                })
            ;
        })
    ;
});

echo('Dromeo.VERSION = ' + Dromeo.VERSION);
echo();

router.route('/foo/koo', '*', true);
router.route('/foo/moo', '*', true);
router.route('/foo/moo/soo', '*', true);
