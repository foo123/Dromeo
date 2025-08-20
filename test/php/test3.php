<?php

require(dirname(__FILE__) . '/../../src/php/Dromeo.php');

function defaultHandler($route)
{
    echo('Default Handler' . PHP_EOL);
    print_r($route);
}
function get_from_source($source)
{
    return function($key, $val, $start, $end, $input) use ($source) {
        return substr($source, $start, $end-$start);
    };
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
        'route'=>'/foo{/%ALPHA%-%ALPHA%:user(2)}',
        'name'=> 'route2',
        'handler'=> 'defaultHandler'
    )
));

echo('Dromeo.VERSION = ' . Dromeo::VERSION . PHP_EOL);
echo(PHP_EOL);

$router1->route(strtolower('/FOO/USER/ID'), '*', true, get_from_source('/FOO/USER/ID'));
$router1->route(strtolower('/FOO/Foo/ID'), '*', true, get_from_source('/FOO/Foo/ID'));
$router2->route(strtolower('/FOO/USER-User'), '*', true, get_from_source('/FOO/USER-User'));
$router2->route(strtolower('/FOO/Foo-fOO'), '*', true, get_from_source('/FOO/Foo-fOO'));
