<?php
require(dirname(dirname(__FILE__)).'/src/php/Dromeo.php');

function routeHandler( $params )
{
    echo 'Route Handler Called' . PHP_EOL;
    echo 'Route: ' . $params['route'] . PHP_EOL;
    echo 'Params: ' . print_r( $params['data'], true ) . PHP_EOL;
}

function fallbackHandler( $params )
{
    echo 'Fallback Handler Called' . PHP_EOL;
    echo 'Route: ' . $params['route'] . PHP_EOL;
    echo 'Params: ' . print_r( $params['data'], true ) . PHP_EOL;
}

echo( 'Dromeo.VERSION = ' . Dromeo::VERSION . PHP_EOL );
echo( PHP_EOL );


$dromeo = new Dromeo( );
/*
$dromeo->debug( );
$dromeo->on(array(
    // same as using 'method'=> '*'
      array('route'=>'http://abc.org/{%ALPHA%:group}{/%ALNUM%:?user(1)}', 'handler'=>'routeHandler'),
      array('route'=>'http://def.org/{%ALPHA%:group}{/%ALNUM%:?user(1)}', 'handler'=>'routeHandler')
    ));
$dromeo->debug( );
$dromeo->off( 'http://abc.org/{%ALPHA%:group}{/%ALNUM%:?user(1)}' );
$dromeo->debug( );
$dromeo->reset( );
$dromeo->debug( );
*/

$dromeo
    ->fallback( 'fallbackHandler' )
    ->on(
      array('route'=>'http://abc.org/{%ALPHA%:group}/{%ALNUM%:user}/{%NUMBR%:id}{/%moo|soo|too%:?foo(1)}{%ALL%:?rest}', 
      // same as using
      //'method'=>'*',
      'handler'=>'routeHandler', 
      'defaults'=>array('foo'=>'moo','extra'=>'extra')
      )
    )
    ->one(
      array('route'=>'http://abc.org/{%ALPHA%:group}/{%ALNUM%:user}/{%NUMBR%:id}{/%moo|soo|too%:?foo(1)}{%ALL%:?rest}', 
      // same as using
      //'method'=>'*',
      'handler'=>'routeHandler', 
      'defaults'=>array('foo'=>'moo','once'=>'once')
      )
    )
    ->on(
      array('route'=>'http://abc.org/{%ALPHA%:group}/{%abcd12%:user}/{%NUMBR%:id}{/%moo|soo|too%:?foo(1)}{%ALL%:?rest}', 
      // same as using
      //'method'=>'*',
      'handler'=>'routeHandler', 
      'defaults'=>array('foo'=>'moo','const_pattern'=>'const_pattern')
      )
    )
;

$dromeo->route( 'http://abc.org/users/abcd12/23/soo', '*', false );
$dromeo->route( 'http://abc.org/users/abcd12/23/', '*', false );
$dromeo->route( 'http://abc.org/users/abcd12/23', '*', false );

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