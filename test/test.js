var path = require('path'), 
    Dromeo = require(path.join(__dirname, '../src/js/Dromeo.js')),
    echo = console.log, stringify = JSON.stringify
;

function routeHandler( params )
{
    echo('Route Handler Called');
    echo('Route: ' + params.route);
    echo('Params: ');
    echo( params.data );
}

function fallbackHandler( params )
{
    echo('Fallback Handler Called');
    echo('Route: ' + params.route);
    echo('Params: ');
    echo( params.data );
}

echo( 'Dromeo.VERSION = ' + Dromeo.VERSION );
echo( );

var dromeo = new Dromeo( );
/*
dromeo.debug( );
dromeo.on([
    // same as using method: '*'
    {route:'http://abc.org/{%ALPHA%:group}{/%ALNUM%:?user(1)}', handler:routeHandler},
    {route:'http://def.org/{%ALPHA%:group}{/%ALNUM%:?user(1)}', handler:routeHandler}
]);
dromeo.debug( );
dromeo.off( 'http://abc.org/{%ALPHA%:group}{/%ALNUM%:?user(1)}' );
dromeo.debug( );
dromeo.reset( );
dromeo.debug( );
*/
dromeo
    .fallback( fallbackHandler )
    .on(
      {
      route:'http://abc.org/{%ALPHA%:group}/{%ALNUM%:user}/{%NUMBR%:id}{/%moo|soo|too%:?foo(1)}{%ALL%:?rest}',
      // same as using
      //method: '*',
      handler: routeHandler, 
      defaults: {'foo':'moo','extra':'extra'},
      types: {'id': Dromeo.TYPE['INTEGER']}
      }
    )
    .one(
      {
      route:'http://abc.org/{%ALPHA%:group}/{%ALNUM%:user}/{%NUMBR%:id}{/%moo|soo|too%:?foo(1)}{%ALL%:?rest}',
      // same as using
      //method: '*',
      handler: routeHandler, 
      defaults: {'foo':'moo','once':'once'},
      types: {'id': Dromeo.TYPE['INTEGER']}
      }
    )
    .on(
      {
      route:'http://abc.org/{%ALPHA%:group}/{%abcd12%:user}/{%NUMBR%:id}{/%moo|soo|too%:?foo(1)}{%ALL%:?rest}',
      // same as using
      //method: '*',
      handler: routeHandler, 
      defaults: {'foo':'moo','const_pattern':'const_pattern'},
      types: {'id': Dromeo.TYPE['INTEGER']}
      }
    )
;

dromeo.route( 'http://abc.org/users/abcd12/23/soo', '*', false );
dromeo.route( 'http://abc.org/users/abcd12/23/', '*', false );
dromeo.route( 'http://abc.org/users/abcd12/23', '*', false );

var uri = 'http::/abc.org/path/to/page/?abcd%5B0%5D=1&abcd%5B1%5D=2&foo=a%20string%20with%20spaces%20and%20%2B&moo%5Bsoo%5D=1&moo%5Btoo%5D=2#def%5B0%5D=1&def%5B1%5D=2&foo%5Bsoo%5D=1'
echo( );
echo( 'Parse URI: ' + uri );
echo( dromeo.parse( uri ) );

uri = 'http::/abc.org/path/to/page/';
echo( );
echo( 'Build URI' );
echo( dromeo.build(uri, {
    'abcd': [1, 2],
    'foo': 'a string with spaces and +',
    'moo': {'soo':1, 'too':2}
}, {
    'def': [1, 2],
    'foo': {'soo':1}
}) );