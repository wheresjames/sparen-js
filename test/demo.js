#!/usr/bin/env nodejs
'use strict';

const sparen = require('sparen');

const Log = sparen.log;

sparen.log('This is a message');

sparen.obj.addLogFilters('info:blue,warning:yellow,error:red');
Log('This is information');
Log('This is a warning');
Log('This is an error');

let lst = ['this', 'is', 'a', 'list'];
let arr = {'a': 'b', 'c': 'd', 'e': {'f': ['g', 'h', 'i'], 'j': 'k'}};

Log('This is a list: ', lst);
Log('This is an array: ', arr);

try
{
    thisis = anerror;
}
catch(e)
{
    Log('CAPTURED ERROR', e);
}


