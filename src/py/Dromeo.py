# -*- coding: UTF-8 -*-
##
#   Dromeo
#   Simple and Flexible Pattern Routing Framework for PHP, JavaScript, Python
#   @version: 1.3.0
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


def array_keys(o):
    if isinstance(o, (list,tuple)): return list(map(str, range(0,len(o))))
    if isinstance(o, dict): return list(o.keys())
    return []

def array_values(o):
    if isinstance(o, list): return o
    if isinstance(o, tuple): return list(o)
    if isinstance(o, dict):
        if is_numeric_array(o):
            # get values in list-order by ascending index
            v = []
            l = len(o)
            i = 0
            while i < l:
                v.append(o[str(i)])
                i += 1
            return v
        else:
            return list(o.values())
    return []

def is_numeric_array(o):
    if isinstance(o,(list,tuple)): return True
    if isinstance(o,dict):
        k = array_keys(o)
        i = 0
        l = len(k)
        while i < l:
            if str(i) not in k: return False
            i += 1
        return True
    return False

# (protected) global properties
class _G:

    uriParser = {
    'php': re.compile(r'^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)'),
    'strict': re.compile(r'^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)'),
    'loose': re.compile(r'^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/\/?)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)')
    }

    uriComponent = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port',
        'relative', 'path', 'directory', 'file', 'query', 'fragment']

    patternOr = re.compile(r'^([^|]+\|.+)$')
    nested = re.compile(r'\[([^\]]*?)\]$')
    group = re.compile(r'\((\d+)\)$')
    digit = re.compile(r'^\d+$')
    inited = False


def parse_url(s, component = None, mode = 'php'):
    # http://www.php2python.com/wiki/function.parse-url/
    global _G

    m = _G.uriParser[mode].match(s)
    uri = {}
    i = 14

    while i > 0:
        i -= 1
        if m.group(i):  uri[_G.uriComponent[i]] = m.group(i)

    if 'port' in uri: uri['port'] = int(uri['port'], 10)

    if component:
        component = component.replace('PHP_URL_', '').lower()
        return uri[component] if component in uri else None

    if 'source' in uri: del uri['source']
    return uri

def parse_str(s):
    # http://www.php2python.com/wiki/function.parse-str/
    global _G

    strArr = s.strip('&').split('&')
    array = {}
    possibleLists = []

    for tmp in strArr:
        tmp = tmp.split('=')
        key = rawurldecode(tmp[0].strip())
        if len(tmp) < 2: value = ''
        else: value = rawurldecode(tmp[1].strip())

        j = key.find('\x00')
        if j > -1: key = key[0:j]

        if key and ('[' != key[0]):
            keys = []

            postLeftBracketPos = 0
            lk = len(key)
            for j in range(lk):
                if '[' == key[j] and 0 == postLeftBracketPos:
                    postLeftBracketPos = j + 1

                elif ']' == key[j]:
                    if postLeftBracketPos:
                        if 0 == len(keys):
                            keys.append(key[0:postLeftBracketPos - 1])
                        keys.append(key[postLeftBracketPos:j])
                        postLeftBracketPos = 0
                        if j < lk-1 and '[' != key[j + 1]: break

            if 0 == len(keys): keys = [key]

            for j in range(len(key[0])):
                chr = keys[0][j]
                if ' ' == chr or '.' == chr or '[' == chr:
                    keys[0] = keys[0][0:j] + '_' + keys[0][j + 1:]
                if '[' == chr: break

            obj = array
            key = None
            lastObj = obj
            lastkey = keys[len(keys)-1].strip("'\"").strip() if len(keys) else None
            for j in range(len(keys)):
                prevkey = key
                key = keys[j].strip("'\"")
                prevobj = lastObj
                lastObj = obj

                if '' != key.strip() or 0 == j:
                    if key not in obj: obj[key] = [] if (j+1 == len(keys)-1) and (''==lastkey) else {}
                    obj = obj[key]
                else:
                    # To insert new dimension
                    #ct = -1
                    #for p in obj:
                    #    if _G.digit.match(p) and int(p) > ct: ct = int(p)
                    #key = str(ct + 1)
                    key = True
            if key is True:
                lastObj.append(value)
            else:
                try:
                    ikey = int(key, 10)
                except BaseException as exc:
                    ikey = -1
                if 0 <= ikey:
                    possibleLists.append({'key':prevkey,'obj':prevobj})
                lastObj[key] = value
    i = len(possibleLists)-1
    while i >= 0:
        # safe to pass multiple times same obj, it is possible
        obj = possibleLists[i]['obj'][possibleLists[i]['key']] if possibleLists[i]['key'] else possibleLists[i]['obj']
        if is_numeric_array(obj):
            obj = array_values(obj)
            if possibleLists[i]['key']:
                possibleLists[i]['obj'][possibleLists[i]['key']] = obj
            else:
                array = obj
        i -= 1
    return array

