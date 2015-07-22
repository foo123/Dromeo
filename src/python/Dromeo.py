# -*- coding: UTF-8 -*-
##
#   Dromeo
#   Simple and Flexible Routing Framework for PHP, Python, Node/JS
#   @version: 0.6.3
#
#   https://github.com/foo123/Dromeo
#
##

# needed imports
import re, copy
#import pprint

# http://www.php2python.com/wiki/function.urlencode/
# http://www.php2python.com/wiki/function.urldecode/
_urllib = 0
try:
    #3.x
    import urllib.parse
    _urllib = 1
    def rawurlencode(s):
        return urllib.parse.quote(s)
    def rawurldecode(s):
        return urllib.parse.unquote(s)
    def urlencode(s):
        return urllib.parse.quote_plus(s)
    def urldecode(s):
        return urllib.parse.unquote_plus(s)
except ImportError:
    _urllib = 0

if not _urllib:
    try:
        #2.x
        import urllib
        _urllib = 1
        def rawurlencode(s):
            return urllib.quote(s)
        def rawurldecode(s):
            return urllib.unquote(s)
        def urlencode(s):
            return urllib.quote_plus(s)
        def urldecode(s):
            return urllib.unquote_plus(s)
    except ImportError:
        _urllib = 0

if not _urllib:
    def rawurlencode(s):
        return s
    def rawurldecode(s):
        return s
    def urlencode(s):
        return s
    def urldecode(s):
        return s


# (protected) global properties
class _G:

    # http://en.wikipedia.org/wiki/List_of_HTTP_status_codes
    HTTP_STATUS = {
        # 1xx Informational
        100: "Continue"
        ,101: "Switching Protocols"
        ,102: "Processing"
        
        # 2xx Success
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
        
        # 3xx Redirection
        ,300: "Multiple Choices"
        ,301: "Moved Permanently"
        ,302: "Found"
        ,303: "See Other"
        ,304: "Not Modified"
        ,305: "Use Proxy"
        ,306: "Switch Proxy"
        ,307: "Temporary Redirect"
        ,308: "Permanent Redirect"
        
        # 4xx Client Error
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
        
        # 5xx Server Error
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
    }
    
    uriParser = {
        'php': re.compile(r'^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)'),
        'strict': re.compile(r'^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)'),
        'loose': re.compile(r'^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/\/?)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)') 
    }
    
    uriComponent = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port',
        'relative', 'path', 'directory', 'file', 'query', 'fragment']
        
    patternOr = re.compile(r'^([a-zA-Z0-9-_]+\|[a-zA-Z0-9-_|]+)$')
    nested = re.compile(r'\[([^\]]*?)\]$')
    group = re.compile(r'\((\d+)\)$')
    digit = re.compile(r'^\d+$')
    inited = False


class Route:
    
    def __init__( self, route, pattern, captures, method="*", namespace=None ):
        self.handlers = [ ]
        self.route = route
        self.pattern = pattern
        self.captures = captures
        self.method = str(method).lower() if method else "*"
        self.namespace = namespace
    
    def __del__(self):
        self.dispose()
        
    def dispose( self ):
        self.handlers = None
        self.route = None
        self.pattern = None
        self.captures = None
        self.method = None
        self.namespace = None
        return self


def parse_url(s, component=None, mode='php'):
    global _G
    
    m = _G.uriParser[ mode ].match( s )
    uri = { }
    i = 14
    
    while i > 0:
        i -= 1
        if m.group( i ):  uri[ _G.uriComponent[ i ] ] = m.group( i )
    
    if 'port' in uri: uri['port'] = int(uri['port'])
    
    if component: 
        component = component.replace('PHP_URL_', '').lower( )
        if component in uri: return uri[ component ]
        else: return None
    
    if 'source' in uri: del uri['source']
    return uri

