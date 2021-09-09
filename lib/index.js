#!/usr/bin/env nodejs
'use strict';

const fs = require('fs');
const path = require('path');

function loadConfig(fname)
{   if (!fs.existsSync(fname))
        return {};
    let r = {};
    let data = fs.readFileSync(fname, 'utf8');
    let lines = data.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    lines.forEach(v =>
        {   v = v.trim();
            if ('#' != v[0])
            {   let parts = v.split(/\s+/);
                if (1 < parts.length)
                {   let k = parts.shift().trim().toLowerCase();
                    r[k] = parts.join(' ');
                }
            }
        });
    return r;
}

const sparen = require('./sparen.js');
const canvas = require('./canvas.js');

var _g_sparen_obj = new sparen.Sparen();
module.exports =
{
    __info__    : loadConfig(path.join(path.dirname(__dirname), 'PROJECT.txt')),
    obj         : _g_sparen_obj,
    log         : _g_sparen_obj.log,

    ...sparen,
    ...canvas
}
