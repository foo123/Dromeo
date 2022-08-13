<?php

require(dirname(__FILE__) . '/../../src/php/Dromeo.php');

function echo_($s)
{
    echo ($s . PHP_EOL);
}

function defaultHandler()
{
}

$router = new Dromeo('https://example.com');

$router->on(array(
    array(
        'route'=>'/{:user}/{:id}',
        'name'=> 'route1',
        'handler'=> 'defaultHandler'
    ),
    array(
        'route'=>'/{:user}{/%INT%:?id(1)}',
        'name'=> 'route2',
        'handler'=> 'defaultHandler'
    ),
    array(
        'route'=>'/{:user}{/%INT%:?id(1)}{/%ALPHA%:?action(1)}',
        'name'=> 'route4',
        'handler'=> 'defaultHandler'
    ),
    array(
        'route'=>'/bar/456',
        'name'=> 'route3',
        'handler'=> 'defaultHandler'
    )
))
->onGroup('/foo', function($router) {
    $router->onGroup('/bar', function($router) {
        $router->on([
            'route'=>'/{:user}',
            'name'=> 'route5',
            'handler'=> 'defaultHandler'
        ]);
    })
    ->on([
        'route'=>'/{:user}',
        'name'=> 'route6',
        'handler'=> 'defaultHandler'
    ]);
});

function make($route, $params=array(), $strict=false)
{
    global $router;
    try {
        $out = $router->make($route, $params, $strict);
    } catch( \Exception $err ) {
        $out = $err->getMessage();
    }
    return $out;
}

echo('Dromeo.VERSION = ' . Dromeo::VERSION . PHP_EOL);
echo(PHP_EOL);

echo_(make('route1', array('user'=>'foo','id'=>'123')));
echo_(make('route1', array('user'=>'foo','id'=>'123'), true));
echo_(make('route1', array('user'=>'foo')));
echo_(make('route2', array('user'=>'foo')));
echo_(make('route2', array('user'=>'foo','id'=>'123')));
echo_(make('route2', array('user'=>'foo','id'=>'123'), true));
echo_(make('route3', array('user'=>'foo','id'=>'123')));
echo_(make('route4', array('user'=>'foo')));
echo_(make('route4', array('user'=>'foo','id'=>'123','action'=>'test')));
echo_(make('route4', array('user'=>'foo','action'=>'test'), true));
echo_(make('route5', array('user'=>'user')));
echo_(make('route6', array('user'=>'user')));