def parse_str( s ):
    global _G
    
    strArr = s.strip('&').split('&')
    array = { }

    for tmp in strArr:
        tmp = tmp.split( '=' )
        key = rawurldecode( tmp[0].strip() )
        if len(tmp) < 2: value = ''
        else: value = rawurldecode( tmp[1].strip() )

        j = key.find('\x00')
        if j > -1: key = key[0:j]
            
        if key and '[' != key[0]:
            keys = [ ]
            
            postLeftBracketPos = 0
            lk = len(key)
            for j in range(lk):
                if '[' == key[j] and 0 == postLeftBracketPos:
                    postLeftBracketPos = j + 1
                
                elif ']' == key[j]:
                    if postLeftBracketPos:
                        if 0 == len(keys):
                            keys.append( key[0:postLeftBracketPos - 1] )
                        keys.append( key[postLeftBracketPos:j] )
                        postLeftBracketPos = 0
                        if j < lk-1 and '[' != key[j + 1]: break
            
            if 0 == len(keys): keys = [ key ]
            
            for j in range(len(key[0])):
                chr = keys[0][j]
                if ' ' == chr or '.' == chr or '[' == chr:
                    keys[0] = keys[0][0:j] + '_' + keys[0][j + 1:]
                if '[' == chr: break

            obj = array
            for j in range(len(keys)):
                key = keys[ j ].strip( "'\"" )
                lastObj = obj
                
                if ('' != key and ' ' != key) or 0 == j:
                    if key not in obj: obj[ key ] = { }
                    obj = obj[ key ]
                else: 
                    # To insert new dimension
                    ct = -1
                    for p in obj:
                        if _G.digit.match(p) and int(p) > ct: ct = int(p)
                    key = str(ct + 1)
            lastObj[ key ] = value
    return array

def http_build_query_helper( key, val, arg_separator, PHP_QUERY_RFC3986 ):
    encode = rawurlencode if PHP_QUERY_RFC3986 else urlencode
        
    if True == val: val = "1"
    elif False == val: val = "0"
    
    if val is not None:
        
        key = str(key)
        
        data = None
        if isinstance(val, dict): data = val.items( )
        elif isinstance(val, (list, tuple)): data = enumerate( val )
        
        if data:
            tmp = [ ]
            for k,v in data:
                if v is not None:
                    tmp.append( http_build_query_helper(key + "[" + str(k) + "]", v, arg_separator, PHP_QUERY_RFC3986) )
            return arg_separator.join( tmp )
        
        else:
            return encode( key ) + "=" + encode( str(val) )
    
    else: 
        return ''

def http_build_query( data, arg_separator='&', PHP_QUERY_RFC3986=False ):
    tmp = [ ]
    for key,value in data.items( ):
        query = http_build_query_helper(key, value, arg_separator, PHP_QUERY_RFC3986)
        if '' != query: tmp.append( query )

    return arg_separator.join( tmp )

    
def length( s ):
    return len(s) > 0
    

def split( s, d1, d2=None ):
    if not d2:
        return s.split( d1 )
    else:
        parts = [ ]
        s = s.split( d1 )
        for part in s:
            part = part.split( d2 )
            parts.append( part[ 0 ] )
            if len(part) > 1: parts.append( part[ 1 ] )
        return parts


def makePattern( delims, patterns, pattern ):
    global _G
    
    numGroups = 0
    pattern = split( pattern, delims[2], delims[3] )
    p = [ ]
    isPattern = False
    for i,pt in enumerate(pattern):
        if isPattern:
            if len(pt):
                if pt in patterns:
                    p.append( '(' + patterns[ pt ] + ')' )
                    numGroups += 1
                else:
                    m = _G.patternOr.match( pt )
                    if m:
                        p.append( '(' + '|'.join( map( re.escape, filter( length, m.group(1).split('|') ) ) ) + ')' )
                        numGroups += 1
                    elif len(pt):
                        p.append( '(' + re.escape( pt ) + ')' )
                        numGroups += 1
            isPattern = False
        else:
            if len(pt): p.append( re.escape( pt ) )
            isPattern = True
            
    if 1 == len(p) and 1 == numGroups:
        return [''.join(p), numGroups]
    else:
        return ['(' + ''.join(p) + ')', numGroups+1]