def http_build_query_helper(key, val, arg_separator, PHP_QUERY_RFC3986):
    encode = rawurlencode if PHP_QUERY_RFC3986 else urlencode

    if True == val: val = "1"
    elif False == val: val = "0"

    if val is not None:

        key = str(key)

        data = None
        if isinstance(val, dict): data = val.items()
        elif isinstance(val, (list, tuple)): data = enumerate(val)

        if data:
            tmp = []
            for k,v in data:
                if v is not None:
                    tmp.append(http_build_query_helper(key + "[" + str(k) + "]", v, arg_separator, PHP_QUERY_RFC3986))
            return arg_separator.join(tmp)

        else:
            return encode(key) + "=" + encode(str(val))

    else:
        return ''

def http_build_query(data, arg_separator = '&', PHP_QUERY_RFC3986 = False):
    tmp = [ ]
    for key,value in data.items():
        query = http_build_query_helper(key, value, arg_separator, PHP_QUERY_RFC3986)
        if '' != query: tmp.append(query)

    return arg_separator.join(tmp)


def length(s):
    return len(s) > 0


def split(s, d1, d2 = None):
    if (d1==d2) or (not d2):
        return s.split(d1)
    else:
        parts = []
        s = s.split(d1)
        for part in s:
            part = part.split(d2)
            parts.append(part[0])
            if len(part) > 1: parts.append(part[1])
        return parts


def makePattern(delims, patterns, pattern):
    global _G

    numGroups = 0
    types = {}
    pattern = split(pattern, delims[2], delims[3])
    p = []
    tpl = []
    tplPattern = None
    isPattern = False
    for i,pt in enumerate(pattern):
        if isPattern:
            if len(pt):
                if pt in patterns:
                    p.append('(' + patterns[pt][0] + ')')
                    numGroups += 1
                    # typecaster
                    if patterns[pt][1]: types[str(numGroups)] = patterns[pt][1]
                    if tplPattern is None: tplPattern = p[len(p)-1]
                else:
                    m = _G.patternOr.match(pt)
                    if m:
                        p.append('(' + '|'.join( map( re.escape, filter( length, m.group(1).split('|') ) ) ) + ')')
                        numGroups += 1
                        if tplPattern is None: tplPattern = p[len(p)-1]
                    elif len(pt):
                        p.append('(' + re.escape( pt ) + ')')
                        numGroups += 1
                        if tplPattern is None: tplPattern = p[len(p)-1]
            tpl.append(True)
            isPattern = False
        else:
            if len(pt):
                p.append(re.escape(pt))
                tpl.append(pt)
            isPattern = True

    if 1 == len(p) and 1 == numGroups:
        types['0'] = types['1'] if '1' in types else None
        pat = ''.join(p)
        return [pat, numGroups, types, tpl, tplPattern if tplPattern else pat]
    else:
        types['0'] = None
        pat = '(' + ''.join(p) + ')'
        return [pat, numGroups+1, types, tpl, tplPattern if tplPattern else pat]


