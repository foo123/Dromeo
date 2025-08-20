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
        'route'=>'/γεια/{:user}/{:id}',
        'name'=> 'route1',
        'handler'=> 'defaultHandler'
    )
));

// UTF8 BOM
define('UTF8_BOM', chr(0xEF).chr(0xBB).chr(0xBF));
echo UTF8_BOM;

echo('Dromeo.VERSION = ' . Dromeo::VERSION . PHP_EOL);
echo(PHP_EOL);

$router->route('/γεια/σου/1', '*', true);
$router->route('/γεια/toyou/2', '*', true);