def makeRoute( delims, patterns, route, method=None ):
    global _G
    
    parts = split( route, delims[ 0 ], delims[ 1 ] )
    isPattern = False
    pattern = ''
    numGroups = 0
    captures = { }
    
    for part in parts:
        
        if isPattern:
            isOptional = False
            isCaptured = False
            
            # http://abc.org/{%ALFA%:user}{/%NUM%:?id(1)}
            p = part.split( delims[ 4 ] )
            capturePattern = makePattern( delims, patterns, p[ 0 ] )
            
            if len(p) > 1:
                captureName = p[ 1 ].strip( )
                isOptional = (len(captureName)>0 and '?' == captureName[0])
                if isOptional: captureName = captureName[1:]
            
                m = _G.group.search( captureName )
                if m:
                    captureName = captureName[:-len(m.group(0))]
                    captureIndex = int(m.group(1))
                    if captureIndex >= 0 and captureIndex < capturePattern[1]:
                        captureIndex += numGroups + 1
                    else:
                        captureIndex = numGroups + 1
                else:
                    captureIndex = numGroups + 1
                
                isCaptured = (len(captureName) > 0)
            
            pattern += capturePattern[ 0 ]
            numGroups += capturePattern[ 1 ]
            if isOptional: pattern += '?'
            if isCaptured: captures[ captureName ] = captureIndex
            isPattern = False
        else:
            pattern += re.escape( part )
            isPattern = True
    
    return Route( route, re.compile('^' + pattern + '$'), captures, method )


def addRoute( handlers, routes, delims, patterns, prefix, route, oneOff=False ):
    if route and isinstance(route, dict) and 'route' in route and len(route['route'])>0 and 'handler' in route and callable(route['handler']):
        oneOff = (True == oneOff)
        handler = route['handler']
        defaults = dict(route['defaults']) if 'defaults' in route else {}
        types = dict(route['types']) if ('types' in route) and route['types'] else None
        method = str(route['method']).lower() if 'method' in route else '*'
        route = prefix + route['route']
        
        if method not in handlers: handlers[method] = {}
        h = handlers[method]
        
        if route in h:
            h[ route ].handlers.append( [handler, defaults, types, oneOff, 0] )
        else:
            h[ route ] = makeRoute( delims, patterns, route, method )
            h[ route ].handlers.append( [handler, defaults, types, oneOff, 0] )
            routes.append( h[ route ] )


def addRoutes( handlers, routes, delims, patterns, prefix, args, oneOff=False ):
    for route in args:
        addRoute(handlers, routes, delims, patterns, prefix, route, oneOff)


def clearRoute( handlers, routes, route, method ):
    l = len(routes)-1
    while l >= 0:
        if route == routes[ l ].route and method == routes[ l ].method:
            del routes[l : l+1]
        l -= 1
    handlers[ route ].dispose( )
    del handlers[ route ]

def type_to_int( v ):
    try:
        v = int(v, 10)
    except ValueError:
        v = 0
    return 0 if not v else v # take account of nan
    
def type_to_str( v ):
    return v if isinstance(v, str) else str(v)
    
def type_to_array( v ):
    return v if isinstance(v, (list,tuple)) else [v]
    
def type_to_params( v ):
    return Dromeo.unglue_params(v) if isinstance(v, str) else v
    
    
