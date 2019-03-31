Dromeo
======

A simple and flexible pattern routing framework for PHP, Python, Node.js / Browser / XPCOM Javascript


![Dromeo](/dromeo.jpg)

[Etymology of *"dromos"* (path)](https://en.wiktionary.org/wiki/%CE%B4%CF%81%CF%8C%CE%BC%CE%BF%CF%82#Ancient_Greek)
[Etymology pf *"path"*](https://en.wiktionary.org/wiki/path)


[Dromeo.js](https://raw.githubusercontent.com/foo123/Dromeo/master/src/js/Dromeo.js)


**see also:**  

* [Tao](https://github.com/foo123/Tao.js) A simple, tiny, isomorphic, precise and fast template engine for handling both string and live dom based templates
* [ModelView](https://github.com/foo123/modelview.js) light-weight, isomorphic &amp; flexible MVVM framework for JavaScript/HTML5
* [ModelView MVC jQueryUI Widgets](https://github.com/foo123/modelview-widgets) plug-n-play, state-full, full-MVC widgets for jQueryUI using modelview.js (e.g calendars, datepickers, colorpickers, tables/grids, etc..) (in progress)
* [Contemplate](https://github.com/foo123/Contemplate) a light-weight template engine for Node.js / Browser / XPCOM Javascript, PHP, Python
* [HtmlWidget](https://github.com/foo123/HtmlWidget) html widgets used as (template) plugins and/or standalone for Node.js / Browser / XPCOM Javascript, PHP, Python both client and server-side
* [Importer](https://github.com/foo123/Importer) simple class &amp; dependency manager and loader for Node.js / Browser / XPCOM Javascript, PHP, Python
* [PublishSubscribe](https://github.com/foo123/PublishSubscribe) a simple and flexible publish-subscribe pattern implementation for Node.js / Browser / XPCOM Javascript, PHP, Python
* [Regex Analyzer/Composer](https://github.com/foo123/RegexAnalyzer) Regular Expression Analyzer and Composer for Node.js / Browser / XPCOM Javascript, PHP, Python
* [DateX](https://github.com/foo123/DateX) eXtended &amp; localised Date parsing, diffing, formatting and validation for Node.js / Browser / XPCOM Javascript, PHP, Python
* [GrammarTemplate](https://github.com/foo123/GrammarTemplate) versatile and intuitive grammar-based templating for Node.js / Browser / XPCOM Javascript, PHP, Python
* [Xpresion](https://github.com/foo123/Xpresion) eXpression parser engine (with custom functions &amp; variables support) for Node.js / Browser / XPCOM Javascript, PHP, Python
* [Dialect](https://github.com/foo123/Dialect) cross-platform SQL construction for Node.js / Browser / XPCOM Javascript, PHP, Python
* [Simulacra](https://github.com/foo123/Simulacra) a simulation, algebraic, probability and combinatorics PHP package for scientific computations
* [RT](https://github.com/foo123/RT) client-side real-time communication for Node.js / Browser / XPCOM Javascript with support for Poll / BOSH / WebSockets
* [Asynchronous](https://github.com/foo123/asynchronous.js) a simple manager for async, linearised, parallelised, interleaved &amp; sequential tasks for JavaScript


**Examples:**

see `/test` folder


**Route Patterns:**

```javascript

// Examples:
//

// match literal route
'http://abc.org/'

// match route and capture the last numeric part into 'id' param
'http://abc.org/{%NUMBR%:id}'

// same as previous, numeric 'id' part is optional
'http://abc.org/{%NUMBR%:?id}'

// numeric part is optional but not captured (no param name given)
'http://abc.org/{%NUMBR%:?}'

// numeric part is required but not captured (no param name given)
'http://abc.org/{%NUMBR%:}'

// part is required and captured as 'name', pattern is assumed %PART%=[^/]+ (capture everything between slashes)
'http://abc.org/{:name}'

// optional captured 'id' part is now the numeric pattern plus the leading '/'
'http://abc.org{/%NUMBR%:?id}'

// optional captured 'id' part is only the numeric pattern without the leading '/', i.e group 1
'http://abc.org{/%NUMBR%:?id(1)}'

/* etc.. */

```


**Methods:**

* `Dromeo` is also a `XPCOM JavaScript Component` (Firefox) (e.g to be used in firefox browser addons/plugins)

```javascript

// -- instance methods --
// --------------------------------------------------------

// optional route_prefix to be used in case all routes have a common prefix
// so can define routes using only the part that differs (easier/shorter code)
var router = new Dromeo( route_prefix='' );

// set/define delimiters used in route-patterns, see examples
router.defineDelimiters( ['{', '}', '%', '%', ':'] );

// define a (new) sub-pattern identified with className
// sub-patterns are used in route-patterns, 
// e.g "http://abc.org/{%ALNUM%:user}", "ALNUM" is an alpha-numeric sub-pattern, i.e "[a-zA-Z0-9\\-_]+"
// default sub-patterns:
// ALPHA =>   "[a-zA-Z\\-_]+"            alphabetic only
// NUMBR =>   "[0-9]+"                   numeric only
// INT   =>   "[0-9]+"                   integer with associated optional typecaster
// ALNUM =>   "[a-zA-Z0-9\\-_]+"         alpha-numeric only
// QUERY =>   "\\?[^?#]+"                query part with leading '?'
// FRAGMENT =>"#[^?#]+"                  hash/fragment part with leading '#'
// PART  =>   "[^\\/?#]+"                arbitrary path part (between /../)
// ALL   =>   ".+"                       arbitrary sequence
router.definePattern( className, subPattern [,typecaster=null] );

// unset/remove the sub-pattern "clasName"
router.dropPattern( className );

// define a custom type, to be used as (optional) typecaster for matching parts
router.defineType( type, typecaster );

// reset/remove routes and fallback handler
router.reset( );

// create a URI from named_route pattern with given parameter values
// named routes are created by adding a name property when defining a route
// NOTE: will throw error if parameter is missing and is required (not optional) in the route pattern
// if strict is set to true will also try to match the parameter value based on route pattern type, eg numeric/alphanumeric etc.. and will throw error if pattern test failed
router.make(named_route[, params=Object()[, strict=false]]);

// example
router.on({
    route: '/{:user}/{:id}',
    name: 'my_route',
    handler: function(){/* .. */}
});
console.log(router.make('my_route', {user:'foo',id:'123'}));
// prints "/foo/123"

// set/unset fallback handler
router.fallback( [handlerFunc | false | null] );

// set a handler for routePattern, with optional defaults object (oneOff if "one" used)
router.[on|one]( routeObj | routeObjs | routePattern, handler );
// route object configuration
//
//{
//    route: '..', // the route pattern matched, needed
//    name: '..', // create a named route to be referenced at will, for example in order to create URLs matching the route pattern with given parameters
//    method: 'post', // the method (case-insensitive), default is '*', i.e any, can use array of methods as well, i.e ['get','post']
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
* add support for making string (URI) from route pattern with given parameters [DONE]
* add support for [RFC 6570 URI Template specification](http://tools.ietf.org/html/rfc6570) (TODO?)