def makeRoute(delims, patterns, route, method = None, prefix = None):
    global _G

    if delims[0] not in route:
        # literal route
        return [route, prefix+route if prefix and len(prefix) else route, {}, method, True, [route]]

    parts = split(route, delims[0], delims[1])
    isPattern = False
    pattern = ''
    numGroups = 0
    captures = {}
    tpl = []
    if prefix and len(prefix):
        pattern += re.escape(prefix)

    for part in parts:

        if isPattern:
            isOptional = False
            isCaptured = False
            patternTypecaster = None

            # http://abc.org/{%ALFA%:user}{/%NUM%:?id(1)}
            p = part.split(delims[4])
            if not len(p[0].strip()):
                # http://abc.org/{:user}/{:?id}
                # assume pattern is %PART%
                p[0] = delims[2] + 'PART' + delims[3]
            capturePattern = makePattern(delims, patterns, p[0])

            if len(p) > 1:
                captureName = p[1].strip()
                isOptional = (len(captureName)>0 and '?' == captureName[0])
                if isOptional: captureName = captureName[1:]

                m = _G.group.search(captureName)
                if m:
                    captureName = captureName[:-len(m.group(0))]
                    captureIndex = int(m.group(1), 10)
                    patternTypecaster = capturePattern[2][str(captureIndex)] if str(captureIndex) in capturePattern[2] else None
                    if captureIndex > 0 and captureIndex < capturePattern[1]:
                        captureIndex += numGroups + 1
                    else:
                        captureIndex = numGroups + 1
                else:
                    patternTypecaster = capturePattern[2]['0'] if capturePattern[2]['0'] else None
                    captureIndex = numGroups + 1

                isCaptured = (len(captureName) > 0)

            pattern += capturePattern[0]
            numGroups += capturePattern[1]
            if isOptional: pattern += '?'
            if isCaptured: captures[captureName] = [captureIndex, patternTypecaster]
            if isCaptured:
                tpl.append({
                    'name'        : captureName,
                    'optional'    : isOptional,
                    're'          : re.compile('^' + capturePattern[4] + '$'),
                    'tpl'         : capturePattern[3]
                });
            isPattern = False
        else:
            pattern += re.escape(part)
            tpl.append(part)
            isPattern = True

    return [route, re.compile('^' + pattern + '$'), captures, method, False, tpl]


def to_method(method):
    method = (list(map(lambda x: str(x).lower(), method)) if isinstance(method,(list,tuple)) else [str(method).lower()]) if method else ['*']
    if '*' in method: method = ['*']
    method = list(sorted(method))
    return method

def insertRoute(router, route, oneOff = False):
    if route and isinstance(route, dict) and ('route' in route) and isinstance(route['route'], str) and ('handler' in route) and callable(route['handler']):
        oneOff = (oneOff is True)
        handler = route['handler']
        defaults = dict(route['defaults']) if 'defaults' in route else {}
        types = dict(route['types']) if ('types' in route) and route['types'] else None
        name = str(route['name']) if 'name' in route else None
        method = to_method(route['method'] if 'method' in route else None)
        route = router.key + str(route['route'])
        key = Route.to_key(route, method)
        r = None
        for rt in router._routes:
            if key == rt.key:
                r = rt
                break

        if not r:
            r = Route(router._delims, router._patterns, route, method, name, router._prefix)
            router._routes.append(r)
            router._addNamedRoute(r)

        r.handlers.append([
            handler,
            defaults,
            types,
            oneOff,
            0
        ])


def clearRoute(router, key):
    l = len(router._routes)-1
    while l >= 0:
        if key == router._routes[l].key:
            route = router._routes[l]
            del router._routes[l:l+1]
            router._delNamedRoute(route)
            route.dispose()
        l -= 1

def type_to_int(v):
    try:
        v = int(v, 10)
    except ValueError:
        v = 0
    return 0 if not v else v # take account of nan

def type_to_str(v):
    return v if isinstance(v, str) else str(v)

def type_to_urldecode(v):
    return urldecode(v)

def type_to_array(v):
    return v if isinstance(v, (list,tuple)) else [v]

