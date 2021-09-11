#!/usr/bin/env nodejs
'use strict';

const assert = require('assert');
const sparen = require('sparen');

const Log = sparen.log;
const Err = sparen.log;
const Fmt = JSON.stringify;

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
        Err('CAPTURED EXCEPTION', e);
    }

    let sz = 200;
    let data = [];
    for (let i = 0; i < sz; i++)
        data.push(Math.sin(i * Math.PI * 6 / sz) * 10);

    function initArray(sz, f)
    {   let a = [];
        for (let i = 0; i < sz; i++)
            a.push(f(i));
        return a;
    }
}

function test_2()
{
    let plot = sparen.initArray(200, (i)=>Math.sin(i * Math.PI * 6 / 200) * 10);
    Log('PLOT\n' + sparen.plotArray(plot));
}

function test_3()
{
    let canv = new sparen.Canvas(80, 25, 2);

    canv.line(2, 2, 40, 2);
    canv.line(77, 2, 77, 12);

    canv.rect(4, 4, 20, 10);
    canv.line(5, 5, 19, 9);

    canv.fillRect(25, 6, 45, 14);

    canv.circle(60, 6, 5);
    canv.arc(60, 6, 5, 0, 180, '*');

    canv.text(60, 6, "2");

    canv.rect(10, 15, 50, 23);
    canv.textBox(11, 15, 49, 23, 'This\tis a lot of text just to see how well it fits into the'
                                +' specified box, I could go on and on, and I will, because the'
                                +' point here is to make a really long string and not to not'
                                +' freak out people that do not like to see a lot of text.');

    canv.rect(55, 15, 79, 23);
    canv.textBox(55, 15, 79, 23, 'ThisWordIsJustTooLongToFitOnOneLineAndMustBeForcefullySplit.\n'
                                +' So \n be \n it.');

    Log("First Example\n" + canv.toString());
}

function test_4()
{
    let canv = new sparen.Canvas(80, 25, 1);

    canv.rect(4, 4, 20, 10);

    canv.line(2, 6, 25, 6);
    canv.line(4, 8, 20, 8);

    canv.line(10, 2, 10, 12);
    canv.line(16, 4, 16, 10);

    canv.rect(44, 4, 60, 10);
    canv.line(42, 4, 65, 4);
    canv.line(42, 10, 68, 10);

    canv.rect(24, 14, 40, 20);
    canv.line(24, 12, 24, 22);
    canv.line(40, 12, 40, 24);

    canv.rect(45, 14, 65, 20);
    canv.rect(50, 16, 70, 22);
    canv.rect(55, 18, 75, 24);

    canv.rect(2, 14, 10, 18);
    canv.rect(10, 14, 18, 18);
    canv.rect(2, 18, 10, 22);
    canv.rect(10, 18, 18, 22);

    Log("Second Example\n" + canv.toString());
}

function test_5()
{
    let mins  = 60;
    let hrs   = 60 * 60;
    let days  = 24 * 60 * 60;
    let years = 365 * 24 * 60 * 60;

    let ts, t = [
            4 * hrs + 12 * mins + 23,                           // 04:12:23
            4 * hrs + 12 * mins + 23 + 0.340,                   // 04:12:23.340
            123 * days + 4 * hrs + 2 * mins + 6,                // 123 days 04:02:06
            4 * years + 123 * days + 4 * hrs + 2 * mins + 6,    // 4 years, 123 days, 04:02:06
        ];

    ts = sparen.formatInterval(t[0]);
    Log(ts);
    assert(ts == "04:12:23");

    ts = sparen.formatInterval(t[1], "$+H:$M:$S.$F", 3);
    Log(ts);
    assert(ts == "04:12:23.340");

    ts = sparen.formatInterval(t[1], "$+H:$M:$S.$f", 3);
    Log(ts);
    assert(ts == "04:12:23.34");

    ts = sparen.formatInterval(t[2], "$+H:$M:$S");
    Log(ts);
    assert(ts == "2956:02:06");

    ts = sparen.formatInterval(t[2], "$d days, $H:$M:$S");
    Log(ts);
    assert(ts == "123 days, 04:02:06");

    ts = sparen.formatInterval(t[2], "$d days, $h hours, $m minutes, $s seconds");
    Log(ts);
    assert(ts == "123 days, 4 hours, 2 minutes, 6 seconds");

    ts = sparen.formatInterval(t[3], "$y years, $d days, $h hours, $m minutes, $s seconds");
    Log(ts);
    assert(ts == "4 years, 123 days, 4 hours, 2 minutes, 6 seconds");

    ts = sparen.formatInterval(25.001, "$s.$f");
    Log(ts);
    assert(ts == "25.001");

    ts = sparen.formatInterval(25.0015, "$s.$f");
    Log(ts);
    assert(ts == "25.002");

    ts = sparen.formatInterval(25.0012345, "$s.$f", 4);
    Log(ts);
    assert(ts == "25.0012");

    ts = sparen.formatInterval(25.0012, "$s.$F", 6);
    Log(ts);
    assert(ts == "25.001200");
}

function isCmd(lst, cmd)
{
    return !lst || !lst.length ||  0 <= `,${lst.toLowerCase()},`.indexOf(`,${cmd.toLowerCase()},`);
}

function main()
{
    let run = process.argv.slice(2).join(',');

    // Save to a disk file
    // sparen.obj.setLogFile('./sparen.log');

    // Output to stderr
    // sparen.obj.setLogFunction(console.error);

    Log(Fmt(sparen.__info__, null, 2));
    Log("--- START TESTS ---\n");

    // Run tests
    let tests = [test_1, test_2, test_3, test_4, test_5];
    for (let k in tests)
        if (isCmd(run, String(parseInt(k)+1)))
        {   Log('-----------------------------------------------------------');
            Log(` - ${tests[k].name}()`);
            Log('-----------------------------------------------------------\n');
            tests[k]();
        }

    Log('--- Done ---\n');
}

// Exit handling
process.on('exit',function() { Log('~ exit ~');});
process.on('SIGINT',function() { Log('~ keyboard ~'); process.exit(-1); });
process.on('uncaughtException',function(e) { Log('~ uncaught ~', e); process.exit(-1); });

// Run the program
main();

