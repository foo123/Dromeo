<?php

require(dirname(__FILE__) . '/../../src/php/Dromeo.php');

function defaultHandler($route)
{
    echo('Default Handler' . PHP_EOL);
    print_r($route);
}
function get_from_($source)
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
$router1->onGroup('/bar', function($router) {
    $router->onGroup('/baz', function($router) {
            $router->on([
                'route'=> '/{:user}/{:id}',
                'name'=> 'route4',
                'handler'=> 'defaultHandler'
            ])
            ;
        })->on([
            'route'=> '/{:user}/{:id}',
            'name'=> 'route3',
            'handler'=> 'defaultHandler'
        ])
    ;
});
$router2->on(array(
    array(
        'route'=>'/foo{/%ALPHA%-%ALPHA%:user(2)}',
        'name'=> 'route2',
        'handler'=> 'defaultHandler'
    )
));

echo('Dromeo.VERSION = ' . Dromeo::VERSION . PHP_EOL);
echo(PHP_EOL);

$router1->route(strtolower('/FOO/USER/ID'), '*', true, get_from_('/FOO/USER/ID'));
$router1->route(strtolower('/FOO/Foo/ID'), '*', true, get_from_('/FOO/Foo/ID'));
$router1->route(strtolower('/Bar/Foo/ID'), '*', true, get_from_('/Bar/Foo/ID'));
$router1->route(strtolower('/Bar/bAz/Foo/ID'), '*', true, get_from_('/Bar/bAz/Foo/ID'));
$router2->route(strtolower('/FOO/USER-User'), '*', true, get_from_('/FOO/USER-User'));
$router2->route(strtolower('/FOO/Foo-fOO'), '*', true, get_from_('/FOO/Foo-fOO'));
