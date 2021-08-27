#!/usr/bin/env nodejs
'use strict';

/** Exports
*/
module.exports = {Sparen: Sparen};

/** Logging class
*/
function Sparen()
{
    //--------------------------------------------------------------
    // Interface

    this.log = log;
    this.addLogFilter = addLogFilter;
    this.addLogFilters = addLogFilters;
    this.getLogFilters = getLogFilters;


    //--------------------------------------------------------------
    // Data

    var m_color_filters = {};
    let m_colors = {
        'BLACK'     : '\u001b[90m',
        'RED'       : '\u001b[91m',
        'GREEN'     : '\u001b[92m',
        'YELLOW'    : '\u001b[93m',
        'BLUE'      : '\u001b[94m',
        'MAGENTA'   : '\u001b[95m',
        'CYAN'      : '\u001b[96m',
        'WHITE'     : '\u001b[97m',
        'BOLD'      : '\u001b[1m',
        'FAINT'     : '\u001b[2m',
        'ITALIC'    : '\u001b[3m',
        'UNDERLINE' : '\u001b[4m',
        'BLINK'     : '\u001b[5m',
        'NEGATIVE'  : '\u001b[7m',
        'STRIKEOUT' : '\u001b[9m',
        'DEFAULT'   : '\u001b[0m'
    };


    //--------------------------------------------------------------
    // Functions

    /// Returns the current stack
    function getStack()
    {
        let ret = null;
        let orig = Error.prepareStackTrace;
        try
        {
            Error.prepareStackTrace = (_, stack) => {
                return stack;
            };
            let err = new Error;
            Error.captureStackTrace(err, log);
            ret = err.stack;
        }
        catch(e) {}
        Error.prepareStackTrace = orig;
        return ret;
    }

    /// Parse filename from string
    function parseFileName(p)
    {   let _p = String(p).split("/");
        return _p.length ? _p[_p.length - 1] : p;
    }

    /**
     * @param [in] *    - All parameters are logged
    */
    function log()
    {
        // Stack information
        let stack = getStack();
        let st = stack ? stack[0] : null;
        let fn = st ? st.getFunctionName() : '';
        let loc = st ? parseFileName(st.getFileName()) : '';
        let lin = st ? st.getLineNumber() : '';
        if (fn && 'null' != fn)
            loc += '::' + fn;

        // Format arguments
        let args = [];
        for (let k in arguments)
        {
            let v = arguments[k];
            try
            {
                if (v && typeof(v) == 'object')
                {   if (v.stack)
                        args.push("\n " + v.stack + "\n");
                    if (0 < Object.keys(v).length)
                        args.push(JSON.stringify(v));
                }
                else
                    args.push(String(v));
            }
            catch(e)
            {
                args.push(String(v));
            }
        }

        args = args.join(' ');

        // Do we have a true console
        let isTty = true;
        try { isTty = process.stdout.isTTY ? true : false; }
        catch(e)
        {   try
            {   const tty = require('tty');
                if (!tty.isatty(process.stdout.fd))
                    isTty = false;
            } catch(e) {}
        }

        // Apply color filters
        let beg = '', end = '';
        try
        {
            if (isTty)
                for (let k in m_color_filters)
                {   let v = m_color_filters[k];
                    if (0 <= args.indexOf(k))
                    {   end = m_colors['DEFAULT'];
                        for (let _c in v)
                        {   let c = v[_c];
                            c = c.toUpperCase();
                            if ('BLOCK' == c)
                                return;
                            if (c in m_colors)
                                beg += m_colors[c];
                        }
                    }
                }
        }
        catch(e)
        {
            console.log(e);
            beg = '';
            end = '';
        }

        // Create timestamp
        let now = new Date();
        let hour = String(now.getHours()).padStart(2,'0');
        let mins = String(now.getMinutes()).padStart(2,'0');
        let secs = String(now.getSeconds()).padStart(2,'0');
        let ts = `${hour}:${mins}:${secs}`;
        let tstr = isTty ? `\u001b[2m[${ts}]\u001b[0m ` : `[${ts}] `

        // Show the message
        console.log(tstr + loc + "(" + lin + "): " + beg + args + end);

        // Return message string
        return tstr + loc + "(" + lin + "): " + args;
    }

    /** Adds a single filter to colorize text
        @param [in] f   - Case insensitive filter string,
                          values can be any of
                            black, red, green, yellow, blue,
                            magenta, cyan, white, bold, faint,
                            italic, underline, blink, strikeout

        Example:
        @begincode

            // Color all strings containing 'error' red
            addLogFilter("error:red")

        @endcode
    */
    function addLogFilter(f)
    {
        let p = f.split(':');
        if (1 < p.length)
        {   try
            {   ''.search(p[0]);
                m_color_filters[p[0]] = p.slice(1);
            }
            catch(e) { Log("ERROR: Invalid log filter:", String(e)); }
        }
        else if (f in m_color_filters)
            delete m_color_filters[f];
    }

    /** Adds a list of filters to colorize text
        @param [in] f   - Comma separated case insensitive filter strings
                          values can be any of
                            black, red, green, yellow, blue,
                            magenta, cyan, white, bold, faint,
                            italic, underline, blink, strikeout

        Example:
        @begincode

            // Color all strings containing 'error' red, 'warning' yellow,
            // Texts containing 'info' will blink
            addLogFilter("error:red,warning:yellow,info:blink")

        @endcode
    */
     function addLogFilters(f)
    {
        let p = f.split(',');
        for(let v in p)
            if (p[v])
                addLogFilter(p[v]);
    }

    /// Returns current log filters
    function getLogFilters()
    {
        return m_color_filters;
    }


}