class Dromeo:
    """
    Dromeo Router for Python,
    https://github.com/foo123/Dromeo
    """
    
    VERSION = "0.6.3"
    
    Route = Route
    
    TYPES = {
        'INTEGER'   : type_to_int,
        'STRING'    : type_to_str,
        'ARRAY'     : type_to_array,
        'PARAMS'    : type_to_params
        # aliases
        ,
        'INT'       : type_to_int,
        'STR'       : type_to_str,
        'URLENCODED': type_to_params
    }
    
    # build/glue together a uri component from a params object
    def glue_params( params ):
        component = '';
        # http://php.net/manual/en/function.http-build-query.php (for '+' sign convention)
        if params:  component += http_build_query( params, '&', True )
        return component
        
    # unglue/extract params object from uri component
    def unglue_params( s ):
        if s: PARAMS = parse_str( s )
        else: PARAMS = { }
        return PARAMS

    # parse and extract uri components and optional query/fragment params
    def parse_components( s, query_p='query_params', fragment_p='fragment_params' ):
        COMPONENTS = { }
        if s:
            COMPONENTS = parse_url( s )
            
            if query_p:
                if 'query' in COMPONENTS:
                    COMPONENTS[ query_p ] = Dromeo.unglue_params( COMPONENTS[ 'query' ] )
                else:
                    COMPONENTS[ query_p ] = { }
            
            if fragment_p:
                if 'fragment' in COMPONENTS:
                    COMPONENTS[ fragment_p ] = Dromeo.unglue_params( COMPONENTS[ 'fragment' ] )
                else:
                    COMPONENTS[ fragment_p ] = { }
        
        return COMPONENTS

    
    # build a url from baseUrl plus query/hash params
    def build_components( baseUrl, query=None, hash=None, q='?', h='#' ):
        url = '' + baseUrl
        if query:  url += q + Dromeo.glue_params( query )
        if hash:  url += h + Dromeo.glue_params( hash )
        return url
        
    def defType( type, caster ):
        if type and caster and callable(caster):
            Dromeo.TYPES[ type ] = caster
        
    def TYPE( type ):
        if type and (type in Dromeo.TYPES): return Dromeo.TYPES[ type ]
        return None
        
    
    def __init__( self, prefix='' ):
        self._delims = ['{', '}', '%', '%', ':']
        self._patterns = { }
        self.definePattern( 'ALPHA',   '[a-zA-Z\\-_]+' )
        self.definePattern( 'NUMBR',   '[0-9]+' )
        self.definePattern( 'ALNUM',   '[a-zA-Z0-9\\-_]+' )
        self.definePattern( 'QUERY',   '\\?[^?#]+' )
        self.definePattern( 'FRAGM',   '#[^?#]+' )
        self.definePattern( 'PART',    '[^\\/?#]+' )
        self.definePattern( 'ALL',     '.+' )
        self._handlers = { '*':{} }
        self._routes = [ ]
        self._fallback = False
        self._prefix = str(prefix) if prefix else ''
    
    
    def __del__(self):
        self.dispose()
        
    def dispose( self ):
        self._delims = None
        self._patterns = None
        self._routes = None
        self._fallback = None
        self._prefix = None
        for m in self._handlers: 
            h = self._handlers[m]
            for r in h: 
                h[r].dispose( )
                h[r] = None
        self._handlers = None
        return self
        
    def reset( self ):
        self._handlers = { '*':{} }
        self._routes = [ ]
        self._fallback = False
        return self
    
    def defineDelimiters( self, delims ):
        if delims:
            l = len(delims)
            if l > 0 and delims[0]: self._delims[0] = delims[0]
            if l > 1 and delims[1]: self._delims[1] = delims[1]
            if l > 2 and delims[2]: self._delims[2] = delims[2]
            if l > 3 and delims[3]: self._delims[3] = delims[3]
            if l > 4 and delims[4]: self._delims[4] = delims[4]
        return self

    
    def definePattern( self, className, subPattern ):
        self._patterns[ className ] = subPattern
        return self
    
    
    def dropPattern( self, className ):
        if className in self._patterns:
            del self._patterns[ className ]
        return self
    
    def defineType( self, type, caster ):
        Dromeo.defType(type, caster)
        return self
    
    
    #def debug( self ):
    #    print('Routes: ', pprint.pformat(self._routes, 4))
    #    print('Fallback: ', pprint.pformat(self._fallback, 4))
    
    # build/glue together a uri component from a params object
    def glue( self, params ):
        return Dromeo.glue_params( params )
        
    # unglue/extract params object from uri component
    def unglue( self, s ):
        return Dromeo.unglue_params( s )

    # parse and extract uri components and optional query/fragment params
    def parse( self, s, query_p='query_params', fragment_p='fragment_params' ):
        return Dromeo.parse_components( s, query_p, fragment_p )

    
    # build a url from baseUrl plus query/hash params
    def build( self, baseUrl, query=None, hash=None, q='?', h='#' ):
        return Dromeo.build_components( baseUrl, query, hash, q, h )
        
    
    def redirect( self, url, httpHandler, statusCode=302, statusMsg=True ):
        global _G
        # redirection based on python HttpServer
        # https://docs.python.org/3/library/http.server.html, https://wiki.python.org/moin/BaseHttpServer
        if url and httpHandler:
            if statusMsg:
                if True == statusMsg:
                    if statusCode in _G.HTTP_STATUS: statusMsg = _G.HTTP_STATUS[statusCode]
                    else: statusMsg = ''
                httpHandler.send_response( statusCode, statusMsg )
            else:
                httpHandler.send_response( statusCode )
            httpHandler.send_header( "Location", url )
            httpHandler.end_headers( )
        return self
       
    
    def on( self, *args ):
        args_len = len(args)
        
        if 1 == args_len: 
            routes = args[0] if isinstance(args[0], (list, tuple)) else [args[0]]
        elif 2 == args_len and isinstance(args[0], str) and callable(args[1]):
            routes = [{'route': args[0], 'handler': args[1], 'method': '*', 'defaults': {}, 'types': None}]
        else:
            routes = args
        
        addRoutes(self._handlers, self._routes, self._delims, self._patterns, self._prefix, routes)
        return self
    
    
    def one( self, *args ):
        args_len = len(args)
        
        if 1 == args_len: 
            routes = args[0] if isinstance(args[0], (list, tuple)) else [args[0]]
        elif 2 == args_len and isinstance(args[0], str) and callable(args[1]):
            routes = [{'route': args[0], 'handler': args[1], 'method': '*', 'defaults': {}, 'types': None}]
        else:
            routes = args
        
        addRoutes(self._handlers, self._routes, self._delims, self._patterns, self._prefix, routes, True)
        return self
    
    
    def off( self, route, handler=None ):
        routes = self._routes 
        handlers = self._handlers
        prefix = self._prefix
        
        if route:
            if isinstance(route, dict):
                m = str(route['method']).lower() if 'method' in route else '*'
                handler = route['handler'] if 'handler' in route else handler
                route = route['route'] if 'route' in route else None
                if route and (m in handlers):
                    route = prefix + route
                    h = handlers[m]
                    if route in h:
                        if handler and callable(handler):
                            r = h[ route ]
                            l = len(r.handlers)-1
                            while l>=0:
                                if handler == r.handlers[ l ][0]:
                                    # http://www.php2python.com/wiki/function.array-splice/
                                    del r.handlers[l : l+1]
                                l -= 1
                            if not len(r.handlers):
                                clearRoute( h, routes, route, m )
                        else:
                            clearRoute( h, routes, route, m )
            
            elif isinstance(route, str) and len(route):
                route = prefix + route
                for m in handlers:
                    h = handlers[m]
                    if route in h:
                        if handler and callable(handler):
                            r = handlers[ route ]
                            l = len(r.handlers)-1
                            while l>=0:
                                if handler == r.handlers[ l ][0]:
                                    # http://www.php2python.com/wiki/function.array-splice/
                                    del r.handlers[l : l+1]
                                l -= 1
                            if not len(r.handlers):
                                clearRoute( h, routes, route, m )
                        else:
                            clearRoute( h, routes, route, m )
        
        return self
        
    
    def fallback( self, handler=False ):
        if False == handler or None == handler or callable(handler):
            self._fallback = handler
        return self
    
    
    def route( self, r=None, method="*", breakOnFirstMatch=True ):
        if r:
            breakOnFirstMatch = False != breakOnFirstMatch
            method = str(method).lower() if method else "*"
            routes = self._routes[:] # copy, avoid mutation
            found = False
            for route in routes:
                if method != route.method and '*' != route.method: continue
                m = route.pattern.match( r )
                if not m: continue
                
                found = True
                
                # copy handlers avoid mutation during calls
                handlers = route.handlers[ : ]
                
                # make calls
                captures = route.captures.items( )
                for h in range(len(handlers)):
                    handler = handlers[ h ]
                    # handler is oneOff and already called
                    if handler[3] and handler[4]: continue
                    
                    defaults = handler[1]
                    type = handler[2]
                    params = {
                        'route': r,
                        'pattern': route.route,
                        'fallback': False,
                        'data': copy.deepcopy(defaults)
                    }
                    for v,g in captures:
                        if m.group( g ):
                            if type and (v in type) and type[ v ]:
                                typecaster = type[ v ]
                                if isinstance(typecaster,str) and (typecaster in Dromeo.TYPES):
                                    typecaster = Dromeo.TYPES[ typecaster ]
                                params['data'][ v ] = typecaster( m.group( g ) ) if callable(typecaster) else m.group( g )
                            else:
                                params['data'][ v ] = m.group( g )
                        elif v not in params['data']: 
                            params['data'][ v ] = None
                    
                    handler[4] = 1 # handler called
                    handler[0]( params )
                
                # remove called oneOffs
                lh = len(route.handlers)-1
                while lh >= 0: 
                    # handler is oneOff and called once
                    handler = route.handlers[lh]
                    if handler[3] and handler[4]: del route.handlers[lh : lh+1]
                    lh -= 1
                if 0 == len(route.handlers):
                    clearRoute( self._handlers[route.method], self._routes, route.route, route.method )
                
                if breakOnFirstMatch: return True
            
            if found: return True
        
        if self._fallback:  
            self._fallback( {'route': r, 'pattern': None, 'fallback': True, 'data': None} )
            return False
        return False

    
# if used with 'import *'
__all__ = ['Dromeo']
