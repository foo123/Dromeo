/**
*
*   Dromeo
*   Simple and Flexible Pattern Routing Framework for PHP, JavaScript, Python
*   @version: 1.3.0
*
*   https://github.com/foo123/Dromeo
*
**/
!function(root, name, factory) {
"use strict";
var m;
if (('undefined'!==typeof Components)&&('object'===typeof Components.classes)&&('object'===typeof Components.classesByID)&&Components.utils&&('function'===typeof Components.utils['import'])) /* XPCOM */
    (root.EXPORTED_SYMBOLS = [name]) && (root[name] = factory.call(root));
else if (('object'===typeof module)&&module.exports) /* CommonJS */
    module.exports = factory.call(root);
else if (('function'===typeof(define))&&define.amd&&('function'===typeof(require))&&('function'===typeof(require.specified))&&require.specified(name)) /* AMD */
    define(name,['require','exports','module'],function() {return factory.call(root);});
else if (!(name in root)) /* Browser/WebWorker/.. */
    (root[name] = (m=factory.call(root)))&&('function'===typeof(define))&&define.amd&&define(function() {return m;} );
}(  /* current root */          'undefined' !== typeof self ? self : this,
    /* module name */           "Dromeo",
    /* module factory */        function ModuleFactory__Dromeo(undef) {
"use strict";

var __version__ = "1.3.0",

    _patternOr = /^([^|]+(\|[^|]+)+)$/,
    _nested = /\[([^\]]*?)\]$/,
    _group = /\((\d+)\)$/,
    trim_re = /^\s+|\s+$/g,
    re_escape = /([*+\[\]\(\)?^$\/\\:.])/g,

    // auxilliaries
    PROTO = 'prototype', OP = Object[PROTO], AP = Array[PROTO], FP = Function[PROTO],
    toString = OP.toString, HAS = OP.hasOwnProperty,
    isNode = ('undefined' !== typeof global) && ('[object global]' == toString.call(global)),
    trim = String[PROTO].trim
        ? function(s) {return s.trim();}
        : function(s) {return s.replace(trim_re, '');},

    // adapted from https://github.com/kvz/phpjs
    uriParser = {
        php: /^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/\/?)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // Added one optional slash to post-scheme to catch file:/// (should restrict this)
    },
    uriComponent = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port',
        'relative', 'path', 'directory', 'file', 'query', 'fragment']
;

