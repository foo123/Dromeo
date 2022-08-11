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


def defaultHandler(route, *args):
    print('Default Handler')
    print(pprint.pformat(route, 4))


router1 = Dromeo()
router2 = Dromeo()

router1.on([
    {
        'route':'/foo/{:user}/{:id}',
        'name': 'route1',
        'handler': defaultHandler
    }
])
router2.on([
    {
        'route':'/foo{/%ALPHA%:user(1)}',
        'name': 'route2',
        'handler': defaultHandler
    }
])

print('Dromeo.VERSION = ', Dromeo.VERSION)
print("\n")

router1.route('/FOO/USER/ID'.lower(), '*', True, '/FOO/USER/ID', 'ORIG')
router1.route('/FOO/Foo/ID'.lower(), '*', True, '/FOO/Foo/ID', 'ORIG')
router2.route('/FOO/USER'.lower(), '*', True, '/FOO/USER', 'ORIG')
router2.route('/FOO/Foo'.lower(), '*', True, '/FOO/Foo', 'ORIG')

