<?php
/**
*
*   Dromeo
*   Simple and Flexible Routing Framework for PHP, Python, Node/JS
*   @version: 0.5
*
*   https://github.com/foo123/Dromeo
*
**/
if (!class_exists('Dromeo'))
{

class DromeoRoute
{
    public $handlers = null;
    public $route = null;
    public $pattern = null;
    public $captures = null;
    
    public function __construct( $route, $pattern, $captures ) 
    {
        $this->handlers = array( );
        $this->route = $route;
        $this->pattern = $pattern;
        $this->captures = $captures;
    }
    
    public function dispose( ) 
    {
        $this->handlers = null;
        $this->route = null;
        $this->pattern = null;
        $this->captures = null;
        return $this;
    }
}

class Dromeo 
{
    const VERSION = "0.5";
    
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
    
    private static $_patternOr = '/^([a-zA-Z0-9-_]+\\|[a-zA-Z0-9-_|]+)$/';
    private static $_group = '/\\((\\d+)\\)$/';
    
    private $_delims = null;
    private $_patterns = null;
    private $_handlers = null;
    private $_routes = null;
    private $_fallback = false;
    
    public function __construct( ) 
    {
        $this->_delims = array('{', '}', ':', '%');
        $this->_patterns = array( );
        $this->definePattern( 'ALPHA',   '[a-zA-Z\\-_]+' );
        $this->definePattern( 'NUMBR',   '[0-9]+' );
        $this->definePattern( 'ALNUM',   '[a-zA-Z0-9\\-_]+' );
        $this->definePattern( 'QUERY',   '\\?[^?#]+' );
        $this->definePattern( 'FRAGM',   '#[^?#]+' );
        $this->definePattern( 'ALL',     '.+' );
        $this->_handlers = array( );
        $this->_routes = array( );
        $this->_fallback = false;
    }
    
    public function dispose( ) 
    {
        $this->_delims = null;
        $this->_patterns = null;
        $this->_routes = null;
        $this->_fallback = null;
        foreach ( $this->_handlers as $r ) $r->dispose( );
        $this->_handlers = null;
        return $this;
    }
        
    public function reset( )
    {
        $this->_handlers = array( );
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
        }
        return $this;
    }
    
    public function definePattern( $className, $subPattern )
    {
        $this->_patterns[ $className ] = $subPattern;
        return $this;
    }
    
    public function dropPattern( $className )
    {
        if ( isset($this->_patterns[ $className ]) )
        {
            unset($this->_patterns[ $className ]);
        }
        return $this;
    }
    
    /*public function debug( )
    {
        echo 'Routes: ' . print_r($this->_routes, true) . PHP_EOL;
        echo 'Fallback: ' . print_r($this->_fallback, true) . PHP_EOL;
    }*/
    
    // parse and extract uri components and optional query/fragment params
    public function parse( $s, $query_p='query_params', $fragment_p='fragment_params' ) 
    {
        $COMPONENTS = array( );
        if ( $s )
        {
            $COMPONENTS = parse_url( $s );
            
            if ( $query_p  )
            {
                if ( isset($COMPONENTS[ 'query' ]) && $COMPONENTS[ 'query' ] ) 
                    $COMPONENTS[ $query_p ] = $this->unglue( $COMPONENTS[ 'query' ] );
                else
                    $COMPONENTS[ $query_p ] = array( );
            }
            if ( $fragment_p )
            {
                if ( isset($COMPONENTS[ 'fragment' ]) && $COMPONENTS[ 'fragment' ] ) 
                    $COMPONENTS[ $fragment_p ] = $this->unglue( $COMPONENTS[ 'fragment' ] );
                else
                    $COMPONENTS[ $fragment_p ] = array( );
            }
        }
        return $COMPONENTS;
    }

    // unglue/extract params object from uri component
    public function unglue( $s ) 
    {
        $PARAMS = array( );
        if ( $s ) parse_str( $s, $PARAMS );
        return $PARAMS;
    }

    // build a url from baseUrl plus query/hash params
    public function build( $baseUrl, $query=null, $hash=null, $q='?', $h='#' ) 
    {
        $url = '' . $baseUrl;
        if ( $query )  $url .= $q . $this->glue( $query );
        if ( $hash )  $url .= $h . $this->glue( $hash );
        return $url;
    }
        
    // build/glue together a uri component from a params object
    public function glue( $params ) 
    {
        $component = '';
        // http://php.net/manual/en/function.http-build-query.php (for '+' sign convention)
        if ( $params ) $component .= str_replace('+', '%20', http_build_query( $params, '', '&'/*,  PHP_QUERY_RFC3986*/ ));
        return $component;
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
        $args = func_get_args( );
        $args_len = count( $args );
        
        if ( 2 <= $args_len )
        {
            $route =& $args; 
            if ( isset($route[2]) ) $defaults = $route[2];
            else $defaults = null;
            
            self::addRoute($this->_handlers, $this->_routes, $this->_delims, $this->_patterns, $route[0], $route[1], $defaults);
        }
        elseif ( 1 === $args_len && is_array($args[ 0 ]) )
        {
            foreach ($args[ 0 ] as $route)
            {
                if ( count($route) >= 2 )
                {
                    if ( isset($route[2]) ) $defaults = $route[2];
                    else $defaults = null;
                    
                    self::addRoute($this->_handlers, $this->_routes, $this->_delims, $this->_patterns, $route[0], $route[1], $defaults);
                }
            }
        }
        return $this;
    }
    
    public function one( /* var args here .. */ ) 
    {
        $args = func_get_args( );
        $args_len = count( $args );
        
        if ( 2 <= $args_len )
        {
            $route =& $args; 
            if ( isset($route[2]) ) $defaults = $route[2];
            else $defaults = null;
            
            self::addRoute($this->_handlers, $this->_routes, $this->_delims, $this->_patterns, $route[0], $route[1], $defaults, true);
        }
        elseif ( 1 === $args_len && is_array($args[ 0 ]) )
        {
            foreach ($args[ 0 ] as $route)
            {
                if ( count($route) >= 2 )
                {
                    if ( isset($route[2]) ) $defaults = $route[2];
                    else $defaults = null;
                    
                    self::addRoute($this->_handlers, $this->_routes, $this->_delims, $this->_patterns, $route[0], $route[1], $defaults, true);
                }
            }
        }
        return $this;
    }
    
    public function off( $route, $handler=null )
    {
        if ( $route && (isset($this->_handlers[$route])) )
        {
            if ( $handler && is_callable($handler) )
            {
                $r =& $this->_handlers[$route];
                $l = count($r->handlers);
                for ($i=$l-1; $i>=0; $i--)
                {
                    if ( $handler === $r->handlers[ $i ][0] )
                    {
                        array_splice($r->handlers, $i, 1);
                    }
                }
                if ( empty($r->handlers) )
                    self::clearRoute( $this->_handlers, $this->_routes, $route );
            }
            else
            {
                self::clearRoute( $this->_handlers, $this->_routes, $route );
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
    
    public function route( $r=null ) 
    {
        if ( $r )
        {
            foreach ($this->_routes as $route) 
            {
                if ( !preg_match($route->pattern, $r, $m, 0, 0) ) continue;

                // copy handlers avoid mutation during calls
                $handlers = array_merge(array(), $route->handlers);
                
                // remove oneOffs
                $oneOffs = array();
                $l = count($handlers);
                for ($i=0; $i<$l; $i++)
                {
                    if ( $handlers[$i][2] ) $oneOffs[] = $i;
                }
                $l = count($oneOffs);
                while (--$l >= 0 ) array_splice($route->handlers, array_pop($oneOffs), 1);
                
                // make calls
                foreach ( $handlers as $handler )
                {
                    // get params
                    $params = array( );
                    foreach ($route->captures as $v=>$g) 
                    {
                        if ( isset( $m[ $g ] ) && $m[ $g ] )
                            $params[ $v ] = $m[ $g ];
                        elseif ( isset( $handler[1][ $v ] ) )
                            $params[ $v ] = $handler[1][ $v ];
                        else
                            $params[ $v ] = null;
                    }
                    call_user_func( $handler[0], $r, $params );
                }
                return true;
            }
        }
        if ( $this->_fallback )
        {
            call_user_func( $this->_fallback, $r, false );
            return false;
        }
        return false;
    }
    
    private static function clearRoute( &$handlers, &$routes, $route )
    {
        unset( $handlers[$route] );
        $l = count($routes);
        for ($i=$l-1; $i>=0; $i--)
        {
            if ( $route === $routes[ $i ]->route )
            {
                array_splice($routes, $i, 1);
                break;
            }
        }
    }

    private static function addRoute( &$handlers, &$routes, &$delims, &$patterns, $route, $handler, $defaults=null, $oneOff=false)
    {
        if ( !empty($route) && strlen($route) && $handler && is_callable($handler) )
        {
            $oneOff = (true === $oneOff);
            if ( !$defaults ) $defaults = array( );
            $defaults = (array)$defaults;
            
            if ( isset($handlers[ $route ]) )
            {
                $handlers[ $route ]->handlers[] = array($handler, $defaults, $oneOff);
            }
            else
            {
                $handlers[ $route ] = self::makeRoute( $delims, $patterns, $route );
                $handlers[ $route ]->handlers[] = array($handler, $defaults, $oneOff);
                $routes[] = $handlers[ $route ];
            }
        }
    }
    
    private static function makeRoute( &$_delims, &$_patterns, $route )
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
                
                // http://abc.org/{%ALFA%:user}{/%NUM%:?id(1)}
                $p = explode( $_delims[ 2 ], $part );
                $capturePattern = self::makePattern( $_delims, $_patterns, $p[ 0 ] );
                
                if ( count($p) > 1 )
                {
                    $captureName = trim( $p[ 1 ] );
                    $isOptional = (strlen($captureName) && '?' === substr($captureName,0, 1));
                    if ( $isOptional ) $captureName = substr($captureName, 1);
                
                    if ( preg_match(self::$_group, $captureName, $m) )
                    {
                        $captureName = substr($captureName, 0, -strlen($m[0]));
                        $captureIndex = intval($m[1]);
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
                        $captureIndex = $numGroups + 1;
                    }
                    
                    $isCaptured = (strlen($captureName) > 0);
                }
                
                $pattern .= $capturePattern[ 0 ];
                $numGroups += $capturePattern[ 1 ];
                if ( $isOptional ) $pattern .= '?';
                if ( $isCaptured ) $captures[ $captureName ] = $captureIndex;
                $isPattern = false;
            }
            else
            {
                $pattern .= preg_quote( $part, '/' );
                $isPattern = true;
            }
        }
        return new DromeoRoute( $route, '/^' . $pattern . '$/', $captures );
    }
    
    private static function makePattern( &$_delims, &$_patterns, $pattern ) 
    {
        $numGroups = 0;
        $pattern = self::split( $pattern, $_delims[3] );
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
                        $p[ ] = '(' . $_patterns[ $pattern[ $i ] ] . ')';
                        $numGroups++;
                    }
                    elseif ( preg_match( self::$_patternOr, $pattern[ $i ], $m ) )
                    {
                        $p[ ] = '(' . implode( '|', array_map( 'preg_quote', array_filter( explode( '|', $m[1] ), 'strlen' ) ) ) . ')';
                        $numGroups++;
                    }
                    else
                    {
                        $p[ ] = preg_quote( $pattern[ $i ], '/' );
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
            return array(implode('', $p), $numGroups);
        else
            return array('(' . implode('', $p) . ')', $numGroups+1);
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
}