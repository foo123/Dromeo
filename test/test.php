<?php
require(dirname(dirname(__FILE__)).'/src/php/Dromeo.php');

function routeHandler( $route, $params )
{
    echo 'Route Handler Called' . PHP_EOL;
    echo 'Route: ' . $route . PHP_EOL;
    echo 'Params: ' . print_r( $params, true ) . PHP_EOL;
}

function fallbackHandler( $route, $params )
{
    echo 'Fallback Handler Called' . PHP_EOL;
    echo 'Route: ' . $route . PHP_EOL;
    echo 'Params: ' . print_r( $params, true ) . PHP_EOL;
}

echo( 'Dromeo.VERSION = ' . Dromeo::VERSION . PHP_EOL );
echo( PHP_EOL );


$dromeo = new Dromeo( );
/*
$dromeo->debug( );
$dromeo->on(array(
      array('http://abc.org/{%ALPHA%:group}{/%ALNUM%:?user(1)}', 'routeHandler'),
      array('http://def.org/{%ALPHA%:group}{/%ALNUM%:?user(1)}', 'routeHandler')
    ));
$dromeo->debug( );
$dromeo->off( 'http://abc.org/{%ALPHA%:group}{/%ALNUM%:?user(1)}' );
$dromeo->debug( );
$dromeo->reset( );
$dromeo->debug( );
*/

$dromeo
    
    ->on(array(
      
      array('http://abc.org/{%ALPHA%:group}/{%ALNUM%:user}/{%NUMBR%:id}{/%moo|soo|too%:?foo(1)}{%ALL%:?rest}', 'routeHandler', array('foo'=>'moo'))
    
    ))
    
    ->fallback( 'fallbackHandler' )
;

$dromeo->route( 'http://abc.org/users/abcd12/23/soo' );
$dromeo->route( 'http://abc.org/users/abcd12/23/' );
$dromeo->route( 'http://abc.org/users/abcd12/23' );

$uri='http::/abc.org/path/to/page/?abcd%5B0%5D=1&abcd%5B1%5D=2&foo=a%20string%20with%20spaces%20and%20%2B&moo%5Bsoo%5D=1&moo%5Btoo%5D=2#def%5B0%5D=1&def%5B1%5D=2&foo%5Bsoo%5D=1';
echo( PHP_EOL );
echo( 'Parse URI: ' . $uri . PHP_EOL );
echo( print_r($dromeo->parse($uri), true) . PHP_EOL );

$uri = 'http::/abc.org/path/to/page/';
echo( PHP_EOL );
echo( 'Build URI' . PHP_EOL );
echo( $dromeo->build($uri, array(
    'abcd' => array(1, 2),
    'foo' => 'a string with spaces and +',
    'moo' => array('soo'=>1, 'too'=>2)
), array(
    'def' => array(1, 2),
    'foo' => array('soo'=>1)
)) . PHP_EOL );