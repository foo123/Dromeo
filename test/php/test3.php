<?php

require(dirname(__FILE__) . '/../../src/php/Dromeo.php');

function defaultHandler($route)
{
    echo('Default Handler' . PHP_EOL);
    print_r($route);
}

$router = new Dromeo();

$router->on(array(
    array(
        'route'=>'/foo/{:user}/{:id}',
        'name'=> 'route1',
        'handler'=> 'defaultHandler'
    )
));

echo('Dromeo.VERSION = ' . Dromeo::VERSION . PHP_EOL);
echo(PHP_EOL);

$router->route(strtolower('/FOO/USER/ID'), '*', true, '/FOO/USER/ID', 'ORIG');