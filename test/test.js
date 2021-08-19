#!/usr/bin/env nodejs
'use strict';

const sparen = require('sparen');

const Log = sparen.log;

function test_1()
{
    Log('This is a message');

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

}

function isCmd(lst, cmd)
{
    return `,${cmd.toLowerCase()},` in lst.toLowerCase();
}

function main()
{
    Log("--- START TESTS ---\n");

    test_1()

    Log('--- Done ---\n');
}

// Exit handling
process.on('exit',function() { Log('~ exit ~');});
process.on('SIGINT',function() { Log('~ keyboard ~'); process.exit(-1); });
process.on('uncaughtException',function(e) { Log('~ uncaught ~', e); process.exit(-1); });

// Run the program
main();