function length(s)
{
    return s.length > 0;
}
function esc_regex(s)
{
    return s.replace(re_escape, '\\$1');
}
function is_array(o)
{
    return '[object Array]' === toString.call(o);
}
function is_obj(o)
{
    return ('[object Object]' === toString.call(o)) && ('function' === typeof o.constructor) && ('Object' === o.constructor.name);
}
function is_string(o)
{
    return ('string' === typeof o) || ('[object String]' === toString.call(o));
}
function is_number(o)
{
    return ('number' === typeof o) || ('[object Number]' === toString.call(o));
}
function is_callable(o)
{
    return "function" === typeof o;
}
function extend(o1, o2, deep)
{
    var k, v;
    deep = true === deep;
    if (o2)
    {
        for (k in o2)
        {
            if (!HAS.call(o2, k)) continue;
            v = o2[k];
            if (is_number(v)) o1[k] = 0+v;
            else if (is_string(v)) o1[k] = v.slice();
            else if (is_array(v)) o1[k] = deep ? extend(new Array(v.length), v, deep) : v;
            else if (is_obj(v)) o1[k] = deep ? extend({}, v, deep) : v;
            else o1[k] = v;
        }
    }
    return o1;
}
function parse_url(s, component, mode/*, queryKey*/)
{
    var m = uriParser[mode || 'php'].exec(s),
        uri = {}, i = 14//, parser, name
    ;
    while (i--)
    {
        if (m[i])  uri[uriComponent[i]] = m[i]
    }
    if (HAS.call(uri, 'port')) uri['port'] = parseInt(uri['port'], 10);

    if (component)
    {
        return uri[component.replace('PHP_URL_', '').toLowerCase()] || null;
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
    if (uri.source) delete uri.source;
    return uri;
}
function rawurldecode(str)
{
    return decodeURIComponent(String(str));
}
function rawurlencode(str)
{
    return encodeURIComponent(String(str))
        .split('!').join('%21')
        .split("'").join('%27')
        .split('(').join('%28')
        .split(')').join('%29')
        .split('*').join('%2A')
        //.split('~').join('%7E')
    ;
}
function urldecode(str)
{
    return rawurldecode(String(str).split('+').join('%20'));
}
function urlencode(str)
{
    return rawurlencode(str).split('%20').join('+');
}
function parse_str(str)
{
    var strArr = str.replace(/^&+|&+$/g, '').split('&'),
        sal = strArr.length,
        i, j, ct, p, lastObj, obj, chr, tmp, key, value,
        postLeftBracketPos, keys, keysLen, lastkey,
        array = {}, possibleLists = [], prevkey, prevobj
    ;

    for (i=0; i<sal; ++i)
    {
        tmp = strArr[i].split('=');
        key = rawurldecode(trim(tmp[0]));
        value = (tmp.length < 2) ? '' : rawurldecode(trim(tmp[1]));

        j = key.indexOf('\x00');
        if (j > -1) key = key.slice(0, j);

        if (key && ('[' !== key.charAt(0)))
        {
            keys = [];

            postLeftBracketPos = 0;
            for (j=0; j<key.length; ++j)
            {
                if (('[' === key.charAt(j)) && !postLeftBracketPos)
                {
                    postLeftBracketPos = j + 1;
                }
                else if (']' === key.charAt(j))
                {
                    if (postLeftBracketPos)
                    {
                        if (!keys.length)
                        {
                            keys.push(key.slice(0, postLeftBracketPos - 1));
                        }
                        keys.push(key.substr(postLeftBracketPos, j - postLeftBracketPos));
                        postLeftBracketPos = 0;
                        if ('[' !== key.charAt(j + 1)) break;
                    }
                }
            }

            if (!keys.length) keys = [key];

            for (j=0; j<keys[0].length; ++j)
            {
                chr = keys[0].charAt(j);
                if (' ' === chr || '.' === chr || '[' === chr)
                {
                    keys[0] = keys[0].substr(0, j) + '_' + keys[0].substr(j + 1);
                }
                if ('[' === chr) break;
            }

            obj = array; key = null; lastObj = obj;
            lastkey = keys.length ? trim(keys[ keys.length-1 ].replace(/^['"]|['"]$/g, '')) : null;
            for (j=0, keysLen=keys.length; j<keysLen; ++j)
            {
                prevkey = key;
                key = keys[j].replace(/^['"]|['"]$/g, '');
                prevobj = lastObj;
                lastObj = obj;

                if ('' !== trim(key) || 0 === j)
                {
                    if (!HAS.call(obj, key)) obj[key] = (j+1 === keysLen-1) && (''===lastkey) ? [] : {};
                    obj = obj[key];
                }
                else
                {
                    // To insert new dimension
                    /*ct = -1;
                    for (p in obj)
                    {
                        if (HAS.call(obj,p))
                        {
                            if (+p > ct && p.match(/^\d+$/g))
                            {
                                ct = +p;
                            }
                        }
                    }
                    key = ct + 1;*/
                    key = true;
                }
            }
            if (true === key)
            {
                lastObj.push(value);
            }
            else
            {
                if (key == +key)
                    possibleLists.push({key:prevkey, obj:prevobj});
                lastObj[key] = value;
            }
        }
    }
    for (i=possibleLists.length-1; i>=0; --i)
    {
        // safe to pass multiple times same obj, it is possible
        obj = possibleLists[i].key ? possibleLists[i].obj[possibleLists[i].key] : possibleLists[i].obj;
        if (is_numeric_array(obj))
        {
            obj = array_values(obj);
            if (possibleLists[i].key)
                possibleLists[i].obj[possibleLists[i].key] = obj;
            else
                array = obj;
        }
    }
    return array;
}
function array_keys(o)
{
    if ('function' === typeof Object.keys) return Object.keys(o);
    var v, k, l;
    if (is_array(o))
    {
        v = new Array(l=o.length);
        for (k=0; k<l; ++k)
        {
            v[k] = String(k);
        }
    }
    else
    {
        v = [];
        for (k in o)
        {
            if (HAS.call(o, k))
                v.push(k);
        }
    }
    return v;
}
function array_values(o)
{
    if (is_array(o)) return o;
    if ('function' === typeof Object.values) return Object.values(o);
    var v = [], k;
    for (k in o)
    {
        if (HAS.call(o, k))
            v.push(o[k]);
    }
    return v;
}
function is_numeric_array(o)
{
    if (is_array(o)) return true;
    if (is_obj(o))
    {
        var k = array_keys(o), i, l = k.length;
        for (i=0; i<l; ++i)
        {
            if (i !== +k[i]) return false;
        }
        return true;
    }
    return false;
}
function in_array(v, a, strict)
{
    var i, l = a.length;
    if (true === strict)
    {
        // Array.indexOf uses strict equality
        return (0 < l) && (-1 !== a.indexOf(v));
        /*for(i=0; i<l; i++)
            if ( v===a[i] )
                return true;*/
    }
    else
    {
        for (i=0; i<l; ++i)
        {
            if (v == a[i])
                return true;
        }
    }
    return false;
}
// adapted from https://github.com/kvz/phpjs
function http_build_query_helper(key, val, arg_separator, PHP_QUERY_RFC3986)
{
    var k, tmp, encode = PHP_QUERY_RFC3986 ? rawurlencode : urlencode;

    if (true === val) val = "1";
    else if (false === val) val = "0";

    if (null != val)
    {
        if ('object' === typeof val)
        {
            tmp = [];
            for (k in val)
            {
                if (HAS.call(val, k) && (null != val[k]))
                {
                    tmp.push(http_build_query_helper(key + "[" + k + "]", val[k], arg_separator, PHP_QUERY_RFC3986));
                }
            }
            return tmp.join(arg_separator);
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
}
function http_build_query(data, arg_separator, PHP_QUERY_RFC3986)
{
    var value, key, query, tmp = [];

    if (arguments.length < 2) arg_separator = "&";
    if (arguments.length < 3) PHP_QUERY_RFC3986 = false;

    for (key in data)
    {
        if (!HAS.call(data, key)) continue;
        value = data[key];
        query = http_build_query_helper(key, value, arg_separator, PHP_QUERY_RFC3986);
        if ('' != query) tmp.push(query);
    }

    return tmp.join(arg_separator);
}

function split(s, d1, d2)
{
    if ((d1 === d2) || !d2)
    {
        return s.split(d1);
    }
    else
    {
        var parts = [], part, i;
        s = s.split(d1);
        for (i=0; i<s.length; ++i)
        {
            part = s[i];
            part = part.split(d2);
            parts.push(part[0]);
            if (part.length > 1) parts.push(part[1]);
        }
        return parts;
    }
}
function offset(i)
{
    return function(m) {
        return i;
    };
}
function matched(i)
{
    return function(m) {
        return m[i] ? m[i].length : 0;
    };
}
function index(offsets)
{
    return function(m) {
        return offsets.reduce(function(i, offset) {
            return i + offset(m);
        }, 0);
    };
}
function makePattern(_delims, _patterns, pattern)
{
    var i, l, isPattern, p, m, numGroups = 0, offsets,
        types = {}, tpl, tplPattern, pat;

    pattern = split(pattern, _delims[2], _delims[3]);
    p = [];
    tpl = [];
    offsets = [];
    tplPattern = null;
    l = pattern.length;
    isPattern = false;
    for (i=0; i<l; ++i)
    {
        if (isPattern)
        {
            if (pattern[i].length)
            {
                if (HAS.call(_patterns, pattern[i]))
                {
                    p.push('(' + _patterns[pattern[i]][0] + ')');
                    ++numGroups;
                    // typecaster
                    if (_patterns[pattern[i]][1]) types[numGroups] = _patterns[pattern[i]][1];
                    if (null == tplPattern) tplPattern = p[p.length-1];
                    offsets.push([numGroups]);
                }
                else if ((m = pattern[i].match(_patternOr)))
                {
                    p.push('(' + m[1].split('|').filter(length).map(esc_regex).join('|') + ')');
                    ++numGroups;
                    if (null == tplPattern) tplPattern = p[p.length-1];
                    offsets.push([numGroups]);
                }
                else if (pattern[i].length)
                {
                    p.push('(' + esc_regex(pattern[i]) + ')');
                    ++numGroups;
                    if (null == tplPattern) tplPattern = p[p.length-1];
                    offsets.push([numGroups]);
                }
            }
            tpl.push(true);
            isPattern = false;
        }
        else
        {
            if (pattern[i].length)
            {
                p.push(esc_regex(pattern[i]));
                tpl.push(pattern[i]);
                offsets.push(pattern[i].length);
            }
            isPattern = true;
        }
    }
    if (1 === p.length && 1 === numGroups)
    {
        types[0] = types[1] ? types[1] : null;
        pat = p.join('');
        return [pat, numGroups, types, tpl, tplPattern ? tplPattern : pat, offsets];
    }
    else
    {
        types[0] = null;
        pat = '(' + p.join('') + ')';
        return [pat, numGroups+1, types, tpl, tplPattern ? tplPattern : pat, offsets];
    }
}
function makeRoute(_delims, _patterns, route, method, prefix)
{
    var parts, part, i, l, isOptional, isCaptured,
        isPattern, pattern, p, m, numGroups, patternTypecaster,
        captures, captureName, capturePattern, captureIndex,
        tpl, currOffset, offsets, offsetCapture, done
    ;
    if (0 > route.indexOf(_delims[0]))
    {
        // literal route
        return [route, prefix && prefix.length ? prefix+route : route, {}, method, true, [route]];
    }
    parts = split(route, _delims[0], _delims[1]);
    l = parts.length;
    isPattern = false;
    pattern = '';
    currOffset = 0;
    offsets = [];
    numGroups = 0;
    captures = {};
    tpl = [];
    if (prefix && prefix.length)
    {
        pattern += esc_regex(prefix);
        currOffset = prefix.length;
    }

    for (i=0; i<l; ++i)
    {
        part = parts[i];
        if (isPattern)
        {
            isOptional = false;
            isCaptured = false;
            patternTypecaster = null;
            offsetCapture = [];

            // http://abc.org/{%ALFA%:user}{/%NUM%:?id(1)}
            p = part.split(_delims[4]);
            if (!trim(p[0]).length)
            {
                // http://abc.org/{:user}/{:?id}
                // assume pattern is %PART%
                p[0] = _delims[2] + 'PART' + _delims[3];
            }
            capturePattern = makePattern(_delims, _patterns, p[0]);

            if (p.length > 1)
            {
                captureName = trim(p[1]);
                isOptional = (captureName.length && '?' === captureName.charAt(0));
                if (isOptional) captureName = captureName.slice(1);

                if ((m = captureName.match(_group)))
                {
                    captureName = captureName.slice(0, -m[0].length);
                    captureIndex = parseInt(m[1], 10);
                    patternTypecaster = HAS.call(capturePattern[2], captureIndex)
                            ? capturePattern[2][captureIndex]
                            : null;
                    if (captureIndex > 0 && captureIndex < capturePattern[1])
                    {
                        done = false;
                        offsetCapture = capturePattern[5].reduce(function(offsetCapture, o) {
                            if (is_array(o))
                            {
                                if (o[0] >= captureIndex)
                                {
                                    done = true;
                                }
                            }
                            if (!done)
                            {
                                offsetCapture.push(is_array(o) ? matched(o[0]+numGroups+1) : offset(o));
                            }
                            return offsetCapture;
                        }, []);
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

            pattern += capturePattern[0];
            if (isOptional) pattern += '?';
            if (isCaptured) captures[captureName] = [captureIndex, patternTypecaster, index(offsets.concat(offsetCapture))];
            if (isCaptured)
                tpl.push({
                    name        : captureName,
                    optional    : isOptional,
                    re          : new RegExp('^' + capturePattern[4] + '$'),
                    tpl         : capturePattern[3]
                });
            currOffset = 0;
            offsets.push(matched(numGroups + 1));
            numGroups += capturePattern[1];
            isPattern = false;
        }
        else
        {
            pattern += esc_regex(part);
            currOffset += part.length;
            tpl.push(part);
            offsets.push(offset(currOffset));
            isPattern = true;
        }
    }
    return [route, new RegExp('^' + pattern + '$'), captures, method, false, tpl];
}
function to_key(route, method)
{
    return method.join(',') + '->' + route;
}
function to_method(method)
{
    method = method ? (method.map ? method.map(function(x){return x.toLowerCase()}) : [String(method).toLowerCase()]) : ['*'];
    if (in_array('*', method)) method = ['*'];
    method.sort();
    return method;
}
function insertRoute(self, route, oneOff)
{
    if (
        route && is_string(route.route) /*&& route.route.length*/ &&
        route.handler && is_callable(route.handler)
    )
    {
        oneOff = (true === oneOff);
        var handler = route.handler,
            defaults = route.defaults || {},
            types = route.types || null,
            name = route.name || null,
            method = to_method(route.method),
            h, r, i, l, key;
        route = self.key + route.route;
        key = to_key(route, method);

        r = null;
        for (i=0,l=self._routes.length; i<l; ++i)
        {
            if (key === self._routes[i].key)
            {
                r = self._routes[i];
                break;
            }
        }
        if (!r)
        {
            r = new Route(self._delims, self._patterns, route, method, name, self._prefix);
            self._routes.push(r);
            self._addNamedRoute(r);
        }
        r.handlers.push([
            handler,
            defaults,
            types,
            oneOff,
            0
        ]);
    }
}
function clearRoute(self, key)
{
    var i, l = self._routes.length, route;
    for (i=l-1; i>=0; --i)
    {
        if (key === self._routes[i].key)
        {
            route = self._routes[i];
            self._routes.splice(i, 1);
            self._delNamedRoute(route);
            route.dispose();
        }
    }
}
function DromeoException(message)
{
    Error.call(this, message);
    this.name = 'DromeoException';
}
DromeoException[PROTO] = Object.create(Error[PROTO]);
DromeoException[PROTO].constructor = DromeoException;

function Route(delims, patterns, route, method, name, prefix)
{
    var self = this;
    self.__args__ = [delims, patterns];
    self.isParsed = false; // lazy init
    self.handlers = [];
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

    dispose: function() {
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

    parse: function() {
        var self = this;
        if (self.isParsed) return self;
        var r = makeRoute(self.__args__[0], self.__args__[1], self.route, self.method, self.prefix);
        self.pattern = r[1];
        self.captures = r[2];
        self.tpl = r[5];
        self.literal = true === r[4];
        self.__args__ = null;
        self.isParsed = true;
        return self;
    },

    match: function(route, method) {
        var self = this;
        method = method || '*';
        if (!in_array(method, self.method) && ('*' !== self.method[0])) return null;
        if (!self.isParsed) self.parse(); // lazy init
        route = String(route);
        return self.literal ? (route === self.pattern ? [] : null) : route.match(self.pattern);
    },

    make: function(params, strict) {
        var self = this, out = '', i, l, j, k, p, param, part, tpl;
        params = params || {};
        strict = true === strict;
        if (!self.isParsed) self.parse(); // lazy init
        tpl = self.tpl;
        for (i=0,l=tpl.length; i<l; ++i)
        {
            if (is_string(tpl[i]))
            {
                out += tpl[i];
            }
            else
            {
                if (!HAS.call(params, tpl[i].name) || (null == params[tpl[i].name]))
                {
                    if (tpl[i].optional)
                    {
                        continue;
                    }
                    else
                    {
                        throw new DromeoException('Dromeo: Route "'+self.name+'" (Pattern: "'+self.route+'") missing parameter "'+tpl[i].name+'"!');
                    }
                }
                else
                {
                    param = params[tpl[i].name];
                    if (!is_array(param)) param = [param];
                    param = param.map(String);
                    if (strict && !tpl[i].re.test(param[0]))
                    {
                        throw new DromeoException('Dromeo: Route "'+self.name+'" (Pattern: "'+self.route+'") parameter "'+tpl[i].name+'" value "'+param[0]+'" does not match pattern!');
                    }
                    part = tpl[i].tpl;
                    for (j=0,p=0,k=part.length; j<k; ++j)
                    {
                        if (true === part[j])
                        {
                            out += (p < param.length ? param[p] : param[0]);
                            ++p;
                        }
                        else
                        {
                            out += part[j];
                        }
                    }
                }
            }
        }
        return out;
    },

    sub: function(match, data, type, getter) {
        var self = this, v, g, index, i, n,
            groupIndex, groupTypecaster, groupMatchIndex,
            givenInput, isDifferentInput, hasGetter, captures,
            matchedValue, matchedValueTrue, typecaster;

        if (!self.isParsed || self.literal) return self;

        givenInput = match[0];
        hasGetter = is_callable(getter);
        captures = [];
        for (v in self.captures)
        {
            if (!HAS.call(self.captures, v)) continue;
            g = self.captures[v];
            captures.push([v, g]);
        }
        captures.sort(function(a, b) {
            return a[1][2](match)-b[1][2](match);
        });
        for (i=0,n=captures.length; i<n; ++i)
        {
            v = captures[i][0]; g = captures[i][1];
            groupIndex = g[0];
            groupTypecaster = g[1];
            groupMatchIndex = g[2];
            if (match[groupIndex])
            {
                matchedValue = match[groupIndex];
                if (hasGetter)
                {
                    // if getter is given,
                    // get true match from getter (eg with original case)
                    index = groupMatchIndex(match); // match index
                    matchedValueTrue = String(getter(v, matchedValue, index, index+matchedValue.length, givenInput));
                }
                else
                {
                    // else what matched
                    matchedValueTrue = matchedValue;
                }

                if (type && HAS.call(type, v) && type[v])
                {
                    typecaster = type[v];
                    if (is_string(typecaster) && HAS.call(Dromeo.TYPES, typecaster))
                        typecaster = Dromeo.TYPES[typecaster];
                    data[v] = is_callable(typecaster) ? typecaster(matchedValueTrue) : matchedValueTrue;
                }
                else if (groupTypecaster)
                {
                    typecaster = groupTypecaster;
                    data[v] = is_callable(typecaster) ? typecaster(matchedValueTrue) : matchedValueTrue;
                }
                else
                {
                    data[v] = matchedValueTrue;
                }
            }
            else if (!HAS.call(data, v))
            {
                data[v] = null;
            }
        }
        return self;
    }
};

function Dromeo(prefix, group, top)
{
    var self = this;
    // constructor factory method
    if (!(self instanceof Dromeo)) return new Dromeo(prefix, group, top);
    self._delims = ['{', '}', '%', '%', ':'];
    self._patterns = {},
    self.definePattern('ALPHA',      '[a-zA-Z\\-_]+');
    self.definePattern('ALNUM',      '[a-zA-Z0-9\\-_]+');
    self.definePattern('ASCII',      '[ -~]+');
    self.definePattern('NUMBR',      '[0-9]+');
    self.definePattern('INT',        '[0-9]+',          'INT');
    self.definePattern('PART',       '[^\\/?#]+');
    self.definePattern('VAR',        '[^=?&#\\/]+',     'VAR');
    self.definePattern('QUERY',      '\\?[^?#]+');
    self.definePattern('FRAGMENT',   '#[^?#]+');
    self.definePattern('URLENCODED', '[^\\/?#]+',       'URLENCODED');
    self.definePattern('ALL',        '.+');
    self.definePattern('ANY',        '[\\s\\S]+');
    self._routes = [];
    self._named_routes = {};
    self._fallback = false;
    self._top = top instanceof Dromeo ? top : self;
    self.key = self === self._top ? '' : (self._top.key + String(group));
    self._prefix = null == prefix ? '' : String(prefix);
};


// default typecasters
function type_to_int(v)
{
    return parseInt(v, 10) || 0;
}
function type_to_str(v)
{
    return is_string(v) ? v : '' + String(v);
}
function type_to_urldecode(v)
{
    return urldecode(v);
}
function type_to_array(v)
{
    return is_array(v) ? v : [v];
}
function type_to_params(v)
{
    return is_string(v) ? Dromeo.unglue_params(v) : v;
}

Dromeo.VERSION = __version__;
Dromeo.Exception = DromeoException;
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
Dromeo.glue_params = function(params) {
    var component = '';
    // http://php.net/manual/en/function.http-build-query.php
    if (params)  component += http_build_query(params, '&', true);
    return component;
};
// unglue/extract params object from uri component
Dromeo.unglue_params = function(s) {
    var PARAMS = s ? parse_str(s) : {};
    return PARAMS;
};
// parse and extract uri components and optional query/fragment params
Dromeo.parse_components = function(s, query_p, fragment_p) {
    var self = this, COMPONENTS = {};
    if (s)
    {
        if (arguments.length < 3 || null == fragment_p) fragment_p = 'fragment_params';
        if (arguments.length < 2 || null == query_p) query_p = 'query_params';

        COMPONENTS = parse_url(s);

        if (query_p)
        {
            if (COMPONENTS['query'])
                COMPONENTS[query_p] = self.unglue_params(COMPONENTS['query']);
            else
                COMPONENTS[query_p] = {};
        }
        if (fragment_p)
        {
            if (COMPONENTS['fragment'])
                COMPONENTS[fragment_p] = self.unglue_params(COMPONENTS['fragment']);
            else
                COMPONENTS[fragment_p] = {};
        }
    }
    return COMPONENTS;
};
// build a url from baseUrl plus query/hash params
Dromeo.build_components = function(baseUrl, query, hash, q, h) {
    var self = this,
        url = '' + baseUrl;
    if (arguments.length < 5 || null == h) h = '#';
    if (arguments.length < 4 || null == q) q = '?';
    if (query)  url += q + self.glue_params(query);
    if (hash)  url += h + self.glue_params(hash);
    return url;
};
Dromeo.defType = function(type, caster) {
    if (type && is_callable(caster)) Dromeo.TYPES[type] = caster;
};
Dromeo.TYPE = function(type) {
    if (type && HAS.call(Dromeo.TYPES, type)) return Dromeo.TYPES[type];
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
    _top: null,
    key: '',

    dispose: function() {
        var self = this, i, l;
        self._top = null;
        self._delims = null;
        self._patterns = null;
        self._fallback = null;
        self._prefix = null;
        if (self._routes)
        {
            for (i=0,l=self._routes.length; i<l; ++i)
            {
                self._routes[i].dispose();
            }
        }
        self._routes = null;
        self._named_routes = null;
        return self;
    },

    top: function() {
        return this._top;
    },

    isTop: function() {
        return (null == this._top) || (this === this._top);
    },

    clone: function(group) {
        var self = this, cloned = new Dromeo(self._prefix, group, self), className, args;
        cloned.defineDelimiters(self._delims);
        for (className in self._patterns)
        {
            if (!HAS.call(self._patterns, className)) continue;
            args = self._patterns[className];
            cloned.definePattern(className, args[0], 1 < args.length ? args[1] : null);
        }
        return cloned;
    },

    reset: function() {
        var self = this;
        self._routes = [];
        self._named_routes = {};
        self._fallback = false;
        return self;
    },

    /*debug: function() {
        console.log('Routes: ');
        console.log(this._routes);
        console.log('Fallback: ');
        console.log(this._fallback);
    },*/

    defineDelimiters: function(delims) {
        var self = this, _delims = self._delims, l;
        if (delims)
        {
            l = delims.length;
            if (l > 0 && delims[0]) _delims[0] = delims[0];
            if (l > 1 && delims[1]) _delims[1] = delims[1];
            if (l > 2 && delims[2]) _delims[2] = delims[2];
            if (l > 3 && delims[3]) _delims[3] = delims[3];
            if (l > 4 && delims[4]) _delims[4] = delims[4];
        }
        return self;
    },

    definePattern: function(className, subPattern, typecaster)  {
        var self = this;
        if (
            typecaster &&
            is_string(typecaster) && typecaster.length &&
            HAS.call(Dromeo.TYPES, typecaster)
        ) typecaster = Dromeo.TYPES[typecaster];

        if (!typecaster || !is_callable(typecaster)) typecaster = null;
        self._patterns[className] = [subPattern, typecaster];
        return self;
    },

    dropPattern: function(className) {
        var self = this, patterns = self._patterns;
        if (HAS.call(patterns, className))
            delete patterns[className];
        return self;
    },

    defineType: function(type, caster)  {
        Dromeo.defType(type, caster);
        return this;
    },

    // build/glue together a uri component from a params object
    glue: function(params) {
        return Dromeo.glue_params(params);
    },

    // unglue/extract params object from uri component
    unglue: function(s) {
        return Dromeo.unglue_params(s);
    },

    // parse and extract uri components and optional query/fragment params
    parse: function(s, query_p, fragment_p) {
        return Dromeo.parse_components(s, query_p, fragment_p);
    },

    // build a url from baseUrl plus query/hash params
    build: function(baseUrl, query, hash, q, h) {
        return Dromeo.build_components(baseUrl, query, hash, q, h);
    },

    onGroup: function(groupRoute, handler) {
        var self = this, groupRouter;
        groupRoute = String(groupRoute);
        if (groupRoute.length && is_callable(handler))
        {
            groupRouter = self.clone(groupRoute);
            self._routes.push(groupRouter);
            handler(groupRouter);
        }
        return self;
    },

    on: function(/* var args here .. */) {
        var self = this, args = arguments,
            args_len = args.length, routes, i, n
        ;

        if (1 === args_len)
        {
            routes = is_array(args[0]) ? args[0] : [args[0]];
        }
        else if (2 === args_len && is_string(args[0]) && is_callable(args[1]))
        {
            routes = [{
                route: args[0],
                handler: args[1],
                method: '*',
                defaults: {},
                types: null
            }];
        }
        else
        {
            routes = args;
        }
        for (i=0,n=routes.length; i<n; ++i)
        {
            insertRoute(self, routes[i], false);
        }
        return self;
    },

    one: function(/* var args here .. */) {
        var self = this, args = arguments,
            args_len = args.length, routes, i, n
        ;

        if (1 === args_len)
        {
            routes = is_array(args[0]) ? args[0] : [args[0]];
        }
        else if (2 === args_len && is_string(args[0]) && is_callable(args[1]))
        {
            routes = [{
                route: args[0],
                handler: args[1],
                method: '*',
                defaults: {},
                types: null
            }];
        }
        else
        {
            routes = args;
        }
        for (i=0,n=routes.length; i<n; ++i)
        {
            insertRoute(self, routes[i], true);
        }
        return self;
    },

    off: function(route, handler, method) {
        var self = this,
            routes = self._routes,
            i, r, l, key;

        if (!route) return self;
        if (null == method) method = '*';

        if (is_obj(route))
        {
            handler = route.handler || handler;
            method = route.method || method;
            route = route.route;
            if (!route) return self;
            route = String(route);
            key = to_key(route, to_method(method));
            r = null;
            for (i=0,l=routes.length; i<l; ++i)
            {
                if (routes[i] instanceof Dromeo)
                {
                    routes[i].off(route, handler, method);
                }
                else
                {
                    if (key === routes[i].key)
                    {
                        r = routes[i];
                        break;
                    }
                }
            }

            if (!r) return self;

            if (handler && is_callable(handler))
            {
                l = r.handlers.length;
                for (i=l-1; i>=0; --i)
                {
                    if (handler === r.handlers[i][0])
                        r.handlers.splice(i, 1);
                }
                if (!r.handlers.length)
                    clearRoute(self, key);
            }
            else
            {
                clearRoute(self, key);
            }
        }
        else if (is_string(route) && route.length)
        {
            route = String(route);
            key = to_key(route, to_method(method));
            r = null;
            for (i=0,l=routes.length; i<l; ++i)
            {
                if (routes[i] instanceof Dromeo)
                {
                    if (route === routes[i].key)
                    {
                        r = routes[i];
                        break;
                    }
                    else
                    {
                        routes[i].off(route, handler, method);
                    }
                }
                else
                {
                    if (key === routes[i].key)
                    {
                        r = routes[i];
                        break;
                    }
                }
            }

            if (!r) return self;

            if (r instanceof Dromeo)
            {
                routes.splice(i, 1);
                r.dispose();
            }
            else
            {
                if (handler && is_callable(handler))
                {
                    l = r.handlers.length;
                    for (i=l-1; i>=0; --i)
                    {
                        if (handler === r.handlers[i][0])
                            r.handlers.splice(i, 1);
                    }
                    if (!r.handlers.length)
                        clearRoute(self, key);
                }
                else
                {
                    clearRoute(self, key);
                }
            }
        }
        return self;
    },

    fallback: function(handler) {
        var self = this;
        if (1 > arguments.length) handler = false;
        if (false === handler || null === handler || is_callable(handler))
            self._fallback = handler;
        return self;
    },

    make: function(named_route, params, strict) {
        var routes = this._named_routes;
        return HAS.call(routes, named_route) ? routes[named_route].make(params, strict) : null;
    },

    route: function(r, method, breakOnFirstMatch, getter) {
        var self = this, proceed, prefix, routes,
            route, params, defaults, type, to_remove,
            i, l, lh, h, match, handlers, handler, found;
        ;
        if (!self.isTop() && !self._routes.length) return false;
        proceed = true;
        found = false;
        r = null != r ? String(r) : '';
        prefix = self._prefix + self.key;
        if (prefix.length)
        {
            proceed = (prefix === r.slice(0, prefix.length));
        }
        if (proceed)
        {
            breakOnFirstMatch = false !== breakOnFirstMatch;
            method = null != method ? String(method).toLowerCase() : '*';
            routes = self._routes.slice(); // copy, avoid mutation
            l = routes.length;
            for (i=0; i<l; ++i)
            {
                route = routes[i];
                if (route instanceof Dromeo)
                {
                    // group router
                    match = route.route(r, method, breakOnFirstMatch, getter);
                    if (!match) continue;
                    found = true;
                }
                else
                {
                    // simple route
                    match = route.match(r, method);
                    if (null == match) continue;
                    found = true;

                    // copy handlers, avoid mutation during calls
                    handlers = route.handlers.slice();

                    // make calls
                    to_remove = [];
                    lh = handlers.length;
                    for (h=0; h<lh; ++h)
                    {
                        handler = handlers[h];
                        // handler is oneOff and already called
                        if (handler[3] && handler[4])
                        {
                            to_remove.unshift(h);
                            continue;
                        }

                        defaults = handler[1];
                        type = handler[2];
                        params = {
                            route: r,
                            method: method,
                            pattern: route.route,
                            fallback: false,
                            data: extend({}, defaults, true)
                        };
                        route.sub(match, params.data, type, getter);

                        handler[4] = 1; // handler called
                        if (handler[3]) to_remove.unshift(h);
                        handler[0](params);
                    }

                    // remove called oneOffs
                    for (h=0,lh=to_remove.length; h<lh; ++h)
                    {
                        route.handlers.splice(to_remove[h], 1);
                    }
                    if (!route.handlers.length)
                    {
                        clearRoute(self, route.key);
                    }
                }
                if (breakOnFirstMatch) return true;
            }
            if (found) return true;
        }

        if (self._fallback && self.isTop())
        {
            self._fallback({
                route: r,
                method: method,
                pattern: null,
                fallback: true,
                data: null
            });
        }
        return false;
    },

    _addNamedRoute: function(route) {
        var self = this;
        if (self.isTop())
        {
            if ((route instanceof Dromeo.Route) && route.name && route.name.length)
            {
                self._named_routes[route.name] = route;
            }
        }
        else
        {
            self.top()._addNamedRoute(route);
        }
        return self;
    },

    _delNamedRoute: function(route) {
        var self = this;
        if (self.isTop())
        {
            if ((route instanceof Dromeo.Route) && route.name && HAS.call(self._named_routes, route.name))
            {
                delete self._named_routes[route.name];
            }
        }
        else
        {
            self.top()._delNamedRoute(route);
        }
        return self;
    }
};

// export it
return Dromeo;
});