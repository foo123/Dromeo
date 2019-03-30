var path = require('path'), 
    Dromeo = require(path.join(__dirname, '../src/js/Dromeo.js')),
    echo = console.log, stringify = JSON.stringify
;

function defaultHandler()
{
}

var router = new Dromeo('https://example.com');

router.on([
    {
        route:'/{:user}/{:id}',
        name: 'route1',
        handler: defaultHandler 
    },
    {
        route:'/{:user}{/%INT%:?id(1)}',
        name: 'route2',
        handler: defaultHandler 
    },
    {
        route:'/{:user}{/%INT%:?id(1)}{/%ALPHA%:?action(1)}',
        name: 'route4',
        handler: defaultHandler 
    },
    {
        route:'/bar/456',
        name: 'route3',
        handler: defaultHandler 
    }
]);

function make(route, params, strict)
{
    var out;
    try {
        out = router.make(route, params, strict);
    } catch( err ) {
        out = err.message;
    }
    return out;
}

echo( 'Dromeo.VERSION = ' + Dromeo.VERSION );
echo( );

echo(make('route1', {user:'foo',id:'123'}));
echo(make('route1', {user:'foo',id:'123'}, true));
echo(make('route1', {user:'foo'}));
echo(make('route2', {user:'foo'}));
echo(make('route2', {user:'foo',id:'123'}));
echo(make('route2', {user:'foo',id:'123'}, true));
echo(make('route3', {user:'foo',id:'123'}));
echo(make('route4', {user:'foo'}));
echo(make('route4', {user:'foo',id:'123',action:'test'}));
echo(make('route4', {user:'foo',action:'test'}, true));
