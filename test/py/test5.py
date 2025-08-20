#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, sys
import pprint

# UTF8 BOM
UTF8_BOM = b"\xEF\xBB\xBF"
sys.stdout.reconfigure(encoding='utf-8')
sys.stdout.buffer.write(UTF8_BOM)
sys.stdout.flush()

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


router = Dromeo()

router.on([
    {
        'route':'/γεια/{:user}/{:id}',
        'name': 'route1',
        'handler': defaultHandler
    }
])

print('Dromeo.VERSION = ', Dromeo.VERSION)
print("\n")

router.route('/γεια/σου/1', '*', True)
router.route('/γεια/toyou/2', '*', True)

