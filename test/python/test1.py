#!/usr/bin/env python

import os, sys
import pprint

def import_module(name, path):
    import imp
    try:
        mod_fp, mod_path, mod_desc  = imp.find_module(name, [path])
        mod = getattr( imp.load_module(name, mod_fp, mod_path, mod_desc), name )
    except ImportError as exc:
        mod = None
        sys.stderr.write("Error: failed to import module ({})".format(exc))
    finally:
        if mod_fp: mod_fp.close()
    return mod

# import the Dromeo.py engine (as a) module, probably you will want to place this in another dir/package
Dromeo = import_module('Dromeo', os.path.join(os.path.dirname(__file__), '../../src/python/'))
if not Dromeo:
    print ('Could not load the Dromeo Module')
    sys.exit(1)
else:
    print ('Dromeo Module loaded succesfully')


def literalRouteHandler(params):
    print('Literal Route Handler Called')
    print('Route: ', params['route'])
    print('Params: ', pprint.pformat(params['data'], 4))

def literalPostHandler(params):
    print('Literal Post Handler Called')
    print('Route: ', params['route'])
    print('Params: ', pprint.pformat(params['data'], 4))

def routeHandler(params):
    print('Route Handler Called')
    print('Route: ', params['route'])
    print('Params: ', pprint.pformat(params['data'], 4))

def fallbackHandler(params):
    print('Fallback Handler Called')
    print('Route: ', params['route'])
    print('Params: ', pprint.pformat(params['data'], 4))

print('Dromeo.VERSION = ', Dromeo.VERSION)
print("\n")

dromeo = Dromeo()

#dromeo.debug( )
#dromeo.on([
#      # same as using 'method': '*'
#      {'route':'http://abc.org/{%ALPHA%:group}{/%LANUM%:?user(1)}', 'handler':routeHandler},
#      {'route':'http://def.org/{%ALPHA%:group}{/%ALNUM%:?user(1)}', 'handler':routeHandler}
#    ])
#dromeo.debug( )
#dromeo.off( 'http://abc.org/{%ALPHA%:group}{/%ALNUM%:?user(1)}' )
#dromeo.debug( )
#dromeo.reset( )
#dromeo.debug( )

dromeo.fallback(
        fallbackHandler
    ).on(
      {
      'route':'http://literal.abc.org/',
      'method': 'get',
      'handler':literalRouteHandler,
      'defaults':{'foo':'moo','extra':'extra', 'literal_route':'1'}
      #'types':{'id': 'INTEGER'}
      }
    ).on(
      {
      'route':'http://literal.abc.org/',
      'method': 'post',
      'handler':literalPostHandler,
      'defaults':{'foo':'moo','extra':'extra', 'literal_route':'1'}
      #'types':{'id': 'INTEGER'}
      }
    ).on(
      {
      'route':'http://abc.org/{%ALPHA%:group}/{%ALNUM%:user}/{%INT%:id}{/%moo|soo|too%:?foo(1)}{%?|&%preview=%VAR%:?preview(2)}{%ALL%:?rest}',
      # same as using
      'method': ['get','post'],
      'handler':routeHandler,
      'defaults':{'foo':'moo','extra':'extra','multiple_methods':'1'}
      #'types':{'id': 'INTEGER'}
      }
    ).one(
      {
      'route':'http://abc.org/{:group}/{:user}/{:id}{/%moo|soo|too%:?foo(1)}{%ALL%:?rest}',
      # same as using
      #'method': '*',
      'handler':routeHandler,
      'defaults':{'foo':'moo','once':'once','default_part':'1'},
      'types':{'id': 'INTEGER'}
      }
    ).on(
      {
      'route':'http://abc.org/{%ALPHA%:group}/{%abcd12%:user}/{%NUMBR%:id}{/%moo|soo|too%:?foo(1)}{%ALL%:?rest}',
      # same as using
      #'method': '*',
      'handler':routeHandler,
      'defaults':{'foo':'moo','const_pattern':'const_pattern'},
      'types':{'id': Dromeo.TYPE('INTEGER')}
      }
    )

dromeo.route('http://abc.org/users/abcd12/23/soo?preview=prev+iew&foo=bar', '*', False)
#dromeo.route('http://abc.org/users/abcd12/23/?preview=preview&foo=bar', 'get', False)
#dromeo.route('http://abc.org/users/abcd12/23', '*', False)
dromeo.route('http://literal.abc.org/', 'post', False)
dromeo.route('http://literal.abc.org/', 'get', False)


uri = 'http://abc.org/path/to/page/?abcd%5B0%5D=1&abcd%5B1%5D=2&foo=a%20string%20with%20spaces%20and%20%2B&moo%5Btoo%5D=2&moo%5Bsoo%5D=1#foo%5Bsoo%5D=1&def%5B0%5D=1&def%5B1%5D=2'
print("\n");
print('Parse URI: ', uri)
print(pprint.pformat(dromeo.parse(uri), 4))

uri = 'http://abc.org/path/to/page/'
print("\n")
print('Build URI')
print(dromeo.build(uri, {
    'abcd': [1, 2],
    'foo': 'a string with spaces and +',
    'moo': {'soo':1, 'too':2}
}, {
    'def': [1, 2],
    'foo': {'soo':1}
}))

query = 'key1=val1&key2[key3]=val2&key2[key4]=val3&key5[key6][]=val4&key5[key6][]=val5&key7[0]=val6&key7[1]=val7'
print("\n")
print('Parse QUERY: ' + query)
print(Dromeo.unglue_params(query))