def type_to_params(v):
    return Dromeo.unglue_params(v) if isinstance(v, str) else v

class DromeoException(Exception):
    pass

class Route:

    def to_key(route, method):
        return ','.join(method) + '->' + route;


    def __init__(self, delims, patterns, route, method, name = None, prefix = ''):
        self.__args__ = [delims, patterns]
        self.isParsed = False # lazy init
        self.handlers = []
        self.route = str(route) if route is not None else ''
        self.prefix = str(prefix) if prefix is not None else ''
        self.method = method
        self.pattern = None
        self.captures = None
        self.literal = False
        self.namespace = None
        self.tpl = None
        self.name = str(name) if name is not None else None
        self.key = Route.to_key(self.route, self.method);

    def __del__(self):
        self.dispose()

    def dispose(self):
        self.__args__ = None
        self.isParsed = None
        self.handlers = None
        self.route = None
        self.prefix = None
        self.pattern = None
        self.captures = None
        self.tpl = None
        self.method = None
        self.literal = None
        self.namespace = None
        self.name = None
        self.key = None
        return self

    def parse(self):
        if self.isParsed: return self
        r = makeRoute(self.__args__[0], self.__args__[1], self.route, self.method, self.prefix)
        self.pattern = r[1]
        self.captures = r[2]
        self.tpl = r[5]
        self.literal = r[4] is True
        self.__args__ = None
        self.isParsed = True
        return self

    def match(self, route, method = '*'):
        if (method not in self.method) and ('*' != self.method[0]): return None
        if not self.isParsed: self.parse() # lazy init
        route = str(route)
        return (True if self.pattern == route else None) if self.literal else self.pattern.match(route)

    def make(self, params = dict(), strict = False):
        out = ''
        strict = strict is True
        if not self.isParsed: self.parse() # lazy init
        tpl = self.tpl
        i = 0
        l = len(tpl)
        while i < l:
            tpli = tpl[i]
            i += 1

            if isinstance(tpli,str):
                out += tpli
            else:
                if (tpli['name'] not in params) or (params[tpli['name']] is None):
                    if tpli['optional']:
                        continue
                    else:
                        raise DromeoException('Dromeo: Route "'+self.name+'" (Pattern: "'+self.route+'") missing parameter "'+tpli['name']+'"!')
                else:
                    param = params[tpli['name']]
                    if not isinstance(param, (list,tuple)): param = [param]
                    param = list(map(lambda p: str(p), param))
                    if strict and not re.search(tpli['re'], param[0]):
                        raise DromeoException('Dromeo: Route "'+self.name+'" (Pattern: "'+self.route+'") parameter "'+tpli['name']+'" value "'+param[0]+'" does not match pattern!')
                    part = tpli['tpl']
                    j = 0
                    k = len(part)
                    p = 0
                    while j < k:
                        if part[j] is True:
                            out += (param[p] if p < len(param) else param[0])
                            p += 1
                        else:
                            out += part[j]
                        j += 1
        return out

    def sub(self, match, data, type = None, getter = None):
        if (not self.isParsed) or self.literal: return self

        givenInput = match.group(0)
        hasGetter = callable(getter)
        for v,g in self.captures.items():
            groupIndex = g[0]
            groupTypecaster = g[1]
            if match.group(groupIndex):
                matchedValue = match.group(groupIndex)
                if hasGetter:
                    # if getter is given,
                    # get true match from getter (eg with original case)
                    matchedValueTrue = str(getter(v, matchedValue, match.start(groupIndex), match.end(groupIndex), givenInput))
                else:
                    # else what matched
                    matchedValueTrue = matchedValue

                if type and (v in type) and type[v]:
                    typecaster = type[v]
                    if isinstance(typecaster,str) and (typecaster in Dromeo.TYPES):
                        typecaster = Dromeo.TYPES[typecaster]
                    data[v] = typecaster(matchedValueTrue) if callable(typecaster) else matchedValueTrue
                elif groupTypecaster:
                    typecaster = groupTypecaster
                    data[v] = typecaster(matchedValueTrue) if callable(typecaster) else matchedValueTrue
                else:
                    data[v] = matchedValueTrue
            elif v not in data:
                data[v] = None
        return self

