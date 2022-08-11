<?php

require(dirname(__FILE__) . '/../../src/php/Dromeo.php');

function defaultHandler($route)
{
    echo('Default Handler' . PHP_EOL);
    print_r($route);
}

$router1 = new Dromeo();
$router2 = new Dromeo();

$router1->on(array(
    array(
        'route'=>'/foo/{:user}/{:id}',
        'name'=> 'route1',
        'handler'=> 'defaultHandler'
    )
));
$router2->on(array(
    array(
        'route'=>'/foo{/%ALPHA%:user(1)}',
        'name'=> 'route2',
        'handler'=> 'defaultHandler'
    )
));

echo('Dromeo.VERSION = ' . Dromeo::VERSION . PHP_EOL);
echo(PHP_EOL);

$router1->route(strtolower('/FOO/USER/ID'), '*', true, '/FOO/USER/ID', 'ORIG');
$router1->route(strtolower('/FOO/Foo/ID'), '*', true, '/FOO/Foo/ID', 'ORIG');
$router2->route(strtolower('/FOO/USER'), '*', true, '/FOO/USER', 'ORIG');
$router2->route(strtolower('/FOO/Foo'), '*', true, '/FOO/Foo', 'ORIG');
