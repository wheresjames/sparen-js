#!/usr/bin/env nodejs
'use strict';

const sparen = require('./sparen.js');

var _g_sparen_obj = new sparen.Sparen();
module.exports =
{
    Sparen:     sparen.Sparen,
    obj:        _g_sparen_obj,
    log:        _g_sparen_obj.log
};