class Dromeo:
    """
    Dromeo Router for Python,
    https://github.com/foo123/Dromeo
    """

    VERSION = "1.3.0"

    Route = Route
    Exception = DromeoException
    to_method = to_method

    TYPES = {
    'INTEGER'   : type_to_int,
    'STRING'    : type_to_str,
    'URLDECODE' : type_to_urldecode,
    'ARRAY'     : type_to_array,
    'PARAMS'    : type_to_params
    # aliases
    ,
    'INT'       : type_to_int,
    'STR'       : type_to_str,
    'VAR'       : type_to_urldecode,
    'URLENCODED': type_to_params
    }

    # build/glue together a uri component from a params object
    def glue_params(params):
        component = '';
        # http://php.net/manual/en/function.http-build-query.php (for '+' sign convention)
        if params:  component += http_build_query(params, '&', True)
        return component

    # unglue/extract params object from uri component
    def unglue_params(s):
        if s: PARAMS = parse_str(s)
        else: PARAMS = {}
        return PARAMS

    # parse and extract uri components and optional query/fragment params
    def parse_components(s, query_p = 'query_params', fragment_p = 'fragment_params'):
        COMPONENTS = {}
        if s:
            COMPONENTS = parse_url(s)

            if query_p:
                if 'query' in COMPONENTS:
                    COMPONENTS[query_p] = Dromeo.unglue_params(COMPONENTS['query'])
                else:
                    COMPONENTS[query_p] = {}

            if fragment_p:
                if 'fragment' in COMPONENTS:
                    COMPONENTS[fragment_p] = Dromeo.unglue_params(COMPONENTS['fragment'])
                else:
                    COMPONENTS[fragment_p] = {}

        return COMPONENTS


    # build a url from baseUrl plus query/hash params
    def build_components(baseUrl, query = None, hash = None, q = '?', h = '#'):
        url = '' + baseUrl
        if query:  url += q + Dromeo.glue_params(query)
        if hash:  url += h + Dromeo.glue_params(hash)
        return url

    def defType(type, caster):
        if type and caster and callable(caster):
            Dromeo.TYPES[type] = caster

    def TYPE(type):
        if type and (type in Dromeo.TYPES): return Dromeo.TYPES[type]
        return None


    def __init__(self, prefix = '', group = '', top = None):
        self._delims = ['{', '}', '%', '%', ':']
        self._patterns = {}
        self.definePattern('ALPHA',      '[a-zA-Z\\-_]+')
        self.definePattern('ALNUM',      '[a-zA-Z0-9\\-_]+')
        self.definePattern('ASCII',      '[ -~]+')
        self.definePattern('NUMBR',      '[0-9]+')
        self.definePattern('INT',        '[0-9]+',          'INT')
        self.definePattern('PART',       '[^\\/?#]+')
        self.definePattern('VAR',        '[^=?&#\\/]+',     'VAR')
        self.definePattern('QUERY',      '\\?[^?#]+')
        self.definePattern('FRAGMENT',   '#[^?#]+')
        self.definePattern('URLENCODED', '[^\\/?#]+',       'URLENCODED')
        self.definePattern('ALL',        '.+')
        self.definePattern('ANY',        '[\\s\\S]+')
        self._routes = []
        self._named_routes = {}
        self._fallback = False
        self._top = top if isinstance(top, Dromeo) else self
        self.key = '' if self == self._top else (self._top.key + str(group))
        self._prefix = '' if prefix is None else str(prefix)


    def __del__(self):
        self.dispose()

    def dispose(self):
        self._top = None
        self._delims = None
        self._patterns = None
        self._fallback = None
        self._prefix = None
        if self._routes:
            for r in self._routes: r.dispose()
        self._routes = None
        self._named_routes = None
        return self

    def top(self):
        return self._top

    def isTop(self):
        return (self._top is None) or (self == self._top)

    def clone(self, group = ''):
        cloned = Dromeo(self._prefix, group, self)
        cloned.defineDelimiters(self._delims)
        for className in self._patterns:
            args = self._patterns[className]
            cloned.definePattern(className, args[0], args[1] if 1 < len(args) else None)
        return cloned

    def reset(self):
        self._routes = []
        self._named_routes = {}
        self._fallback = False
        return self

    def defineDelimiters(self, delims):
        if delims:
            l = len(delims)
            if l > 0 and delims[0]: self._delims[0] = delims[0]
            if l > 1 and delims[1]: self._delims[1] = delims[1]
            if l > 2 and delims[2]: self._delims[2] = delims[2]
            if l > 3 and delims[3]: self._delims[3] = delims[3]
            if l > 4 and delims[4]: self._delims[4] = delims[4]
        return self


    def definePattern(self, className, subPattern, typecaster = None):
        if typecaster and isinstance(typecaster, str) and typecaster in Dromeo.TYPES:
            typecaster = Dromeo.TYPES[typecaster]
        if not typecaster or not callable(typecaster): typecaster = None
        self._patterns[className] = [subPattern, typecaster]
        return self


    def dropPattern(self, className):
        if className in self._patterns:
            del self._patterns[className]
        return self

    def defineType(self, type, caster):
        Dromeo.defType(type, caster)
        return self


    #def debug(self):
    #    print('Routes: ', pprint.pformat(self._routes, 4))
    #    print('Fallback: ', pprint.pformat(self._fallback, 4))

    # build/glue together a uri component from a params object
    def glue(self, params):
        return Dromeo.glue_params(params)

    # unglue/extract params object from uri component
    def unglue(self, s):
        return Dromeo.unglue_params(s)

    # parse and extract uri components and optional query/fragment params
    def parse(self, s, query_p = 'query_params', fragment_p = 'fragment_params'):
        return Dromeo.parse_components(s, query_p, fragment_p)


    # build a url from baseUrl plus query/hash params
    def build(self, baseUrl, query = None, hash = None, q = '?', h = '#'):
        return Dromeo.build_components(baseUrl, query, hash, q, h)


    def onGroup(self, groupRoute, handler):
        groupRoute = str(groupRoute)
        if len(groupRoute) and callable(handler):
            groupRouter = self.clone(groupRoute)
            self._routes.append(groupRouter)
            handler(groupRouter)
        return self

    def on(self, *args):
        args_len = len(args)

        if 1 == args_len:
            routes = args[0] if isinstance(args[0], (list, tuple)) else [args[0]]
        elif 2 == args_len and isinstance(args[0], str) and callable(args[1]):
            routes = [{
                'route': args[0],
                'handler': args[1],
                'method': '*',
                'defaults': {},
                'types': None
            }]
        else:
            routes = args

        for route in routes:
            insertRoute(self, route, False)
        return self


    def one(self, *args):
        args_len = len(args)

        if 1 == args_len:
            routes = args[0] if isinstance(args[0], (list, tuple)) else [args[0]]
        elif 2 == args_len and isinstance(args[0], str) and callable(args[1]):
            routes = [{
                'route': args[0],
                'handler': args[1],
                'method': '*',
                'defaults': {},
                'types': None
            }]
        else:
            routes = args

        for route in routes:
            insertRoute(self, route, True)
        return self


    def off(self, route, handler = None, method = '*'):
        if not route: return self

        routes = self._routes
        named_routes = self._named_routes
        prefix = self._prefix

        if isinstance(route, dict):
            handler = route['handler'] if 'handler' in route else handler
            method = route['method'] if 'method' in route else method
            route = route['route'] if 'route' in route else None
            if not route: return self

            route = str(route)
            key = Route.to_key(route, to_method(method))
            r = None
            for rt in routes:
                if isinstance(rt, Dromeo):
                    rt.off(route, handler, method)
                else:
                    if key == rt.key:
                        r = rt
                        break

            if not r: return self

            if handler and callable(handler):
                l = len(r.handlers)-1
                while l>=0:
                    if handler == r.handlers[l][0]:
                        # http://www.php2python.com/wiki/function.array-splice/
                        del r.handlers[l:l+1]
                    l -= 1
                if not len(r.handlers):
                    clearRoute(self, key)
            else:
                clearRoute(self, key)

        elif isinstance(route, str) and len(route):
            route = str(route)
            key = Route.to_key(route, to_method(method))
            r = None
            for i,rt in enumerate(routes):
                if isinstance(rt, Dromeo):
                    if route == rt.key:
                        r = rt
                        break
                    else:
                        rt.off(route, handler, method)
                else:
                    if key == rt.key:
                        r = rt
                        break

            if not r: return self

            if isinstance(r, Dromeo):
                del routes[i:i+1]
                r.dispose()
            else:
                if handler and callable(handler):
                    l = len(r.handlers)-1
                    while l>=0:
                        if handler == r.handlers[l][0]:
                            # http://www.php2python.com/wiki/function.array-splice/
                            del r.handlers[l:l+1]
                        l -= 1
                    if not len(r.handlers):
                        clearRoute(self, key)
                else:
                    clearRoute(self, key)

        return self


    def fallback(self, handler = False):
        if handler is False or handler is None or callable(handler):
            self._fallback = handler
        return self


    def make(self, named_route, params = dict(), strict = False):
        return self._named_routes[named_route].make(params, strict) if named_route in self._named_routes else None

    def route(self, r, method = "*", breakOnFirstMatch = True, getter = None):
        if (not self.isTop()) and (not len(self._routes)): return False
        proceed = True
        found = False
        r = str(r) if r is not None else ''
        prefix = self._prefix + self.key
        if len(prefix):
            proceed = (prefix == r[0:len(prefix)])

        if proceed:
            breakOnFirstMatch = breakOnFirstMatch is not False
            method = str(method).lower() if method else "*"
            routes = self._routes[:] # copy, avoid mutation
            for route in routes:

                if isinstance(route, Dromeo):
                    # group router
                    match = route.route(r, method, breakOnFirstMatch, getter)
                    if not match: continue
                    found = True
                else:
                    # simple route
                    match = route.match(r, method)
                    if not match: continue
                    found = True

                    # copy handlers avoid mutation during calls
                    handlers = route.handlers[:]

                    # make calls
                    to_remove = []
                    for h in range(len(handlers)):
                        handler = handlers[h]
                        # handler is oneOff and already called
                        if handler[3] and handler[4]:
                            to_remove.insert(0, h)
                            continue

                        defaults = handler[1]
                        type = handler[2]
                        params = {
                            'route': r,
                            'method': method,
                            'pattern': route.route,
                            'fallback': False,
                            'data': copy.deepcopy(defaults)
                        }
                        route.sub(match, params['data'], type, getter)

                        handler[4] = 1 # handler called
                        if handler[3]: to_remove.insert(0, h)
                        handler[0](params)

                    # remove called oneOffs
                    for h in to_remove:
                        del route.handlers[h:h+1]
                    if not len(route.handlers):
                        clearRoute(self, route.key)

                if breakOnFirstMatch: return True

            if found: return True

        if self._fallback and self.isTop():
            self._fallback({
                'route': r,
                'method': method,
                'pattern': None,
                'fallback': True,
                'data': None
            })

        return False

    def _addNamedRoute(self, route):
        if self.isTop():
            if isinstance(route, Dromeo.Route) and route.name and len(route.name):
                self._named_routes[route.name] = route
        else:
            self.top()._addNamedRoute(route)
        return self

    def _delNamedRoute(self, route):
        if self.isTop():
            if isinstance(route, Dromeo.Route) and route.name and (route.name in self._named_routes):
                del self._named_routes[route.name]
        else:
            self.top()._delNamedRoute(route)
        return self


# if used with 'import *'
__all__ = ['Dromeo']
