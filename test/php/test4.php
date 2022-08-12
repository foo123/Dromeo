<?php

require(dirname(__FILE__) . '/../../src/php/Dromeo.php');

function defaultHandler($route)
{
    echo('Default Handler' . PHP_EOL);
    print_r($route);
}

$router = new Dromeo();

$router->onGroup('/foo', function($router) {
    $router
        ->on([
            'route'=> '/koo',
            'method'=> '*',
            'handler'=> 'defaultHandler'
        ])
        ->onGroup('/moo', function($router) {
            $router
                ->on([
                    'route'=> '',
                    'method'=> '*',
                    'handler'=> 'defaultHandler'
                ])
                ->on([
                    'route'=> '/soo',
                    'method'=> '*',
                    'handler'=> 'defaultHandler'
                ])
            ;
        })
    ;
});

echo('Dromeo.VERSION = ' . Dromeo::VERSION . PHP_EOL);
echo(PHP_EOL);

$router->route('/foo/koo', '*', true);
$router->route('/foo/moo', '*', true);
$router->route('/foo/moo/soo', '*', true);
