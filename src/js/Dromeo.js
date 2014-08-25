/**
*
*   Dromeo
*   Simple and Flexible Routing Framework for PHP, Python, Node/JS
*   @version: 0.5
*
*   https://github.com/foo123/Dromeo
*
**/
!function (root, moduleName, moduleDefinition) {

    //
    // export the module
    
    // node, CommonJS, etc..
    if ( 'object' == typeof(module) && module.exports ) module.exports = moduleDefinition();
    
    // AMD, etc..
    else if ( 'function' == typeof(define) && define.amd ) define( moduleDefinition );
    
    // browser, etc..
    else root[ moduleName ] = moduleDefinition();


}(this, 'Dromeo', function( undef ) {
    "use strict";
    
    var __version__ = "0.5", 
        // http://en.wikipedia.org/wiki/List_of_HTTP_status_codes
        HTTP_STATUS = {
            // 1xx Informational
            100: "Continue"
            ,101: "Switching Protocols"
            ,102: "Processing"
            
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
            ,302: "Found"
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
        
        _patternOr = /^([a-zA-Z0-9-_]+\|[a-zA-Z0-9-_|]+)$/,
        _nested = /\[([^\]]*?)\]$/,
        _group = /\((\d+)\)$/,
        
        // auxilliaries
        OP = Object.prototype, AP = Array.prototype, FP = Function.prototype,
        hasOwn = FP.call.bind(OP.hasOwnProperty), toString = FP.call.bind(OP.toString), slice = FP.call.bind(AP.slice),
        isNode = "undefined" !== typeof(global) && '[object global]' == toString(global),
        is_array = function( o ) { return ('[object Array]' === toString(o)) || (o instanceof Array); },
        is_callable = function( o ) { return ('[object Function]' === toString(o)) || (o instanceof Function); },
        trim = function( s ) { return s.replace(/^\s+/, '').replace(/\s+$/, ''); },
        length = function( s ) { return s.length > 0; },
        esc_regex = function( s ){ return s.replace(/([*+\[\]\(\)?^$\/\\:])/g, '\\$1'); },
        
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
            if ( 'port' in uri ) uri['port'] = parseInt(uri['port'], 10);
            
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
            var strArr = str.replace(/^&/, '').replace(/&$/, '').split('&'),
                sal = strArr.length,
                i, j, ct, p, lastObj, obj, chr, tmp, key, value,
                postLeftBracketPos, keys, keysLen,
                array = { }
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

                    obj = array;
                    for (j=0, keysLen=keys.length; j<keysLen; j++) 
                    {
                        key = keys[ j ].replace(/^['"]/, '').replace(/['"]$/, '');
                        lastObj = obj;
                        
                        if ( ('' !== key && ' ' !== key) || 0 === j ) 
                        {
                            if ( undef === obj[key] ) obj[key] = { };
                            obj = obj[ key ];
                        }
                        else 
                        { 
                            // To insert new dimension
                            ct = -1;
                            for ( p in obj ) 
                            {
                                if ( hasOwn(obj, p) ) 
                                {
                                    if ( +p > ct && p.match(/^\d+$/g) ) 
                                    {
                                        ct = +p;
                                    }
                                }
                            }
                            key = ct + 1;
                        }
                    }
                    lastObj[ key ] = value;
                }
            }
            return array;
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
                        if ( null != val[k] ) 
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
                value = data[ key ];
                query = http_build_query_helper(key, value, arg_separator, PHP_QUERY_RFC3986);
                if ( '' != query ) tmp.push( query );
            }

            return tmp.join( arg_separator );
        },
        
        split = function( s, d1, d2 ) {
            if ( !d2 ) 
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
            var i, l, isPattern, p, m, numGroups = 0;
            
            pattern = split( pattern, _delims[3] );
            p = [ ];
            l = pattern.length;
            isPattern = false;
            for (i=0; i<l; i++)
            {
                if ( isPattern )
                {
                    if ( pattern[ i ].length )
                    {
                        if ( _patterns[ pattern[ i ] ] )
                        {
                            p.push( '(' + _patterns[ pattern[ i ] ] + ')' );
                            numGroups++;
                        }
                        else if ( (m = pattern[ i ].match( _patternOr )) )
                        {
                            p.push( '(' + m[ 1 ].split('|').filter( length ).map( esc_regex ).join('|') + ')' );
                            numGroups++;
                        }
                        else
                        {
                            p.push( esc_regex( pattern[ i ] ) );
                        }
                    }
                    isPattern = false;
                }
                else
                {
                    if ( pattern[ i ].length )
                    {
                        p.push( esc_regex( pattern[ i ] ) );
                    }
                    isPattern = true;
                }
            }
            if ( 1 === p.length && 1 === numGroups )
                return [p.join(''), numGroups];
            else
                return ['(' + p.join('') + ')', numGroups+1];
        },
    
        makeRoute = function( _delims, _patterns, route ) {
            var parts, part, i, l, isOptional, isCaptured,
                isPattern, pattern, p, m, numGroups, 
                captures, captureName, capturePattern, captureIndex
            ;
            parts = split( route, _delims[ 0 ], _delims[ 1 ] );
            l = parts.length;
            isPattern = false;
            pattern = '';
            numGroups = 0;
            captures = { };
            
            for (i=0; i<l; i++)
            {
                part = parts[ i ];
                if ( isPattern )
                {
                    isOptional = false;
                    isCaptured = false;
                    
                    // http://abc.org/{%ALFA%:user}{/%NUM%:?id(1)}
                    p = part.split( _delims[ 2 ] );
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
                            captureIndex = numGroups + 1;
                        }
                        
                        isCaptured = (captureName.length > 0);
                    }
                    
                    pattern += capturePattern[ 0 ];
                    numGroups += capturePattern[ 1 ];
                    if ( isOptional ) pattern += '?';
                    if ( isCaptured ) captures[ captureName ] = captureIndex;
                    isPattern = false;
                }
                else
                {
                    pattern += esc_regex( part );
                    isPattern = true;
                }
            }
            return new Route( route, new RegExp('^' + pattern + '$'), captures );
        },
        
        clearRoute = function( handlers, routes, route ) {
            delete handlers[ route ];
            var i, l = routes.length;
            for (i=l-1; i>=0; i--)
            {
                if ( route === routes[ i ].route )
                {
                    routes.splice( i, 1 );
                    break;
                }
            }
        },

        addRoute = function( handlers, routes, delims, patterns, route, handler, defaults, oneOff ) {
            if ( route && route.length && handler && ("function"===typeof(handler)) )
            {
                oneOff = (true === oneOff);
                defaults = defaults || {};
                
                if ( route in handlers )
                {
                    handlers[ route ].handlers.push( [handler, defaults, oneOff] );
                }
                else
                {
                    handlers[ route ] = makeRoute( delims, patterns, route );
                    handlers[ route ].handlers.push( [handler, defaults, oneOff] );
                    routes.push( handlers[ route ] );
                }
            }
        }
    ;
    
    function Route( route, pattern, captures ) 
    {
        var self = this;
        self.handlers = [ ];
        self.route = route;
        self.pattern = pattern;
        self.captures = captures;
        
        self.dispose = function( ) {
            self.handlers = null;
            self.route = null;
            self.pattern = null;
            self.captures = null;
            return self;
        };
    }
    
    var Dromeo = function( ) {
        var self = this;
        self._delims = ['{', '}', ':', '%'];
        self._patterns = { },
        self.definePattern( 'ALPHA',   '[a-zA-Z\\-_]+' );
        self.definePattern( 'NUMBR',   '[0-9]+' );
        self.definePattern( 'ALNUM',   '[a-zA-Z0-9\\-_]+' );
        self.definePattern( 'QUERY',   '\\?[^?#]+' );
        self.definePattern( 'FRAGM',   '#[^?#]+' );
        self.definePattern( 'ALL',     '.+' );
        self._handlers = [ ];
        self._routes = [ ];
        self._fallback = false;
    };
    Dromeo.VERSION = __version__;
    Dromeo.Route = Route;
    Dromeo.prototype = {
        constructor: Dromeo,
        
        _delims: null,
        _patterns: null,
        _handlers: null,
        _routes: null,
        _fallback: false,
        
        dispose: function( ) {
            var self = this, r;
            self._delims = null;
            self._patterns = null;
            self._routes = null;
            self._fallback = null;
            for ( r in self._handlers ) self._handlers[ r ].dispose( );
            self._handlers = null;
            return self;
        },
        
        reset: function( ) {
            this._handlers = { };
            this._routes = [ ];
            this._fallback = false;
            return this;
        },
        
        /*debug: function( ) {
            console.log('Routes: '); 
            console.log(this._routes); 
            console.log('Fallback: ');
            console.log(this._fallback);
        },*/
    
        defineDelimiters: function( delims ) {
            var self = this, l;
            if ( delims )
            {
                l = delims.length;
                if ( l > 0 && delims[0] ) self._delims[0] = delims[0];
                if ( l > 1 && delims[1] ) self._delims[1] = delims[1];
                if ( l > 2 && delims[2] ) self._delims[2] = delims[2];
                if ( l > 3 && delims[3] ) self._delims[3] = delims[3];
            }
            return self;
        },
        
        definePattern: function( className, subPattern )  {
            this._patterns[ className ] = subPattern;
            return this;
        },
        
        dropPattern: function( className ) {
            if ( className in this._patterns )
                delete this._patterns[ className ];
            return this;
        },
        
        // parse and extract uri components and optional query/fragment params
        parse: function( s, query_p, fragment_p ) {
            var COMPONENTS = { };
            if ( s )
            {
                if ( arguments.length < 3 ) fragment_p = 'fragment_params';
                if ( arguments.length < 2 ) query_p = 'query_params';
                
                COMPONENTS = parse_url( s );
                
                if ( query_p ) 
                {
                    if ( COMPONENTS[ 'query' ] ) 
                        COMPONENTS[ query_p ] = this.unglue( COMPONENTS[ 'query' ] );
                    else
                        COMPONENTS[ query_p ] = { };
                }
                if ( fragment_p )
                {
                    if ( COMPONENTS[ 'fragment' ] ) 
                        COMPONENTS[ fragment_p ] = this.unglue( COMPONENTS[ 'fragment' ] );
                    else
                        COMPONENTS[ fragment_p ] = { };
                }
            }
            return COMPONENTS;
        },

        // unglue/extract params object from uri component
        unglue: function( s ) {
            var PARAMS;
            if ( s ) PARAMS = parse_str( s );
            else PARAMS = { };
            return PARAMS;
        },

        // build a url from baseUrl plus query/hash params
        build: function( baseUrl, query, hash, q, h ) {
            var url = '' + baseUrl;
            if ( arguments.length < 5 ) h = '#';
            if ( arguments.length < 4 ) q = '?';
            if ( query )  url += q + this.glue( query );
            if ( hash )  url += h + this.glue( hash );
            return url;
        },
        
        // build/glue together a uri component from a params object
        glue: function( params ) {
            var component = '';
            // http://php.net/manual/en/function.http-build-query.php
            if ( params )  component += http_build_query( params, '&', true );
            return component;
        },
        
        redirect: function( url, response, statusCode, statusMsg ) {
            // node redirection based on http module
            // http://nodejs.org/api/http.html#http_http
            if ( url )
            {
                if ( !isNode )
                {
                    document.location.href = url;
                }
                else if ( response )
                {
                    if ( arguments.length < 3 ) statusCode = 302;
                    if ( arguments.length < 4 ) statusMsg = true;
                    
                    if ( statusMsg )
                    {
                        if ( true === statusMsg ) statusMsg = HTTP_STATUS[statusCode] || '';
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
            var self = this, args = slice( arguments ),
                args_len = args.length,
                route, i, defaults
            ;
            
            if ( 2 <= args_len )
            {
                route = args; 
                defaults = route[2] || null;
                addRoute(self._handlers, self._routes, self._delims, self._patterns, route[0], route[1], defaults);
            }
            else if ( 1 === args_len && (args[ 0 ] instanceof Array) )
            {
                args = args[ 0 ];
                args_len = args.length;
                for (i=0; i<args_len; i++)
                {
                    route = args[i];
                    if ( route.length >= 2 )
                    {
                        defaults = route[2] || null;
                        addRoute(self._handlers, self._routes, self._delims, self._patterns, route[0], route[1], defaults);
                    }
                }
            }
            return self;
        },
        
        one: function( /* var args here .. */ ) {
            var self = this, args = slice( arguments ),
                args_len = args.length,
                route, i, defaults
            ;
            
            if ( 2 <= args_len )
            {
                route = args; 
                defaults = route[2] || null;
                addRoute(self._handlers, self._routes, self._delims, self._patterns, route[0], route[1], defaults, true);
            }
            else if ( 1 === args_len && (args[ 0 ] instanceof Array) )
            {
                args = args[ 0 ];
                args_len = args.length;
                for (i=0; i<args_len; i++)
                {
                    route = args[i];
                    if ( route.length >= 2 )
                    {
                        defaults = route[2] || null;
                        addRoute(self._handlers, self._routes, self._delims, self._patterns, route[0], route[1], defaults, true);
                    }
                }
            }
            return self;
        },
        
        off: function( route, handler ) {
            var self = this, routes = self._routes, handlers = self._handlers,
                i, r, l;
            
            if ( route && (route in handlers) )
            {
                if ( handler && is_callable(handler) )
                {
                    r = handlers[ route ];
                    l = r.handlers.length;
                    for (i=l-1; i>=0; i--)
                    {
                        if ( handler === r.handlers[ i ][0] )
                        {
                            r.handlers.splice( i, 1 );
                        }
                    }
                    if ( !r.handlers.length )
                        clearRoute( handlers, routes, route );
                }
                else
                {
                    clearRoute( handlers, routes, route );
                }
            }
            return self;
        },
        
        fallback: function( handler ) {
            if ( 1 > arguments.length ) handler = false;
            if ( false === handler || null === handler || is_callable( handler ) )
                this._fallback = handler;
            return this;
        },
        
        route: function( r ) {
            var self = this, routes = self._routes, 
                route, params, i, l, lh, h, m, v, g, 
                handlers, handler, oneOffs
            ;
            
            if ( r )
            {
                l = routes.length;
                for (i=0; i<l; i++) 
                {
                    route = routes[ i ];
                    
                    if ( !(m = r.match(route.pattern)) ) continue;
                    
                    // copy handlers avoid mutation during calls
                    handlers = route.handlers.slice( 0 );
                    
                    // remove oneOffs
                    oneOffs = [];
                    lh = handlers.length;
                    for (h=0; h<lh; h++)
                    {
                        if ( handlers[h][2] ) oneOffs.push( h );
                    }
                    lh = oneOffs.length;
                    while (--lh >= 0 ) route.handlers.splice( oneOffs.pop(), 1 );
                    
                    // make calls
                    lh = handlers.length;
                    for (h=0; h<lh; h++)
                    {
                        handler = handlers[ h ];
                        params = { };
                        for (v in route.captures) 
                        {
                            g = route.captures[ v ];
                            
                            if ( m[ g ] )
                                params[ v ] = m[ g ];
                            else if ( v in handler[1] )
                                params[ v ] = handler[1][ v ];
                            else
                                params[ v ] = null;
                        }
                        handler[0]( r, params );
                    }
                    return true;
                }
            }
            if ( self._fallback )
            {
                self._fallback( r, false );
                return false;
            }
            return false;
        }
    };
    
    // export it
    return Dromeo;
});