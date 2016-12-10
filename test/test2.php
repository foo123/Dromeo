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

$dromeo
    ->fallback( 'fallbackHandler' )
    ->on(
      array('route'=>'http://abc.org/{%ARG(moo)%:?foo}', 
      // same as using
      //'method'=>'*',
      'handler'=>'routeHandler', 
      'defaults'=>array('foo'=>'moo','extra'=>'extra')
      //'types'=>array('id'=> 'INTEGER')
      )
    )
;

$dromeo->route( 'http://abc.org/', '*', false );
$dromeo->route( 'http://abc.org/?foo=1', '*', false );
$dromeo->route( 'http://abc.org/?foo=1&moo=2', '*', false );
$dromeo->route( 'http://abc.org/?moo[foo][]', '*', false );
$dromeo->route( 'http://abc.org/?moo', '*', false );
