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
Dromeo = import_module('Dromeo', os.path.join(os.path.dirname(__file__), '../src/python/'))
if not Dromeo:
    print ('Could not load the Dromeo Module')
    sys.exit(1)
else:    
    print ('Dromeo Module loaded succesfully')


def routeHandler( params ):
    print('Route Handler Called')
    print('Route: ', params['route'])
    print('Params: ', pprint.pformat(params['data'], 4))

def fallbackHandler( route, params ):
    print('Fallabck Handler Called')
    print('Route: ', params['route'])
    print('Params: ', pprint.pformat(params['data'], 4))

print( 'Dromeo.VERSION = ', Dromeo.VERSION )
print( "\n" );

dromeo = Dromeo( )

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
      'route':'http://abc.org/{%ALPHA%:group}/{%ALNUM%:user}/{%NUMBR%:id}{/%moo|soo|too%:?foo(1)}{%ALL%:?rest}', 
      # same as using
      #'method': '*',
      'handler':routeHandler, 
      'defaults':{'foo':'moo','extra':'extra'},
      'types':{'id': 'INTEGER'}
      }
    ).one(
      {
      'route':'http://abc.org/{%ALPHA%:group}/{%ALNUM%:user}/{%NUMBR%:id}{/%moo|soo|too%:?foo(1)}{%ALL%:?rest}', 
      # same as using
      #'method': '*',
      'handler':routeHandler, 
      'defaults':{'foo':'moo','once':'once'},
      'types':{'id': Dromeo.TYPE('INTEGER')}
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

dromeo.route( 'http://abc.org/users/abcd12/23/soo', '*', False )
dromeo.route( 'http://abc.org/users/abcd12/23/', '*', False )
dromeo.route( 'http://abc.org/users/abcd12/23', '*', False )


uri = 'http::/abc.org/path/to/page/?abcd%5B0%5D=1&abcd%5B1%5D=2&foo=a%20string%20with%20spaces%20and%20%2B&moo%5Btoo%5D=2&moo%5Bsoo%5D=1#foo%5Bsoo%5D=1&def%5B0%5D=1&def%5B1%5D=2'
print( "\n" );
print( 'Parse URI: ', uri )
print( pprint.pformat(dromeo.parse( uri ), 4) )

uri = 'http::/abc.org/path/to/page/'
print( "\n" );
print( 'Build URI' )
print( dromeo.build(uri, {
    'abcd': [1, 2],
    'foo': 'a string with spaces and +',
    'moo': {'soo':1, 'too':2}
}, {
    'def': [1, 2],
    'foo': {'soo':1}
}) )