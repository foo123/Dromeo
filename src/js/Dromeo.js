/**
*
*   Dromeo
*   Simple and Flexible Routing Framework for PHP, Python, Node.js / Browser / XPCOM Javascript
*   @version: 1.1.1
*
*   https://github.com/foo123/Dromeo
*
**/
!function( root, name, factory ) {
"use strict";
var m;
if ( ('undefined'!==typeof Components)&&('object'===typeof Components.classes)&&('object'===typeof Components.classesByID)&&Components.utils&&('function'===typeof Components.utils['import']) ) /* XPCOM */
    (root.EXPORTED_SYMBOLS = [ name ]) && (root[ name ] = factory.call( root ));
else if ( ('object'===typeof module)&&module.exports ) /* CommonJS */
    module.exports = factory.call( root );
else if ( ('function'===typeof(define))&&define.amd&&('function'===typeof(require))&&('function'===typeof(require.specified))&&require.specified(name) ) /* AMD */
    define(name,['require','exports','module'],function( ){return factory.call( root );});
else if ( !(name in root) ) /* Browser/WebWorker/.. */
    (root[ name ] = (m=factory.call( root )))&&('function'===typeof(define))&&define.amd&&define(function( ){return m;} );
}(  /* current root */          'undefined' !== typeof self ? self : this,
    /* module name */           "Dromeo",
    /* module factory */        function ModuleFactory__Dromeo( undef ) {
"use strict";

var __version__ = "1.1.1",

    // http://en.wikipedia.org/wiki/List_of_HTTP_status_codes
    HTTP_STATUS = {
    // 1xx Informational
     100: "Continue"
    ,101: "Switching Protocols"
    ,102: "Processing"
    ,103: "Early Hints"

    // 2xx Success
    ,200: "OK"
    ,201: "Created"
    ,202: "Accepted"
    ,203: "Non-Authoritative Information"
    ,204: "No Content"
    ,205: "Reset Content"
    ,206: "Partial Content"
    ,207: "Multi-Status"
    ,208: "Already Reported"
    ,226: "IM Used"

    // 3xx Redirection
    ,300: "Multiple Choices"
    ,301: "Moved Permanently"
    ,302: "Found" //Previously "Moved temporarily"
    ,303: "See Other"
    ,304: "Not Modified"
    ,305: "Use Proxy"
    ,306: "Switch Proxy"
    ,307: "Temporary Redirect"
    ,308: "Permanent Redirect"

    // 4xx Client Error
    ,400: "Bad Request"
    ,401: "Unauthorized"
    ,402: "Payment Required"
    ,403: "Forbidden"
    ,404: "Not Found"
    ,405: "Method Not Allowed"
    ,406: "Not Acceptable"
    ,407: "Proxy Authentication Required"
    ,408: "Request Timeout"
    ,409: "Conflict"
    ,410: "Gone"
    ,411: "Length Required"
    ,412: "Precondition Failed"
    ,413: "Request Entity Too Large"
    ,414: "Request-URI Too Long"
    ,415: "Unsupported Media Type"
    ,416: "Requested Range Not Satisfiable"
    ,417: "Expectation Failed"
    ,418: "I'm a teapot"
    ,419: "Authentication Timeout"
    ,422: "Unprocessable Entity"
    ,423: "Locked"
    ,424: "Failed Dependency"
    ,426: "Upgrade Required"
    ,428: "Precondition Required"
    ,429: "Too Many Requests"
    ,431: "Request Header Fields Too Large"
    ,440: "Login Timeout"
    ,444: "No Response"
    ,449: "Retry With"
    ,450: "Blocked by Windows Parental Controls"
    ,451: "Unavailable For Legal Reasons"
    ,494: "Request Header Too Large"
    ,495: "Cert Error"
    ,496: "No Cert"
    ,497: "HTTP to HTTPS"
    ,498: "Token expired/invalid"
    ,499: "Client Closed Request"

    // 5xx Server Error
    ,500: "Internal Server Error"
    ,501: "Not Implemented"
    ,502: "Bad Gateway"
    ,503: "Service Unavailable"
    ,504: "Gateway Timeout"
    ,505: "HTTP Version Not Supported"
    ,506: "Variant Also Negotiates"
    ,507: "Insufficient Storage"
    ,508: "Loop Detected"
    ,509: "Bandwidth Limit Exceeded"
    ,510: "Not Extended"
    ,511: "Network Authentication Required"
    ,520: "Origin Error"
    ,521: "Web server is down"
    ,522: "Connection timed out"
    ,523: "Proxy Declined Request"
    ,524: "A timeout occurred"
    ,598: "Network read timeout error"
    ,599: "Network connect timeout error"
    },

    _patternOr = /^([^|]+\|.+)$/,
    _nested = /\[([^\]]*?)\]$/,
    _group = /\((\d+)\)$/,
    trim_re = /^\s+|\s+$/g,
    re_escape = /([*+\[\]\(\)?^$\/\\:.])/g,

    // auxilliaries
    PROTO = 'prototype', OP = Object[PROTO], AP = Array[PROTO], FP = Function[PROTO],
    toString = OP.toString, HAS = OP.hasOwnProperty,
    isNode = "undefined" !== typeof(global) && '[object global]' == toString.call(global),
    is_array = function( o ) { return (o instanceof Array) || ('[object Array]' === toString.call(o)); },
    is_obj = function( o ) { return /*(o instanceof Object) ||*/ ('[object Object]' === toString.call(o)); },
    is_string = function( o ) { return (o instanceof String) || ('[object String]' === toString.call(o)); },
    is_number = function( o ) { return (o instanceof Number) || ('[object Number]' === toString.call(o)); },
    is_callable = function( o ) { return "function" === typeof o; },
    trim = String[PROTO].trim
        ? function( s ) { return s.trim( ); }
        : function( s ) { return s.replace(trim_re, ''); },
    length = function( s ) { return s.length > 0; },
    esc_regex = function( s ){ return s.replace(re_escape, '\\$1'); },

    extend = function( o1, o2, deep ) {
        var k, v;
        deep = true === deep;
        if ( o2 )
        {
            for ( k in o2 )
            {
                if ( !HAS.call(o2,k) ) continue;
                v = o2[k];
                if ( is_number(v) ) o1[k] = 0+v;
                else if ( is_string(v) ) o1[k] = v.slice();
                else if ( is_array(v) ) o1[k] = deep ? extend(new Array(v.length), v, deep) : v;
                else if ( is_obj(v) ) o1[k] = deep ? extend({}, v, deep) : v;
                else o1[k] = v;
            }
        }
        return o1;
    },

    // adapted from https://github.com/kvz/phpjs
    uriParser = {
        php: /^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/\/?)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // Added one optional slash to post-scheme to catch file:/// (should restrict this)
    },
    uriComponent = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port',
        'relative', 'path', 'directory', 'file', 'query', 'fragment'],
    parse_url = function(s, component, mode/*, queryKey*/) {
        var m = uriParser[mode || 'php'].exec( s ),
            uri = { }, i = 14//, parser, name
        ;
        while ( i-- )
        {
            if ( m[ i ] )  uri[ uriComponent[ i ] ] = m[ i ]
        }
        if ( HAS.call(uri,'port') ) uri['port'] = parseInt(uri['port'], 10);

        if ( component )
        {
            return uri[ component.replace('PHP_URL_', '').toLowerCase( ) ] || null;
        }

        /*if ( 'php' !== mode )
        {
            name = queryKey || 'queryKey';
            parser = /(?:^|&)([^&=]*)=?([^&]*)/g;
            uri[ name ] = { };
            uri[ uriComponent[12] ].replace(parser, function ($0, $1, $2) {
                if ($1) {uri[name][$1] = $2;}
            });
        }*/
        if ( uri.source ) delete uri.source;
        return uri;
    },
    rawurldecode = function( str ){
        return decodeURIComponent( ''+str );
    },
    rawurlencode = function( str ) {
        return encodeURIComponent( ''+str )
            .split('!').join('%21')
            .split("'").join('%27')
            .split('(').join('%28')
            .split(')').join('%29')
            .split('*').join('%2A')
            //.split('~').join('%7E')
        ;
    },
    urldecode = function( str ) {
        return rawurldecode( ('' + str).split('+').join('%20') );
    },
    urlencode = function( str ) {
        return rawurlencode( str ).split('%20').join('+');
    },
    parse_str = function( str ) {
        var strArr = str.replace(/^&+|&+$/g, '').split('&'),
            sal = strArr.length,
            i, j, ct, p, lastObj, obj, chr, tmp, key, value,
            postLeftBracketPos, keys, keysLen, lastkey,
            array = { }, possibleLists = [ ], prevkey, prevobj
        ;

        for (i=0; i<sal; i++)
        {
            tmp = strArr[ i ].split( '=' );
            key = rawurldecode( trim(tmp[0]) );
            value = (tmp.length < 2) ? '' : rawurldecode( trim(tmp[1]) );

            j = key.indexOf('\x00');
            if ( j > -1 ) key = key.slice(0, j);

            if ( key && '[' !== key.charAt(0) )
            {
                keys = [ ];

                postLeftBracketPos = 0;
                for (j=0; j<key.length; j++)
                {
                    if ( '[' === key.charAt(j)  && !postLeftBracketPos )
                    {
                        postLeftBracketPos = j + 1;
                    }
                    else if ( ']' === key.charAt(j) )
                    {
                        if ( postLeftBracketPos )
                        {
                            if ( !keys.length )
                            {
                                keys.push( key.slice(0, postLeftBracketPos - 1) );
                            }
                            keys.push( key.substr(postLeftBracketPos, j - postLeftBracketPos) );
                            postLeftBracketPos = 0;
                            if ( '[' !== key.charAt(j + 1) ) break;
                        }
                    }
                }

                if ( !keys.length ) keys = [ key ];

                for (j=0; j<keys[0].length; j++)
                {
                    chr = keys[0].charAt(j);
                    if ( ' ' === chr || '.' === chr || '[' === chr )
                    {
                        keys[0] = keys[0].substr(0, j) + '_' + keys[0].substr(j + 1);
                    }
                    if ( '[' === chr ) break;
                }

                obj = array; key = null; lastObj = obj;
                lastkey = keys.length ? trim(keys[ keys.length-1 ].replace(/^['"]|['"]$/g, '')) : null;
                for (j=0, keysLen=keys.length; j<keysLen; j++)
                {
                    prevkey = key;
                    key = keys[ j ].replace(/^['"]|['"]$/g, '');
                    prevobj = lastObj;
                    lastObj = obj;

                    if ( '' !== trim(key) || 0 === j )
                    {
                        if ( !HAS.call(obj,key) ) obj[key] = (j+1 === keysLen-1) && (''===lastkey) ? [ ] : { };
                        obj = obj[ key ];
                    }
                    else
                    {
                        // To insert new dimension
                        /*ct = -1;
                        for ( p in obj )
                        {
                            if ( HAS.call(obj,p) )
                            {
                                if ( +p > ct && p.match(/^\d+$/g) )
                                {
                                    ct = +p;
                                }
                            }
                        }
                        key = ct + 1;*/
                        key = true;
                    }
                }
                if ( true === key )
                {
                    lastObj.push(value);
                }
                else
                {
                    if ( key == +key )
                        possibleLists.push({key:prevkey,obj:prevobj});
                    lastObj[ key ] = value;
                }
            }
        }
        for(i=possibleLists.length-1; i>=0; i--)
        {
            // safe to pass multiple times same obj, it is possible
            obj = possibleLists[i].key ? possibleLists[i].obj[possibleLists[i].key] : possibleLists[i].obj;
            if ( is_numeric_array(obj) )
            {
                obj = array_values(obj);
                if ( possibleLists[i].key )
                    possibleLists[i].obj[possibleLists[i].key] = obj;
                else
                    array = obj;
            }
        }
        return array;
    },
    array_keys = function( o ) {
        if ( 'function' === typeof (Object.keys) ) return Object.keys(o);
        var v, k, l;
        if ( is_array(o) )
        {
            v = new Array(l=o.length);
            for(k=0; k<l; k++)
                v[k] = String(k);
        }
        else
        {
            v = [];
            for(k in o)
                if ( HAS.call(o, k) )
                    v.push(k);
        }
        return v;
    },
    array_values = function( o ) {
        if ( is_array(o) ) return o;
        if ( 'function' === typeof (Object.values) ) return Object.values(o);
        var v = [], k;
        for(k in o)
            if ( HAS.call(o, k) )
                v.push(o[k]);
        return v;
    },
    is_numeric_array = function( o ) {
        if ( is_array(o) ) return true;
        if ( is_obj(o) )
        {
            var k = array_keys(o), i, l = k.length;
            for(i=0; i<l; i++)
                if ( i !== +k[i] ) return false;
            return true;
        }
        return false;
    },
    in_array = function( v, a, strict ) {
        var i, l = a.length;
        if ( true === strict )
        {
            // Array.indexOf uses strict equality
            return (0 < l) && (-1 !== a.indexOf(v));
            /*for(i=0; i<l; i++)
                if ( v===a[i] )
                    return true;*/
        }
        else
        {
            for(i=0; i<l; i++)
                if ( v==a[i] )
                    return true;
        }
        return false;
    },
    // adapted from https://github.com/kvz/phpjs
    http_build_query_helper = function( key, val, arg_separator, PHP_QUERY_RFC3986 ) {
        var k, tmp, encode = PHP_QUERY_RFC3986 ? rawurlencode : urlencode;

        if ( true === val ) val = "1";
        else if ( false === val ) val = "0";

        if ( null != val )
        {
            if ( "object" === typeof(val) )
            {
                tmp = [ ];
                for ( k in val )
                {
                    if ( HAS.call(val,k) && null != val[k] )
                    {
                        tmp.push( http_build_query_helper(key + "[" + k + "]", val[k], arg_separator, PHP_QUERY_RFC3986) );
                    }
                }
                return tmp.join( arg_separator );
            }
            else
            {
                return encode(key) + "=" + encode(val);
            }
        }
        else
        {
            return '';
        }
    },
    http_build_query = function( data, arg_separator, PHP_QUERY_RFC3986 ) {
        var value, key, query, tmp = [ ];

        if ( arguments.length < 2 ) arg_separator = "&";
        if ( arguments.length < 3 ) PHP_QUERY_RFC3986 = false;

        for ( key in data )
        {
            if ( !HAS.call(data,key) ) continue;
            value = data[ key ];
            query = http_build_query_helper(key, value, arg_separator, PHP_QUERY_RFC3986);
            if ( '' != query ) tmp.push( query );
        }

        return tmp.join( arg_separator );
    },

    split = function( s, d1, d2 ) {
        if ( (d1 === d2) || !d2  )
        {
            return s.split( d1 );
        }
        else
        {
            var parts = [ ], part, i;
            s = s.split( d1 );
            for (i=0; i<s.length; i++)
            {
                part = s[ i ];
                part = part.split( d2 );
                parts.push( part[ 0 ] );
                if ( part.length > 1 ) parts.push( part[ 1 ] );
            }
            return parts;
        }
    },

    makePattern = function( _delims, _patterns, pattern ) {
        var i, l, isPattern, p, m, numGroups = 0, types = { }, tpl, tplPattern, pat;

        pattern = split( pattern, _delims[2], _delims[3] );
        p = [ ];
        tpl = [ ];
        tplPattern = null;
        l = pattern.length;
        isPattern = false;
        for (i=0; i<l; i++)
        {
            if ( isPattern )
            {
                if ( pattern[ i ].length )
                {
                    if ( HAS.call(_patterns, pattern[ i ] ) )
                    {
                        p.push( '(' + _patterns[ pattern[ i ] ][ 0 ] + ')' );
                        numGroups++;
                        // typecaster
                        if ( _patterns[ pattern[ i ] ][ 1 ] ) types[numGroups] = _patterns[ pattern[ i ] ][ 1 ];
                        if ( null === tplPattern ) tplPattern = p[ p.length-1 ];
                    }
                    else if ( (m = pattern[ i ].match( _patternOr )) )
                    {
                        p.push( '(' + m[ 1 ].split('|').filter( length ).map( esc_regex ).join('|') + ')' );
                        numGroups++;
                        if ( null === tplPattern ) tplPattern = p[ p.length-1 ];
                    }
                    else if ( pattern[ i ].length )
                    {
                        p.push( '(' + esc_regex( pattern[ i ] ) + ')' );
                        numGroups++;
                        if ( null === tplPattern ) tplPattern = p[ p.length-1 ];
                    }
                }
                tpl.push( true );
                isPattern = false;
            }
            else
            {
                if ( pattern[ i ].length )
                {
                    p.push( esc_regex( pattern[ i ] ) );
                    tpl.push( pattern[ i ] );
                }
                isPattern = true;
            }
        }
        if ( 1 === p.length && 1 === numGroups )
        {
            types[0] = types[1] ? types[1] : null;
            pat = p.join('');
            return [pat, numGroups, types, tpl, tplPattern ? tplPattern : pat];
        }
        else
        {
            types[0] = null;
            pat = '(' + p.join('') + ')';
            return [pat, numGroups+1, types, tpl, tplPattern ? tplPattern : pat];
        }
    },

    makeRoute = function( _delims, _patterns, route, method, prefix ) {
        var parts, part, i, l, isOptional, isCaptured,
            isPattern, pattern, p, m, numGroups, patternTypecaster,
            captures, captureName, capturePattern, captureIndex,
            tpl
        ;
        if ( 0 > route.indexOf(_delims[ 0 ]) )
        {
            // literal route
            return [ route, prefix && prefix.length ? prefix+route : route, {}, method, true, [route] ];
        }
        parts = split( route, _delims[ 0 ], _delims[ 1 ] );
        l = parts.length;
        isPattern = false;
        pattern = '';
        numGroups = 0;
        captures = { };
        tpl = [ ];
        if ( prefix && prefix.length )  pattern += esc_regex( prefix );

        for (i=0; i<l; i++)
        {
            part = parts[ i ];
            if ( isPattern )
            {
                isOptional = false;
                isCaptured = false;
                patternTypecaster = null;

                // http://abc.org/{%ALFA%:user}{/%NUM%:?id(1)}
                p = part.split( _delims[ 4 ] );
                if ( !p[ 0 ].length )
                {
                    // http://abc.org/{:user}/{:?id}
                    // assume pattern is %PART%
                    p[ 0 ] = _delims[2]+'PART'+_delims[3];
                }
                capturePattern = makePattern( _delims, _patterns, p[ 0 ] );

                if ( p.length > 1 )
                {
                    captureName = trim( p[ 1 ] );
                    isOptional = (captureName.length && '?' === captureName.charAt(0));
                    if ( isOptional ) captureName = captureName.slice( 1 );

                    if ( (m = captureName.match( _group )) )
                    {
                        captureName = captureName.slice(0, -m[0].length);
                        captureIndex = parseInt(m[1], 10);
                        patternTypecaster = HAS.call(capturePattern[2],captureIndex)
                                ? capturePattern[2][captureIndex]
                                : null;
                        if ( captureIndex >= 0 && captureIndex < capturePattern[1] )
                        {
                            captureIndex += numGroups + 1;
                        }
                        else
                        {
                            captureIndex = numGroups + 1;
                        }
                    }
                    else
                    {
                        patternTypecaster = capturePattern[2][0]
                                ? capturePattern[2][0]
                                : null;
                        captureIndex = numGroups + 1;
                    }

                    isCaptured = (captureName.length > 0);
                }

                pattern += capturePattern[ 0 ];
                numGroups += capturePattern[ 1 ];
                if ( isOptional ) pattern += '?';
                if ( isCaptured ) captures[ captureName ] = [captureIndex, patternTypecaster];
                if ( isCaptured )
                    tpl.push({
                        name        : captureName,
                        optional    : isOptional,
                        re          : new RegExp('^' + capturePattern[ 4 ] + '$'),
                        tpl         : capturePattern[ 3 ]
                    });
                isPattern = false;
            }
            else
            {
                pattern += esc_regex( part );
                tpl.push( part );
                isPattern = true;
            }
        }
        return [ route, new RegExp('^' + pattern + '$'), captures, method, false, tpl ];
    },

    to_key = function( route, method ){
        return method.join(',') + '->' + route;
    },

    to_method = function( method ){
        method = method ? (method.map ? method.map(function(x){return x.toLowerCase()}) : [String(method).toLowerCase()]) : ['*'];
        if ( in_array('*', method) ) method = ['*'];
        method.sort();
        return method;
    },

    clearRoute = function( routes, named_routes, key ) {
        var i, l = routes.length, r;
        for (i=l-1; i>=0; i--)
        {
            if ( key === routes[ i ].key )
            {
                if ( route.name && HAS.call(named_routes,route.name) )
                    delete named_routes[route.name];
                routes[ i ].dispose( );
                routes.splice( i, 1 );
            }
        }
    },

    addRoute = function( routes, named_routes, delims, patterns, prefix, route, oneOff ) {
        if ( route && is_string(route.route) && route.route.length &&
            route.handler && is_callable(route.handler) )
        {
            oneOff = (true === oneOff);
            var handler = route.handler,
                defaults = route.defaults || {},
                types = route.types || null,
                name = route.name || null,
                method = to_method(route.method),
                h, r, i, l, key;
            route = route.route;
            key = to_key(route, method);

            r = null;
            for(i=0,l=routes.length; i<l; i++)
            {
                if ( key === routes[i].key )
                {
                    r = routes[i];
                    break;
                }
            }
            if ( !r )
            {
                r = new Route( delims, patterns, route, method, name, prefix );
                routes.push( r );
                if ( r.name && r.name.length ) named_routes[r.name] = r;
            }
            r.handlers.push( [handler, defaults, types, oneOff, 0] );
        }
    },

    addRoutes = function( routes, named_routes, delims, patterns, prefix, args, oneOff ) {
        var route, i;
        oneOff = !!oneOff;
        for (i=0; i<args.length; i++)
        {
            route = args[i];
            addRoute(routes, named_routes, delims, patterns, prefix, route, oneOff);
        }
    }
;

function Route( delims, patterns, route, method, name, prefix )
{
    var self = this;
    self.__args__ = [ delims, patterns ];
    self.isParsed = false; // lazy init
    self.handlers = [ ];
    self.route = null != route ? String(route) : '';
    self.prefix = null != prefix ? String(prefix) : '';
    self.method = method;
    self.pattern = null;
    self.captures = null;
    self.literal = false;
    self.namespace = null;
    self.tpl = null;
    self.name = null != name ? String(name) : null;
    self.key = to_key(self.route, self.method);
}
Route.to_key = to_key;
Route[PROTO] = {
    constructor: Route,
    __args__: null,
    isParsed: false,
    handlers: null,
    route: null,
    prefix: null,
    pattern: null,
    captures: null,
    tpl: null,
    method: null,
    literal: null,
    namespace: null,
    name: null,
    key: null,

    dispose: function( ) {
        var self = this;
        self.__args__ = null;
        self.isParsed = null;
        self.handlers = null;
        self.route = null;
        self.prefix = null;
        self.pattern = null;
        self.captures = null;
        self.tpl = null;
        self.method = null;
        self.literal = null;
        self.namespace = null;
        self.name = null;
        self.key = null;
        return self;
    },

    parse: function( ) {
        var self = this;
        if ( self.isParsed ) return self;
        var r = makeRoute( self.__args__[0], self.__args__[1], self.route, self.method, self.prefix );
        self.pattern = r[ 1 ];
        self.captures = r[ 2 ];
        self.tpl = r[ 5 ];
        self.literal = true === r[ 4 ];
        self.__args__ = null;
        self.isParsed = true;
        return self;
    },

    match: function( route, method ) {
        var self = this;
        method = method || '*';
        if ( !in_array(method, self.method) && '*' !== self.method[0] ) return null;
        if ( !self.isParsed ) self.parse(); // lazy init
        route = String(route);
        return self.literal ? (route === self.pattern ? [] : null) : route.match(self.pattern);
    },

    make: function( params, strict ) {
        var self = this, out = '', i, l, j, k, param, part, tpl;
        params = params || {};
        strict = true === strict;
        if ( !self.isParsed ) self.parse( ); // lazy init
        tpl = self.tpl;
        for(i=0,l=tpl.length; i<l; i++)
        {
            if ( is_string(tpl[i]) )
            {
                out += tpl[i];
            }
            else
            {
                if ( !HAS.call(params, tpl[i].name) || (null == params[tpl[i].name]) )
                {
                    if ( tpl[i].optional )
                    {
                        continue;
                    }
                    else
                    {
                        throw new ReferenceError('Dromeo: Route "'+self.name+'" (Pattern: "'+self.route+'") missing parameter "'+tpl[i].name+'"!');
                    }
                }
                else
                {
                    param = String(params[tpl[i].name]);
                    if ( strict && !tpl[i].re.test(param) )
                    {
                        throw new ReferenceError('Dromeo: Route "'+self.name+'" (Pattern: "'+self.route+'") parameter "'+tpl[i].name+'" value "'+param+'" does not match pattern!');
                    }
                    part = tpl[i].tpl;
                    for(j=0,k=part.length; j<k; j++)
                    {
                        out += true === part[j] ? param : part[j];
                    }
                }
            }
        }
        return out;
    },

    sub: function( match, data, type ) {
        var self = this, v, g, groupIndex, groupTypecaster, typecaster;

        if ( !self.isParsed || self.literal ) return self;

        for (v in self.captures)
        {
            if ( !HAS.call(self.captures,v) ) continue;
            g = self.captures[ v ];
            groupIndex = g[0];
            groupTypecaster = g[1];
            if ( match[ groupIndex ] )
            {
                if ( type && HAS.call(type, v ) && type[ v ] )
                {
                    typecaster = type[ v ];
                    if ( is_string(typecaster) && HAS.call(Dromeo.TYPES,typecaster) )
                        typecaster = Dromeo.TYPES[typecaster];
                    data[ v ] = is_callable(typecaster) ? typecaster( match[ groupIndex ] ) : match[ groupIndex ];
                }
                else if ( groupTypecaster )
                {
                    typecaster = groupTypecaster;
                    data[ v ] = is_callable(typecaster) ? typecaster( match[ groupIndex ] ) : match[ groupIndex ];
                }
                else
                {
                    data[ v ] = match[ groupIndex ];
                }
            }
            else if ( !HAS.call(data, v ) )
            {
                data[ v ] = null;
            }
        }
        return self;
    }
};

function Dromeo( route_prefix )
{
    var self = this;
    // constructor factory method
    if ( !(self instanceof Dromeo) ) return new Dromeo( route_prefix );
    self._delims = ['{', '}', '%', '%', ':'];
    self._patterns = { },
    self.definePattern( 'ALPHA',      '[a-zA-Z\\-_]+' );
    self.definePattern( 'ALNUM',      '[a-zA-Z0-9\\-_]+' );
    self.definePattern( 'NUMBR',      '[0-9]+' );
    self.definePattern( 'INT',        '[0-9]+',          'INT' );
    self.definePattern( 'PART',       '[^\\/?#]+' );
    self.definePattern( 'VAR',        '[^=?&#\\/]+',     'VAR' );
    self.definePattern( 'QUERY',      '\\?[^?#]+' );
    self.definePattern( 'FRAGMENT',   '#[^?#]+' );
    self.definePattern( 'URLENCODED', '[^\\/?#]+',       'URLENCODED' );
    self.definePattern( 'ALL',     '.+' );
    self._routes = [ ];
    self._named_routes = { };
    self._fallback = false;
    self._prefix = null!=route_prefix ? String(route_prefix) : '';
};


// default typecasters
function type_to_int( v ) { return parseInt(v, 10) || 0; }
function type_to_str( v ) { return is_string(v) ? v : '' + String(v); }
function type_to_urldecode( v ) { return urldecode(v); }
function type_to_array( v ) { return is_array(v) ? v : [v]; }
function type_to_params( v ) { return is_string(v) ? Dromeo.unglue_params(v) : v; }

Dromeo.VERSION = __version__;
Dromeo.HTTP_STATUS = HTTP_STATUS;
Dromeo.Route = Route;
Dromeo.to_method = to_method;
Dromeo.TYPES = {
 'INTEGER'  : type_to_int
,'STRING'   : type_to_str
,'URLDECODE': type_to_urldecode
,'ARRAY'    : type_to_array
,'PARAMS'   : type_to_params
};
// aliases
Dromeo.TYPES['INT']         = Dromeo.TYPES['INTEGER'];
Dromeo.TYPES['STR']         = Dromeo.TYPES['STRING'];
Dromeo.TYPES['VAR']         = Dromeo.TYPES['URLDECODE'];
Dromeo.TYPES['URLENCODED']  = Dromeo.TYPES['PARAMS'];

// build/glue together a uri component from a params object
Dromeo.glue_params = function( params ) {
    var component = '';
    // http://php.net/manual/en/function.http-build-query.php
    if ( params )  component += http_build_query( params, '&', true );
    return component;
};
// unglue/extract params object from uri component
Dromeo.unglue_params = function( s ) {
    var PARAMS = s ? parse_str( s ) : { };
    return PARAMS;
};
// parse and extract uri components and optional query/fragment params
Dromeo.parse_components = function( s, query_p, fragment_p ) {
    var self = this, COMPONENTS = { };
    if ( s )
    {
        if ( arguments.length < 3 || null == fragment_p ) fragment_p = 'fragment_params';
        if ( arguments.length < 2 || null == query_p ) query_p = 'query_params';

        COMPONENTS = parse_url( s );

        if ( query_p )
        {
            if ( COMPONENTS[ 'query' ] )
                COMPONENTS[ query_p ] = self.unglue_params( COMPONENTS[ 'query' ] );
            else
                COMPONENTS[ query_p ] = { };
        }
        if ( fragment_p )
        {
            if ( COMPONENTS[ 'fragment' ] )
                COMPONENTS[ fragment_p ] = self.unglue_params( COMPONENTS[ 'fragment' ] );
            else
                COMPONENTS[ fragment_p ] = { };
        }
    }
    return COMPONENTS;
};
// build a url from baseUrl plus query/hash params
Dromeo.build_components = function( baseUrl, query, hash, q, h ) {
    var self = this,
        url = '' + baseUrl;
    if ( arguments.length < 5 || null == h ) h = '#';
    if ( arguments.length < 4 || null == q ) q = '?';
    if ( query )  url += q + self.glue_params( query );
    if ( hash )  url += h + self.glue_params( hash );
    return url;
};
Dromeo.defType = function( type, caster ) {
    if ( type && is_callable(caster) ) Dromeo.TYPES[ type ] = caster;
};
Dromeo.TYPE = function( type ) {
    if ( type && HAS.call(Dromeo.TYPES,type) ) return Dromeo.TYPES[ type ];
    return null;
};
Dromeo[PROTO] = {
    constructor: Dromeo,

    _delims: null,
    _patterns: null,
    _routes: null,
    _named_routes: null,
    _fallback: false,
    _prefix: '',

    dispose: function( ) {
        var self = this, i, l;
        self._delims = null;
        self._patterns = null;
        self._fallback = null;
        self._prefix = null;
        if ( self._routes )
        {
            for ( i=0,l=self._routes.length; i<l; i++ )
            {
                self._routes[i].dispose( );
            }
        }
        self._routes = null;
        self._named_routes = null;
        return self;
    },

    reset: function( ) {
        var self = this;
        self._routes = [ ];
        self._named_routes = { };
        self._fallback = false;
        return self;
    },

    /*debug: function( ) {
        console.log('Routes: ');
        console.log(this._routes);
        console.log('Fallback: ');
        console.log(this._fallback);
    },*/

    defineDelimiters: function( delims ) {
        var self = this, _delims = self._delims, l;
        if ( delims )
        {
            l = delims.length;
            if ( l > 0 && delims[0] ) _delims[0] = delims[0];
            if ( l > 1 && delims[1] ) _delims[1] = delims[1];
            if ( l > 2 && delims[2] ) _delims[2] = delims[2];
            if ( l > 3 && delims[3] ) _delims[3] = delims[3];
            if ( l > 4 && delims[4] ) _delims[4] = delims[4];
        }
        return self;
    },

    definePattern: function( className, subPattern, typecaster )  {
        var self = this;
        if ( typecaster &&
            is_string(typecaster) && typecaster.length &&
            HAS.call(Dromeo.TYPES,typecaster)
        ) typecaster = Dromeo.TYPES[ typecaster ];

        if ( !typecaster || !is_callable(typecaster) ) typecaster = null;
        self._patterns[ className ] = [subPattern, typecaster];
        return self;
    },

    dropPattern: function( className ) {
        var self = this, patterns = self._patterns;
        if ( HAS.call(patterns, className ) )
            delete patterns[ className ];
        return self;
    },

    defineType: function( type, caster )  {
        Dromeo.defType( type, caster );
        return this;
    },

    // build/glue together a uri component from a params object
    glue: function( params ) {
        return Dromeo.glue_params( params );
    },

    // unglue/extract params object from uri component
    unglue: function( s ) {
        return Dromeo.unglue_params( s );
    },

    // parse and extract uri components and optional query/fragment params
    parse: function( s, query_p, fragment_p ) {
        return Dromeo.parse_components( s, query_p, fragment_p );
    },

    // build a url from baseUrl plus query/hash params
    build: function( baseUrl, query, hash, q, h ) {
        return Dromeo.build_components( baseUrl, query, hash, q, h );
    },

    redirect: function( url, response, statusCode, statusMsg ) {
        // node redirection based on http module
        // http://nodejs.org/api/http.html#http_http
        if ( url )
        {
            if ( !isNode )
            {
                document.location.href = url;
                // make sure document is reloaded in case only hash changes
                //document.location.reload( true );
            }
            else if ( response )
            {
                if ( arguments.length < 3 ) statusCode = 302;
                if ( arguments.length < 4 ) statusMsg = true;

                if ( statusMsg )
                {
                    if ( true === statusMsg ) statusMsg = Dromeo.HTTP_STATUS[statusCode] || '';
                    response.writeHead( statusCode, statusMsg, {"Location": url} );
                }
                else
                {
                    response.writeHead( statusCode, {"Location": url} );
                }
                response.end( );
            }
        }
        return this;
    },

    on: function( /* var args here .. */ ) {
        var self = this, args = arguments,
            args_len = args.length, routes
        ;

        if ( 1 === args_len )
        {
            routes = is_array(args[ 0 ]) ? args[ 0 ] : [args[ 0 ]];
        }
        else if ( 2 === args_len && is_string(args[0]) && is_callable(args[1]) )
        {
            routes = [{route: args[0], handler: args[1], method: '*', defaults: {}, types: null}];
        }
        else
        {
            routes = args;
        }
        addRoutes( self._routes, self._named_routes, self._delims, self._patterns, self._prefix, routes );
        return self;
    },

    one: function( /* var args here .. */ ) {
        var self = this, args = arguments,
            args_len = args.length, routes
        ;

        if ( 1 === args_len )
        {
            routes = is_array(args[ 0 ]) ? args[ 0 ] : [args[ 0 ]];
        }
        else if ( 2 === args_len && is_string(args[0]) && is_callable(args[1]) )
        {
            routes = [{route: args[0], handler: args[1], method: '*', defaults: {}, types: null}];
        }
        else
        {
            routes = args;
        }
        addRoutes( self._routes, self._named_routes, self._delims, self._patterns, self._prefix, routes, true );
        return self;
    },

    off: function( route, handler, method ) {
        var self = this,
            routes = self._routes,
            named_routes = self._named_routes,
            prefix = self._prefix,
            i, r, l, key;

        if ( !route ) return self;
        if ( null == method ) method = '*';

        if ( is_obj(route) )
        {
            handler = route.handler || handler;
            method = route.method || method;
            route = route.route;
            if ( !route ) return self;
            route = String(route);
            key = to_key(route, to_method(method));
            r = null;
            for(i=0,l=routes.length; i<l; i++)
            {
                if ( key === routes[i].key )
                {
                    r = routes[i];
                    break;
                }
            }

            if ( !r ) return self;

            if ( handler && is_callable(handler) )
            {
                l = r.handlers.length;
                for (i=l-1; i>=0; i--)
                {
                    if ( handler === r.handlers[ i ][0] )
                        r.handlers.splice( i, 1 );
                }
                if ( !r.handlers.length )
                    clearRoute( routes, named_routes, key );
            }
            else
            {
                clearRoute( routes, named_routes, key );
            }
        }
        else if ( is_string(route) && route.length )
        {
            route = String(route);
            key = to_key(route, to_method(method));
            r = null;
            for(i=0,l=routes.length; i<l; i++)
            {
                if ( key === routes[i].key )
                {
                    r = routes[i];
                    break;
                }
            }

            if ( !r ) return self;

            if ( handler && is_callable(handler) )
            {
                l = r.handlers.length;
                for (i=l-1; i>=0; i--)
                {
                    if ( handler === r.handlers[ i ][0] )
                        r.handlers.splice( i, 1 );
                }
                if ( !r.handlers.length )
                    clearRoute( routes, named_routes, key );
            }
            else
            {
                clearRoute( routes, named_routes, key );
            }
        }
        return self;
    },

    fallback: function( handler ) {
        var self = this;
        if ( 1 > arguments.length ) handler = false;
        if ( false === handler || null === handler || is_callable( handler ) )
            self._fallback = handler;
        return self;
    },

    make: function( named_route, params, strict ) {
        var routes = this._named_routes;
        return HAS.call(routes, named_route) ? routes[named_route].make( params, strict ) : null;
    },

    route: function( r, method, breakOnFirstMatch ) {
        var self = this, routes,
            route, params, defaults, type,
            i, l, lh, h, match, handlers, handler, found;
        ;
        r = null != r ? String(r) : '';
        method = null != method ? String(method).toLowerCase( ) : '*';
        breakOnFirstMatch = false !== breakOnFirstMatch;
        routes = self._routes.slice( ); // copy, avoid mutation
        found = false;
        l = routes.length;
        for (i=0; i<l; i++)
        {
            route = routes[ i ];
            match = route.match(r, method);
            if ( null == match ) continue;

            found = true;

            // copy handlers, avoid mutation during calls
            handlers = route.handlers.slice( 0 );

            // make calls
            lh = handlers.length;
            for (h=0; h<lh; h++)
            {
                handler = handlers[ h ];
                // handler is oneOff and already called
                if ( handler[3] && handler[4] ) continue;

                defaults = handler[1];
                type = handler[2];
                params = {
                    route: r,
                    method: method,
                    pattern: route.route,
                    fallback: false,
                    data: extend({}, defaults, true)
                };

                route.sub(match, params.data, type);

                handler[4] = 1; // handler called
                handler[0]( params );
            }

            // remove called oneOffs
            /*for (h=route.handlers.length-1; h>=0; h--)
            {
                // handler is oneOff and already called once
                handler = route.handlers[h];
                if ( handler[3] && handler[4] ) route.handlers.splice(h, 1);
            }
            if ( !route.handlers.length )
                clearRoute( self._routes, route.key );*/

            if ( breakOnFirstMatch ) return true;
        }
        if ( found ) return true;

        if ( self._fallback )
        {
            self._fallback( {route: r, method: method, pattern: null, fallback: true, data: null} );
        }
        return false;
    }
};

// export it
return Dromeo;
});