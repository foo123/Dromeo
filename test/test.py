#!/usr/bin/env python

import os, sys
import pprint

# import the Dromeo.py engine (as a) module, probably you will want to place this in another dir/package
import imp
DromeoModulePath = os.path.join(os.path.dirname(__file__), '../src/python/')
try:
    DromeoFp, DromeoPath, DromeoDesc  = imp.find_module('Dromeo', [DromeoModulePath])
    Dromeo = getattr( imp.load_module('Dromeo', DromeoFp, DromeoPath, DromeoDesc), 'Dromeo' )
except ImportError as exc:
    Dromeo = None
    sys.stderr.write("Error: failed to import module ({})".format(exc))
finally:
    if DromeoFp: DromeoFp.close()

if not Dromeo:
    print ('Could not load the Dromeo Module')
    sys.exit(1)
else:    
    print ('Dromeo Module loaded succesfully')


def routeHandler( route, params ):
    print('Route Handler Called')
    print('Route: ', route)
    print('Params: ', pprint.pformat(params, 4))

def fallbackHandler( route, params ):
    print('Fallabck Handler Called')
    print('Route: ', route)
    print('Params: ', pprint.pformat(params, 4))

print( 'Dromeo.VERSION = ', Dromeo.VERSION )
print( "\n" );

dromeo = Dromeo( )

#dromeo.debug( )
#dromeo.on([
#      ['http://abc.org/{%ALPHA%:group}{/%LANUM%:?user(1)}', routeHandler],
#      ['http://def.org/{%ALPHA%:group}{/%ALNUM%:?user(1)}', routeHandler]
#    ])
#dromeo.debug( )
#dromeo.off( 'http://abc.org/{%ALPHA%:group}{/%ALNUM%:?user(1)}' )
#dromeo.debug( )
#dromeo.reset( )
#dromeo.debug( )

dromeo.on([
      
      ['http://abc.org/{%ALPHA%:group}/{%ALNUM%:user}/{%NUMBR%:id}{/%moo|soo|too%:?foo(1)}{%ALL%:?rest}', routeHandler, {'foo':'moo'}]
    
    ]).fallback( 
        fallbackHandler 
    )

dromeo.route( 'http://abc.org/users/abcd12/23/soo' )
dromeo.route( 'http://abc.org/users/abcd12/23/' )
dromeo.route( 'http://abc.org/users/abcd12/23' )


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