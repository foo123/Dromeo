#!/usr/bin/env python

import os, sys
import pprint

def import_module(name, path):
    #import imp
    #try:
    #    mod_fp, mod_path, mod_desc  = imp.find_module(name, [path])
    #    mod = getattr( imp.load_module(name, mod_fp, mod_path, mod_desc), name )
    #except ImportError as exc:
    #    mod = None
    #    sys.stderr.write("Error: failed to import module ({})".format(exc))
    #finally:
    #    if mod_fp: mod_fp.close()
    #return mod
    import importlib.util, sys
    spec = importlib.util.spec_from_file_location(name, path+name+'.py')
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return getattr(mod, name)

# import the Dromeo.py engine (as a) module, probably you will want to place this in another dir/package
Dromeo = import_module('Dromeo', os.path.join(os.path.dirname(__file__), '../../src/py/'))
if not Dromeo:
    print ('Could not load the Dromeo Module')
    sys.exit(1)
else:
    print ('Dromeo Module loaded succesfully')


def defaultHandler(route, *args):
    print('Default Handler')
    print(pprint.pformat(route, 4))

def get_from_(source):
    def getter(key, val, start, end, inp):
        return source[start:end]
    return getter


router1 = Dromeo()
router2 = Dromeo()

router1.on([
    {
        'route':'/foo/{:user}/{:id}',
        'name': 'route1',
        'handler': defaultHandler
    }
])
router1.onGroup('/bar', lambda router: (
    router.onGroup('/baz', lambda router: (
        router.on({
            'route': '/{:user}/{:id}',
            'name': 'route4',
            'handler': defaultHandler
        })
    )).on({
        'route': '/{:user}/{:id}',
        'name': 'route3',
        'handler': defaultHandler
    })
))
router2.on([
    {
        'route':'/foo{/%ALPHA%-%ALPHA%:user(2)}',
        'name': 'route2',
        'handler': defaultHandler
    }
])

print('Dromeo.VERSION = ', Dromeo.VERSION)
print("\n")

router1.route('/FOO/USER/ID'.lower(), '*', True, get_from_('/FOO/USER/ID'))
router1.route('/FOO/Foo/ID'.lower(), '*', True, get_from_('/FOO/Foo/ID'))
router1.route('/Bar/Foo/ID'.lower(), '*', True, get_from_('/Bar/Foo/ID'))
router1.route('/Bar/bAz/Foo/ID'.lower(), '*', True, get_from_('/Bar/bAz/Foo/ID'))
router2.route('/FOO/USER-User'.lower(), '*', True, get_from_('/FOO/USER-User'))
router2.route('/FOO/Foo-fOO'.lower(), '*', True, get_from_('/FOO/Foo-fOO'))

