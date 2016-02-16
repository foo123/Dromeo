<?php
/**
*
*   Dromeo
*   Simple and Flexible Routing Framework for PHP, Python, Node/XPCOM/JS
*   @version: 0.6.7
*
*   https://github.com/foo123/Dromeo
*
**/
if (!class_exists('Dromeo'))
{
class DromeoRoute
{
    public $route = null;
    public $pattern = null;
    public $captures = null;
    public $handlers = null;
    public $method = null;
    public $namespace = null;
    
    public function __construct( $route, $pattern, $captures, $method="*", $namespace=null ) 
    {
        $this->handlers = array( );
        $this->route = $route;
        $this->pattern = $pattern;
        $this->captures = $captures;
        $this->method = $method && strlen($method) ? strtolower($method) : "*";
        $this->namespace = $namespace;
    }
    
    public function __destruct()
    {
        $this->dispose();
    }
    
    public function dispose( ) 
    {
        $this->handlers = null;
        $this->route = null;
        $this->pattern = null;
        $this->captures = null;
        $this->method = null;
        $this->namespace = null;
        return $this;
    }
}

class Dromeo 
{
    const VERSION = "0.6.7";
    
    // http://en.wikipedia.org/wiki/List_of_HTTP_status_codes
    private static $HTTP_STATUS = array(
    // 1xx Informational
     100=> "Continue"
    ,101=> "Switching Protocols"
    ,102=> "Processing"
    
    // 2xx Success
    ,200=> "OK"
    ,201=> "Created"
    ,202=> "Accepted"
    ,203=> "Non-Authoritative Information"
    ,204=> "No Content"
    ,205=> "Reset Content"
    ,206=> "Partial Content"
    ,207=> "Multi-Status"
    ,208=> "Already Reported"
    ,226=> "IM Used"
    
    // 3xx Redirection
    ,300=> "Multiple Choices"
    ,301=> "Moved Permanently"
    ,302=> "Found"
    ,303=> "See Other"
    ,304=> "Not Modified"
    ,305=> "Use Proxy"
    ,306=> "Switch Proxy"
    ,307=> "Temporary Redirect"
    ,308=> "Permanent Redirect"
    
    // 4xx Client Error
    ,400=> "Bad Request"
    ,401=> "Unauthorized"
    ,402=> "Payment Required"
    ,403=> "Forbidden"
    ,404=> "Not Found"
    ,405=> "Method Not Allowed"
    ,406=> "Not Acceptable"
    ,407=> "Proxy Authentication Required"
    ,408=> "Request Timeout"
    ,409=> "Conflict"
    ,410=> "Gone"
    ,411=> "Length Required"
    ,412=> "Precondition Failed"
    ,413=> "Request Entity Too Large"
    ,414=> "Request-URI Too Long"
    ,415=> "Unsupported Media Type"
    ,416=> "Requested Range Not Satisfiable"
    ,417=> "Expectation Failed"
    ,418=> "I'm a teapot"
    ,419=> "Authentication Timeout"
    ,422=> "Unprocessable Entity"
    ,423=> "Locked"
    ,424=> "Failed Dependency"
    ,426=> "Upgrade Required"
    ,428=> "Precondition Required"
    ,429=> "Too Many Requests"
    ,431=> "Request Header Fields Too Large"
    ,440=> "Login Timeout"
    ,444=> "No Response"
    ,449=> "Retry With"
    ,450=> "Blocked by Windows Parental Controls"
    ,451=> "Unavailable For Legal Reasons"
    ,494=> "Request Header Too Large"
    ,495=> "Cert Error"
    ,496=> "No Cert"
    ,497=> "HTTP to HTTPS"
    ,498=> "Token expired/invalid"
    ,499=> "Client Closed Request"
    
    // 5xx Server Error
    ,500=> "Internal Server Error"
    ,501=> "Not Implemented"
    ,502=> "Bad Gateway"
    ,503=> "Service Unavailable"
    ,504=> "Gateway Timeout"
    ,505=> "HTTP Version Not Supported"
    ,506=> "Variant Also Negotiates"
    ,507=> "Insufficient Storage"
    ,508=> "Loop Detected"
    ,509=> "Bandwidth Limit Exceeded"
    ,510=> "Not Extended"
    ,511=> "Network Authentication Required"
    ,520=> "Origin Error"
    ,521=> "Web server is down"
    ,522=> "Connection timed out"
    ,523=> "Proxy Declined Request"
    ,524=> "A timeout occurred"
    ,598=> "Network read timeout error"
    ,599=> "Network connect timeout error"
    );
    
    private static $_patternOr = '/^([^|]+\\|.+)$/';
    private static $_group = '/\\((\\d+)\\)$/';
    
    private $_delims = null;
    private $_patterns = null;
    private $_handlers = null;
    private $_routes = null;
    private $_fallback = false;
    private $_prefix = '';
    
    public static $TYPES = array( );
    
    // build/glue together a uri component from a params object
    public static function glue_params( $params ) 
    {
        $component = '';
        // http://php.net/manual/en/function.http-build-query.php (for '+' sign convention)
        if ( $params ) $component .= str_replace('+', '%20', http_build_query( $params, '', '&'/*,  PHP_QUERY_RFC3986*/ ));
        return $component;
    }
        
    // unglue/extract params object from uri component
    public static function unglue_params( $s ) 
    {
        $PARAMS = array( );
        if ( $s ) parse_str( $s, $PARAMS );
        return $PARAMS;
    }

    // parse and extract uri components and optional query/fragment params
    public static function parse_components( $s, $query_p='query_params', $fragment_p='fragment_params' ) 
    {
        $COMPONENTS = array( );
        if ( $s )
        {
            $COMPONENTS = parse_url( $s );
            
            if ( $query_p  )
            {
                if ( isset($COMPONENTS[ 'query' ]) && $COMPONENTS[ 'query' ] ) 
                    $COMPONENTS[ $query_p ] = self::unglue_params( $COMPONENTS[ 'query' ] );
                else
                    $COMPONENTS[ $query_p ] = array( );
            }
            if ( $fragment_p )
            {
                if ( isset($COMPONENTS[ 'fragment' ]) && $COMPONENTS[ 'fragment' ] ) 
                    $COMPONENTS[ $fragment_p ] = self::unglue_params( $COMPONENTS[ 'fragment' ] );
                else
                    $COMPONENTS[ $fragment_p ] = array( );
            }
        }
        return $COMPONENTS;
    }

    // build a url from baseUrl plus query/hash params
    public static function build_components( $baseUrl, $query=null, $hash=null, $q='?', $h='#' ) 
    {
        $url = '' . $baseUrl;
        if ( $query )  $url .= $q . self::glue_params( $query );
        if ( $hash )  $url .= $h . self::glue_params( $hash );
        return $url;
    }
        
    public static function type_to_int($v)
    {
        $v = intval($v, 10);
        return !$v ? 0 : $v; // take account of nan to 0
    }
    
    public static function type_to_urldecode($v)
    {
        return urldecode($v);
    }
    
    public static function type_to_str($v)
    {
        return is_string($v) ? $v : strval($v);
    }
    
    public static function type_to_array($v)
    {
        return is_array($v) ? $v : array($v);
    }
    
    public static function type_to_params($v)
    {
        return is_string($v) ? self::ungle_params($v) : $v;
    }
    
    public static function defType($type, $caster)
    {
        if ( $type && is_callable($caster) ) self::$TYPES[ $type ] = $caster;
    }
    
    public static function TYPE( $type )
    {
        if ( $type && isset(self::$TYPES[$type]) ) return self::$TYPES[$type];
        return null;
    }
    
    // factory method, useful for continous method chaining
    public static function _( $route_prefix='' )
    {
        return new self( $route_prefix );
    }
    
    public function __construct( $route_prefix='' ) 
    {
        $this->_delims = array('{', '}', '%', '%', ':');
        $this->_patterns = array( );
        $this->definePattern( 'ALPHA',      '[a-zA-Z\\-_]+' );
        $this->definePattern( 'ALNUM',      '[a-zA-Z0-9\\-_]+' );
        $this->definePattern( 'NUMBR',      '[0-9]+' );
        $this->definePattern( 'INT',        '[0-9]+',          'INT' );
        $this->definePattern( 'PART',       '[^\\/?#]+' );
        $this->definePattern( 'VAR',        '[^=?&#\\/]+',     'VAR' );
        $this->definePattern( 'QUERY',      '\\?[^?#]+' );
        $this->definePattern( 'FRAGMENT',   '#[^?#]+' );
        $this->definePattern( 'URLENCODED', '[^\\/?#]+',       'URLENCODED' );
        $this->definePattern( 'ALL',     '.+' );
        $this->_handlers = array( '*'=>array( ) );
        $this->_routes = array( );
        $this->_fallback = false;
        $this->_prefix = $route_prefix ? $route_prefix : '';
    }
    
    public function __destruct( )
    {
        $this->dispose();
    }
    
    public function dispose( ) 
    {
        $this->_delims = null;
        $this->_patterns = null;
        $this->_routes = null;
        $this->_fallback = null;
        $this->_prefix = null;
        foreach ( $this->_handlers as $h ) 
        {
            foreach ( $h as $k=>$r ) 
            {
                $r->dispose( );
                $h[$k] = null;
            }
        }
        $this->_handlers = null;
        return $this;
    }
        
    public function reset( )
    {
        $this->_handlers = array( '*'=>array() );
        $this->_routes = array( );
        $this->_fallback = false;
        return $this;
    }
    
    public function defineDelimiters( $delims )
    {
        if ( !empty($delims) )
        {
            if ( isset($delims[0]) ) $this->_delims[0] = $delims[0];
            if ( isset($delims[1]) ) $this->_delims[1] = $delims[1];
            if ( isset($delims[2]) ) $this->_delims[2] = $delims[2];
            if ( isset($delims[3]) ) $this->_delims[3] = $delims[3];
            if ( isset($delims[4]) ) $this->_delims[4] = $delims[4];
        }
        return $this;
    }
    
    public function definePattern( $className, $subPattern, $typecaster=null )
    {
        if ( !empty($typecaster) && 
            is_string($typecaster) && 
            isset(self::$TYPES[$typecaster]) 
        ) $typecaster = self::$TYPES[ $typecaster ];
        
        if ( empty($typecaster) || !is_callable($typecaster) ) $typecaster = null;
        $this->_patterns[ $className ] = array($subPattern, $typecaster);
        return $this;
    }
    
    public function dropPattern( $className )
    {
        if ( isset($this->_patterns[ $className ]) )
            unset($this->_patterns[ $className ]);
        return $this;
    }
    
    public function defineType( $type, $caster )
    {
        self::defType( $type, $caster );
        return $this;
    }
    
    /*public function debug( )
    {
        echo 'Routes: ' . print_r($this->_routes, true) . PHP_EOL;
        echo 'Fallback: ' . print_r($this->_fallback, true) . PHP_EOL;
    }*/
    
    // build/glue together a uri component from a params object
    public function glue( $params ) 
    {
        return self::glue_params( $params );
    }
        
    // unglue/extract params object from uri component
    public function unglue( $s ) 
    {
        return self::unglue_params( $s );
    }

    // parse and extract uri components and optional query/fragment params
    public function parse( $s, $query_p='query_params', $fragment_p='fragment_params' ) 
    {
        return self::parse_components( $s, $query_p, $fragment_p );
    }

    // build a url from baseUrl plus query/hash params
    public function build( $baseUrl, $query=null, $hash=null, $q='?', $h='#' ) 
    {
        return self::build_components( $baseUrl, $query, $hash, $q, $h );
    }
        
    public function redirect( $url, $statusCode=302, $statusMsg=true )
    {
        if ( $url )
        {
            if ( !headers_sent( ) )
            {
                if ( $statusMsg )
                {
                    if ( true === $statusMsg )
                        $statusMsg = isset( self::$HTTP_STATUS[ $statusCode ] ) ? self::$HTTP_STATUS[ $statusCode ] : '';
                        
                    $protocol = $_SERVER["SERVER_PROTOCOL"];
                    if ( 'HTTP/1.1' != $protocol && 'HTTP/1.0' != $protocol )  
                        $protocol = 'HTTP/1.0';

                    @header( "$protocol $statusCode $statusMsg", true, $statusCode );
                    header( "Location: $url", true, $statusCode );
                }
                else
                {
                    header( "Location: $url", true, $statusCode );
                }
            }
            exit;
        }
        return $this;
    }
    
    public function on( /* var args here .. */ ) 
    {
        $args = func_get_args( ); $args_len = func_num_args( );
        
        if ( 1 === $args_len )
        {
            $routes = is_array($args[ 0 ]) && isset($args[ 0 ][ 0 ]) && is_array($args[ 0 ][ 0 ])
                    ? $args[0]
                    : array($args[0]);
        }
        elseif ( 2 === $args_len && is_string($args[0]) && is_callable($args[1]) )
        {
            $routes = array(array(
                'route'=> $args[0], 
                'handler'=> $args[1], 
                'method'=> '*', 
                'defaults'=> array(),
                'types'=> null
            ));
        }
        else
        {
            $routes = $args;
        }
        self::addRoutes($this->_handlers, $this->_routes, $this->_delims, $this->_patterns, $this->_prefix, $routes);
        return $this;
    }
    
    public function one( /* var args here .. */ ) 
    {
        $args = func_get_args( ); $args_len = func_num_args( );
        
        if ( 1 === $args_len )
        {
            $routes = is_array($args[ 0 ]) && isset($args[ 0 ][ 0 ]) && is_array($args[ 0 ][ 0 ])
                    ? $args[0]
                    : array($args[0]);
        }
        elseif ( 2 === $args_len && is_string($args[0]) && is_callable($args[1]) )
        {
            $routes = array(array(
                'route'=> $args[0], 
                'handler'=> $args[1], 
                'method'=> '*', 
                'defaults'=> array(),
                'types'=> null
            ));
        }
        else
        {
            $routes = $args;
        }
        self::addRoutes($this->_handlers, $this->_routes, $this->_delims, $this->_patterns, $this->_prefix, $routes, true);
        return $this;
    }
    
    public function off( $route, $handler=null )
    {
        if ( $route )
        {
            if ( is_array($route) )
            {
                $m = isset($route['method']) ? strtolower($route['method']) : '*';
                $handler = isset($route['handler']) ? $route['handler'] : $handler;
                $route = $route['route'];
                if ( $route && isset($this->_handlers[$m]) )
                {
                    $route = $this->_prefix . $route; 
                    $h =& $this->_handlers[$m];
                    if ( isset($h[$route]) )
                    {
                        if ( $handler && is_callable($handler) )
                        {
                            $r =& $h[$route];
                            $l = count($r->handlers);
                            for ($i=$l-1; $i>=0; $i--)
                            {
                                if ( $handler === $r->handlers[ $i ]->handler )
                                    array_splice($r->handlers, $i, 1);
                            }
                            if ( empty($r->handlers) )
                                self::clearRoute( $h, $this->_routes, $route, $m );
                        }
                        else
                        {
                            self::clearRoute( $h, $this->_routes, $route, $m );
                        }
                    }
                }
            }
            elseif ( is_string($route) && strlen($route) )
            {
                $route = $this->_prefix . $route; 
                foreach($this->_handlers as $m=>&$h)
                {
                    if ( isset($h[$route]) )
                    {
                        if ( $handler && is_callable($handler) )
                        {
                            $r =& $h[$route];
                            $l = count($r->handlers);
                            for ($i=$l-1; $i>=0; $i--)
                            {
                                if ( $handler === $r->handlers[ $i ]->handler )
                                    array_splice($r->handlers, $i, 1);
                            }
                            if ( empty($r->handlers) )
                                self::clearRoute( $h, $this->_routes, $route, $m );
                        }
                        else
                        {
                            self::clearRoute( $h, $this->_routes, $route, $m );
                        }
                    }
                }
            }
        }
        return $this;
    }
    
    public function fallback( $handler=false ) 
    {
        if ( false === $handler || null === $handler || is_callable( $handler ) )
            $this->_fallback = $handler;
        return $this;
    }
    
    public function route( $r=null, $method="*", $breakOnFirstMatch=true ) 
    {
        if ( $r )
        {
            $breakOnFirstMatch = false !== $breakOnFirstMatch;
            $method = $method ? strtolower($method) : '*';
            $routes = array_merge(array(), $this->_routes); // copy, avoid mutation
            $found = false;
            foreach ($routes as $route) 
            {
                if ( $method !== $route->method && '*' !== $route->method ) continue;
                if ( !preg_match($route->pattern, $r, $m, 0, 0) ) continue;

                $found = true;
                
                // copy handlers avoid mutation during calls
                // is this shallow or deep copy???
                // since using objects as array items, it should be shallow
                $handlers = array_merge(array(), $route->handlers);
                
                // make calls
                foreach ( $handlers as &$handler )
                {
                    // handler is oneOff and already called
                    if ( $handler->oneOff && $handler->called ) continue;
                    
                    // get params
                    $params = array(
                        'route'=> $r,
                        'pattern'=> $route->route,
                        'fallback'=> false,
                        'data'=> array_merge_recursive(array(), $handler->defaults)
                    );
                    foreach ($route->captures as $v=>$g) 
                    {
                        $groupIndex = $g[0];
                        $groupTypecaster = $g[1];
                        if ( isset( $m[ $groupIndex ] ) && $m[ $groupIndex ] ) 
                        {
                            if ( $handler->types && isset($handler->types[$v]) )
                            {
                                $typecaster = $handler->types[$v];
                                if ( is_string($typecaster) && isset(self::$TYPES[$typecaster]) )
                                    $typecaster = self::$TYPES[$typecaster];
                                $params['data'][ $v ] = is_callable($typecaster) ? call_user_func($typecaster, $m[ $groupIndex ]) : $m[ $groupIndex ];
                            }
                            elseif ( $groupTypecaster )
                            {
                                $typecaster = $groupTypecaster;
                                $params['data'][ $v ] = is_callable($typecaster) ? call_user_func($typecaster, $m[ $groupIndex ]) : $m[ $groupIndex ];
                            }
                            else
                            {
                                $params['data'][ $v ] = $m[ $groupIndex ];
                            }
                        }
                        elseif ( !isset($params['data'][ $v ]) ) 
                        {
                            $params['data'][ $v ] = null;
                        }
                    }
                    
                    $handler->called = 1; // handler called
                    call_user_func( $handler->handler, $params );
                }
                    
                // remove called oneOffs
                for ($h=count($route->handlers)-1; $h>=0; $h--)
                {
                    // handler is oneOff and called once
                    $handler =& $route->handlers[$h];
                    if ( $handler->oneOff && $handler->called ) array_splice($route->handlers, $h, 1);
                }
                if ( empty($route->handlers) )
                    self::clearRoute( $this->_handlers[$route->method], $this->_routes, $route->route, $route->method );

                if ( $breakOnFirstMatch ) return true;
            }
            if ( $found ) return true;
        }
        if ( $this->_fallback )
        {
            call_user_func( $this->_fallback, array('route'=>$r, 'pattern'=> null, 'fallback'=> true, 'data'=>null) );
            return false;
        }
        return false;
    }
    
    private static function clearRoute( &$handlers, &$routes, $route, $method )
    {
        $l = count($routes);
        for ($i=$l-1; $i>=0; $i--)
        {
            if ( $route === $routes[ $i ]->route && $method === $routes[ $i ]->method )
            {
                array_splice($routes, $i, 1);
            }
        }
        $handlers[$route]->dispose( );
        unset( $handlers[$route] );
    }

    private static function addRoute( &$handlers, &$routes, &$delims, &$patterns, $prefix, $route, $oneOff=false)
    {
        if ( is_array($route) && isset($route['route']) && is_string($route['route']) && strlen($route['route']) && 
            isset($route['handler']) && is_callable($route['handler']) )
        {
            $oneOff = (true === $oneOff);
            $handler = $route['handler'];
            $defaults = isset($route['defaults']) ? (array)$route['defaults'] : array();
            $types = isset($route['types']) ? (array)$route['types'] : array();
            $method = isset($route['method']) ? strtolower($route['method']) : '*';
            $route = $prefix . $route['route'];
            
            if ( !isset($handlers[ $method ]) ) $handlers[ $method ] = array( );
            $h =& $handlers[ $method ];
            
            if ( isset($h[ $route ]) )
            {
                $h[ $route ]->handlers[] = (object)array(
                    'handler'=>$handler, 
                    'defaults'=>$defaults, 
                    'types'=>$types, 
                    'oneOff'=>$oneOff, 
                    'called'=>0
                );
            }
            else
            {
                $h[ $route ] = self::makeRoute( $delims, $patterns, $route, $method );
                $h[ $route ]->handlers[] = (object)array(
                    'handler'=>$handler, 
                    'defaults'=>$defaults, 
                    'types'=>$types, 
                    'oneOff'=>$oneOff, 
                    'called'=>0
                );
                $routes[] = $h[ $route ];
            }
        }
    }
    
    private static function addRoutes( &$handlers, &$routes, &$delims, &$patterns, $prefix, $args, $oneOff=false )
    {
        foreach ((array)$args as $route)
        {
            self::addRoute($handlers, $routes, $delims, $patterns, $prefix, $route, $oneOff);
        }
    }

    private static function makeRoute( &$_delims, &$_patterns, $route, $method=null )
    {
        $parts = self::split( $route, $_delims[ 0 ], $_delims[ 1 ] );
        $l = count($parts);
        $isPattern = false;
        $pattern = '';
        $numGroups = 0;
        $captures = array( );
        
        for ($i=0; $i<$l; $i++)
        {
            $part = $parts[ $i ];
            if ( $isPattern )
            {
                $isOptional = false;
                $isCaptured = false;
                $patternTypecaster = null;
                
                // http://abc.org/{%ALFA%:user}{/%NUM%:?id(1)}
                $p = explode( $_delims[ 4 ], $part );
                $capturePattern = self::makePattern( $_delims, $_patterns, $p[ 0 ] );
                
                if ( count($p) > 1 )
                {
                    $captureName = trim( $p[ 1 ] );
                    $isOptional = (strlen($captureName) && '?' === substr($captureName,0, 1));
                    if ( $isOptional ) $captureName = substr($captureName, 1);
                
                    if ( preg_match(self::$_group, $captureName, $m) )
                    {
                        $captureName = substr($captureName, 0, -strlen($m[0]));
                        $captureIndex = intval($m[1], 10);
                        $patternTypecaster = isset($capturePattern[2][$captureIndex]) 
                                ? $capturePattern[2][$captureIndex] 
                                : null;
                        if ( $captureIndex >= 0 && $captureIndex < $capturePattern[1] )
                        {
                            $captureIndex += $numGroups + 1;
                        }
                        else
                        {
                            $captureIndex = $numGroups + 1;
                        }
                    }
                    else
                    {
                        $patternTypecaster = $capturePattern[2][0]
                                ? $capturePattern[2][0] 
                                : null;
                        $captureIndex = $numGroups + 1;
                    }
                    
                    $isCaptured = (strlen($captureName) > 0);
                }
                
                $pattern .= $capturePattern[ 0 ];
                $numGroups += $capturePattern[ 1 ];
                if ( $isOptional ) $pattern .= '?';
                if ( $isCaptured ) $captures[ $captureName ] = array($captureIndex, $patternTypecaster);
                $isPattern = false;
            }
            else
            {
                $pattern .= preg_quote( $part, '/' );
                $isPattern = true;
            }
        }
        return new DromeoRoute( $route, '/^' . $pattern . '$/', $captures, $method );
    }
    
    private static function makePattern( &$_delims, &$_patterns, $pattern ) 
    {
        $numGroups = 0;
        $types = array( );
        $pattern = self::split( $pattern, $_delims[2], $_delims[3] );
        $p = array( );
        $l = count($pattern);
        $isPattern = false;
        for ($i=0; $i<$l; $i++)
        {
            if ( $isPattern )
            {
                if ( strlen($pattern[ $i ]) )
                {
                    if ( isset($_patterns[ $pattern[ $i ] ]) )
                    {
                        $p[ ] = '(' . $_patterns[ $pattern[ $i ] ][ 0 ] . ')';
                        $numGroups++;
                        // typecaster
                        if ( $_patterns[ $pattern[ $i ] ][ 1 ] ) $types[$numGroups] = $_patterns[ $pattern[ $i ] ][ 1 ];
                    }
                    elseif ( preg_match( self::$_patternOr, $pattern[ $i ], $m ) )
                    {
                        $p[ ] = '(' . implode( '|', array_map( 'preg_quote', array_filter( explode( '|', $m[1] ), 'strlen' ) ) ) . ')';
                        $numGroups++;
                    }
                    elseif ( strlen($pattern[ $i ]) )
                    {
                        $p[ ] = '(' . preg_quote( $pattern[ $i ], '/' ) . ')';
                        $numGroups++;
                    }
                }
                $isPattern = false;
            }
            else
            {
                if ( strlen($pattern[ $i ]) )
                {
                    $p[ ] = preg_quote( $pattern[ $i ], '/' );
                }
                $isPattern = true;
            }
        }
        if ( 1 === count($p) && 1 === $numGroups )
        {
            $types[ 0 ] = isset($types[ 1 ]) ? $types[ 1 ] : null;
            return array(implode('', $p), $numGroups, $types);
        }
        else
        {
            $types[ 0 ] = null;
            return array('(' . implode('', $p) . ')', $numGroups+1, $types);
        }
    }
    
    private static function split( $s, $d1, $d2=null ) 
    {
        if ( !$d2 ) 
        {
            return explode($d1, $s);
        }
        else
        {
            $parts = array( );  
            $s = explode($d1, $s);
            foreach ($s as $part)
            {
                $part = explode($d2, $part);
                $parts[] = $part[ 0 ];
                if ( count($part) > 1 ) $parts[] = $part[ 1 ];
            }
            return $parts;
        }
    }
}
Dromeo::$TYPES['INTEGER']   = array('Dromeo','type_to_int');
Dromeo::$TYPES['STRING']    = array('Dromeo','type_to_str');
Dromeo::$TYPES['URLDECODE'] = array('Dromeo','type_to_urldecode');
Dromeo::$TYPES['ARRAY']     = array('Dromeo','type_to_array');
Dromeo::$TYPES['PARAMS']    = array('Dromeo','type_to_params');
// aliases
Dromeo::$TYPES['INT']       = Dromeo::$TYPES['INTEGER'];
Dromeo::$TYPES['STR']       = Dromeo::$TYPES['STRING'];
Dromeo::$TYPES['VAR']       = Dromeo::$TYPES['URLDECODE'];
Dromeo::$TYPES['URLENCODED']= Dromeo::$TYPES['PARAMS'];
}