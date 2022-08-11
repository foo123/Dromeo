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
    print(pprint.pformat(route, 4))


router = Dromeo()

router.on([
    {
        'route':'/foo/{:user}/{:id}',
        'name': 'route1',
        'handler': defaultHandler
    }
])

print('Dromeo.VERSION = ', Dromeo.VERSION)
print("\n")

router.route('/FOO/USER/ID'.lower(), '*', True, '/FOO/USER/ID', 'ORIG')

