Dromeo
======

A simple and flexible routing framework for PHP, Python, Node/JS, ActionScript(TODO)


[Dromeo.js](https://raw.githubusercontent.com/foo123/Dromeo/master/src/js/Dromeo.js)


**see also:**  

* [Contemplate](https://github.com/foo123/Contemplate) a light-weight template engine for Node/JS, PHP, Python, ActionScript
* [Tao](https://github.com/foo123/Tao.js) A simple, tiny, isomorphic, precise and fast template engine for handling both string and live dom based templates
* [ModelView](https://github.com/foo123/modelview.js) a light-weight and flexible MVVM framework for JavaScript/HTML5
* [ModelView MVC jQueryUI Widgets](https://github.com/foo123/modelview-widgets) plug-n-play, state-full, full-MVC widgets for jQueryUI using modelview.js (e.g calendars, datepickers, colorpickers, tables/grids, etc..) (in progress)
* [PublishSubscribe](https://github.com/foo123/PublishSubscribe) a simple and flexible publish-subscribe pattern implementation for Node/JS, PHP, Python, ActionScript
* [Regex Analyzer/Composer](https://github.com/foo123/RegexAnalyzer) Regular Expression Analyzer and Composer for Node/JS, PHP, Python, ActionScript
* [Xpresion](https://github.com/foo123/Xpresion) a simple and flexible eXpression parser engine (with custom functions and variables support) for PHP, Python, Node/JS, ActionScript
* [Dialect](https://github.com/foo123/Dialect) a simple cross-platform SQL construction for PHP, Python, Node/JS, ActionScript (in progress)
* [Simulacra](https://github.com/foo123/Simulacra) a simulation, algebraic, probability and combinatorics PHP package for scientific computations
* [Asynchronous](https://github.com/foo123/asynchronous.js) a simple manager for async, linearised, parallelised, interleaved and sequential tasks for JavaScript


**Example:**

```javascript

var path = require('path'), 
    Dromeo = require(path.join(__dirname, '../src/js/Dromeo.js')),
    echo = console.log
;

function routeHandler( params )
{
    echo('Route Handler Called');
    echo('Route: ' + params['route']);
    echo('Params: ');
    echo( params['data'] );
}

function fallbackHandler( params )
{
    echo('Fallback Handler Called');
    echo('Route: ' + params['route']);
    echo('Params: ');
    echo( params['data'] );
}

echo( 'Dromeo.VERSION = ' + Dromeo.VERSION );
echo( );

var dromeo = new Dromeo( );

dromeo
    
    .on(
      
      {
      // route pattern
      route: 'http://abc.org/{%ALPHA%:group}/{%ALNUM%:user}/{%NUMBR%:id}{/%moo|soo|too%:?foo(1)}{%ALL%:?rest}', 
      // method, default is '*', any
      //method: '*',
      // route handler
      handler: routeHandler, 
      // default params (if any)
      defaults: {'foo':'moo','extra-flag','extra'},
      // optional type-casting for certain matches
      types: {'id': Dromeo.TYPE['INTEGER']}
      }
    
    )
    
    .fallback( fallbackHandler )
;

dromeo.route( 'http://abc.org/users/abcd12/23/soo' );

var uri = 'http://abc.org/path/to/page/?abcd%5B0%5D=1&abcd%5B1%5D=2&foo=1&moo%5Bsoo%5D=1&moo%5Btoo%5D=2#def%5B0%5D=1&def%5B1%5D=2&foo%5Bsoo%5D=1'
echo( );
echo( 'Parse URI: ' + uri );
echo( dromeo.parse( uri ) );

uri = 'http::/abc.org/path/to/page/';
echo( );
echo( 'Build URI' );
echo( dromeo.build(uri, {
    'abcd': [1, 2],
    'foo': 1,
    'moo': {'soo':1, 'too':2}
}, {
    'def': [1, 2],
    'foo': {'soo':1}
}) );

```

**output:**
```text
Dromeo.VERSION = 0.6.1

Route Handler Called
Route: http://abc.org/users/abcd12/23/soo
Params: 
{ foo: 'soo',
  extra: 'extra',
  group: 'users',
  user: 'abcd12',
  id: 23,
  rest: null }

Parse URI: http://abc.org/path/to/page/?abcd%5B0%5D=1&abcd%5B1%5D=2&foo=1&moo%5Bsoo%5D=1&moo%5Btoo%5D=2#def%5B0%5D=1&def%5B1%5D=2&foo%5Bsoo%5D=1
{ fragment: 'def%5B0%5D=1&def%5B1%5D=2&foo%5Bsoo%5D=1',
  query: 'abcd%5B0%5D=1&abcd%5B1%5D=2&foo=1&moo%5Bsoo%5D=1&moo%5Btoo%5D=2',
  path: '/path/to/page/',
  host: 'abc.org',
  scheme: 'http',
  query_params: 
   { abcd: { '0': '1', '1': '2' },
     foo: '1',
     moo: { soo: '1', too: '2' } },
  fragment_params: { def: { '0': '1', '1': '2' }, foo: { soo: '1' } } }

Build URI
http::/abc.org/path/to/page/?abcd%5B0%5D=1&abcd%5B1%5D=2&foo=1&moo%5Bsoo%5D=1&moo%5Btoo%5D=2#def%5B0%5D=1&def%5B1%5D=2&foo%5Bsoo%5D=1

```

**Route Patterns:**

```javascript

// Examples:
//

// match literal route
'http::/abc.org/'

// match route and capture the last numeric part into 'id' param
'http::/abc.org/{%NUMBR%:id}'

// same as previous, numeric 'id' part is optional
'http::/abc.org/{%NUMBR%:?id}'

// numeric part is optional but not captured (no param name given)
'http::/abc.org/{%NUMBR%:?}'

// numeric part is required but not captured (no param name given)
'http::/abc.org/{%NUMBR%:}'

// optional captured 'id' part is now the numeric pattern plus the leading '/'
'http::/abc.org{/%NUMBR%:?id}'

// optional captured 'id' part is only the numeric pattern without the leading '/', i.e group 1
'http::/abc.org{/%NUMBR%:?id(1)}'

/* etc.. */

```


**Methods:**

```javascript

// -- instance methods --
// --------------------------------------------------------

// optional route_prefix to be used in case all routes have a common prefix
// so can define routes using only the part that differs (easier/shorter code)
var router = new Dromeo( route_prefix='' );

// set/define delimiters used in route-patterns, see examples
router.defineDelimiters( ['{', '}', ':', '%'] );

// define a (new) sub-pattern identified with className
// sub-patterns are used in route-patterns, 
// e.g "http://abc.org/{%ALNUM%:user}", "ALNUM" is an alpha-numeric sub-pattern, i.e "[a-zA-Z0-9\\-_]+"
// default sub-patterns:
// ALPHA =>   "[a-zA-Z\\-_]+"            alphabetic only
// NUMBR =>   "[0-9]+"                   numeric only
// ALNUM =>   "[a-zA-Z0-9\\-_]+"         alpha-numeric only
// QUERY =>   "\\?[^?#]+"                query part with leading '?'
// FRAGM =>   "#[^?#]+"                  hash/fragment part with leading '#'
// PART  =>   "[^\\/?#]+"                arbitrary path part (between /../)
// ALL   =>   ".+"                       arbitrary sequence
router.definePattern( className, subPattern );

// unset/remove the sub-pattern "clasName"
router.dropPattern( className );

// define a custom type, to be used as (optional) typecaster for matching parts
router.defineType( type, typecaster );

// reset/remove routes and fallback handler
router.reset( );

// set/unset fallback handler
router.fallback( [handlerFunc | false | null] );

// set a handler for routePattern, with optional defaults object (oneOff if "one" used)
router.[on|one]( routeObj | routeObjs | routePattern, handler );
// route object configuration
//
//{
//    route: '..', // the route pattern matched, needed
//    method: 'post', // the method (case-insensitive), default is '*', i.e any
//    handler: function(params){/*..*/}, // the route handler to be called, needed
//    defaults: {/*..*/}, // any default and/or extra parameters to be used, if missing, and passed to handler, default is {}
//    types: {/*..*/} // optional typecasters for specific matches, i.e INTEGER, STRING, ARRAY, PARAMS or custom, default null
//}
//

// this also works:
router.[on|one]( routePattern, function(params){/*..*/} );

// set handler(s) for multiple routePattern(s) (oneOff if "one" used)

// using array of objects
router.[on|one]([ 
    routeObj1,
    routeObj2
    /* etc .. */
]);

// using variable arguments
router.[on|one]( 
    routeObj1,
    routeObj2
    /* etc .. */
);

// remove the routePattern (optionally if handlerFunc matches as well)
router.off( routePattern | routeObj [, handlerFunc=null] );

// redirect to given url (with optional statusCode and statusMsg)
// in Node, the **response object** from node.http should be passed as well
router.redirect( url, response [, statusCode=302, statusMsg=true] );

// parse and extract uri components and optional query/fragment params as objects (using RFC3986)
var components = router.parse( url [, query_p='query_params', fragment_p='fragment_params'] );

// parse/unglue a uri component into a params object (using RFC3986)
var params = router.unglue( uriComponent );

// build (url-encoded) url from baseUrl and query and/or hash objects (using RFC3986)
var url = router.build( baseUrl, query=null, hash=null );

// build/glue together a uri component from a params object (using RFC3986)
var component = router.glue( params );

// match and route a given url 
// (with optional method, only routes which match the method will be used), 
// returns true if matched any routePattern else false
var matched = router.route( url, method="*", breakOnFirstMatch=true );

```

**TODO**

* add support for (http/request) method [DONE]
* add support for extra passed defaults [DONE]
* add support for (optional) type-casting of matched parameters [DONE]
* add support for [RFC 6570 URI Template specification](http://tools.ietf.org/html/rfc6570)
