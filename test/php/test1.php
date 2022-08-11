<?php
require(dirname(__FILE__) . '/../../src/php/Dromeo.php');

function literalRouteHandler($params)
{
    echo 'Literal Route Handler Called' . PHP_EOL;
    echo 'Route: ' . $params['route'] . PHP_EOL;
    echo 'Params: '  . PHP_EOL;
    var_dump($params['data']);
}

function literalPostHandler($params)
{
    echo 'Literal Post Handler Called' . PHP_EOL;
    echo 'Route: ' . $params['route'] . PHP_EOL;
    echo 'Params: '  . PHP_EOL;
    var_dump($params['data']);
}

function routeHandler($params)
{
    echo 'Route Handler Called' . PHP_EOL;
    echo 'Route: ' . $params['route'] . PHP_EOL;
    echo 'Params: '  . PHP_EOL;
    var_dump($params['data']);
}

function fallbackHandler($params)
{
    echo 'Fallback Handler Called' . PHP_EOL;
    echo 'Route: ' . $params['route'] . PHP_EOL;
    echo 'Params: '  . PHP_EOL;
    var_dump($params['data']);
}

echo('Dromeo.VERSION = ' . Dromeo::VERSION . PHP_EOL);
echo(PHP_EOL);


$dromeo = new Dromeo();
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
    ->fallback('fallbackHandler')
    ->on(
      array('route'=>'http://literal.abc.org/',
      'method'=>'get',
      'handler'=>'literalRouteHandler',
      'defaults'=>array('foo'=>'moo','extra'=>'extra','literal_route'=>1)
      //'types'=>array('id'=> 'INTEGER')
      )
    )
    ->on(
      array('route'=>'http://literal.abc.org/',
      'method'=>'post',
      'handler'=>'literalPostHandler',
      'defaults'=>array('foo'=>'moo','extra'=>'extra','literal_route'=>1)
      //'types'=>array('id'=> 'INTEGER')
      )
    )
    ->on(
      array('route'=>'http://abc.org/{%ALPHA%:group}/{%ALNUM%:user}/{%INT%:id}{/%moo|soo|too%:?foo(1)}{%?|&%preview=%VAR%:?preview(2)}{%ALL%:?rest}',
      // same as using
      'method'=>array('get','post'),
      'handler'=>'routeHandler',
      'defaults'=>array('foo'=>'moo','extra'=>'extra','multiple_methods'=>1)
      //'types'=>array('id'=> 'INTEGER')
      )
    )
    ->one(
      array('route'=>'http://abc.org/{:group}/{:user}/{%NUMBR%:id}{/%moo|soo|too%:?foo(1)}{%ALL%:?rest}',
      // same as using
      //'method'=>'*',
      'handler'=>'routeHandler',
      'defaults'=>array('foo'=>'moo','once'=>'once','default_part'=>1),
      'types'=>array('id'=> 'INTEGER')
      )
    )
    ->on(
      array('route'=>'http://abc.org/{%ALPHA%:group}/{%abcd12%:user}/{%NUMBR%:id}{/%moo|soo|too%:?foo(1)}{%ALL%:?rest}',
      // same as using
      //'method'=>'*',
      'handler'=>'routeHandler',
      'defaults'=>array('foo'=>'moo','const_pattern'=>'const_pattern'),
      'types'=>array('id'=> Dromeo::TYPE('INTEGER'))
      )
    )
;

$dromeo->route('http://abc.org/users/abcd12/23/soo?preview=prev+iew&foo=bar', '*', false);
//$dromeo->route('http://abc.org/users/abcd12/23/?preview=preview&foo=bar', 'get', false);
//$dromeo->route('http://abc.org/users/abcd12/23', '*', false);
$dromeo->route('http://literal.abc.org/', 'post', false);
$dromeo->route('http://literal.abc.org/', 'get', false);

$uri='http://abc.org/path/to/page/?abcd%5B0%5D=1&abcd%5B1%5D=2&foo=a%20string%20with%20spaces%20and%20%2B&moo%5Bsoo%5D=1&moo%5Btoo%5D=2#def%5B0%5D=1&def%5B1%5D=2&foo%5Bsoo%5D=1';
echo(PHP_EOL);
echo('Parse URI: ' . $uri . PHP_EOL);
echo(print_r($dromeo->parse($uri), true) . PHP_EOL);

$uri = 'http://abc.org/path/to/page/';
echo(PHP_EOL);
echo('Build URI' . PHP_EOL);
echo($dromeo->build($uri, array(
    'abcd' => array(1, 2),
    'foo' => 'a string with spaces and +',
    'moo' => array('soo'=>1, 'too'=>2)
), array(
    'def' => array(1, 2),
    'foo' => array('soo'=>1)
)) . PHP_EOL);

$query = 'key1=val1&key2[key3]=val2&key2[key4]=val3&key5[key6][]=val4&key5[key6][]=val5&key7[0]=val6&key7[1]=val7';
echo(PHP_EOL);
echo('Parse QUERY: ' . $query . PHP_EOL);
print_r(Dromeo::unglue_params($query));
