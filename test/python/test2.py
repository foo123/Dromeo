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


def defaultHandler(*args):
    pass


router = Dromeo('https://example.com')

router.on([
    {
        'route':'/{:user}/{:id}',
        'name': 'route1',
        'handler': defaultHandler
    },
    {
        'route':'/{:user}{/%INT%:?id(1)}',
        'name': 'route2',
        'handler': defaultHandler
    },
    {
        'route':'/{:user}{/%INT%:?id(1)}{/%ALPHA%:?action(1)}',
        'name': 'route4',
        'handler': defaultHandler
    },
    {
        'route':'/bar/456',
        'name': 'route3',
        'handler': defaultHandler
    }
])

def make(route, params=dict(), strict=False):
    try:
        out = router.make(route, params, strict)
    except RuntimeError as err:
        out = str(err)
    return out

print('Dromeo.VERSION = ', Dromeo.VERSION)
print("\n")

print(make('route1', {'user':'foo','id':'123'}))
print(make('route1', {'user':'foo','id':'123'}, True))
print(make('route1', {'user':'foo'}))
print(make('route2', {'user':'foo'}))
print(make('route2', {'user':'foo','id':'123'}))
print(make('route2', {'user':'foo','id':'123'}, True))
print(make('route3', {'user':'foo','id':'123'}))
print(make('route4', {'user':'foo'}))
print(make('route4', {'user':'foo','id':'123','action':'test'}))
print(make('route4', {'user':'foo','action':'test'}, True))

