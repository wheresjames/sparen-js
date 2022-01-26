#!/usr/bin/env nodejs
'use strict';

const fs = require('fs');
const path = require('path');

/** Exports
*/
module.exports = {
        Sparen          : Sparen,
        initArray       : initArray,
        plotArray       : plotArray,
        formatInterval  : formatInterval
    };

/** Initialize an array with return value of provided function
 * @param [in] sz   - Array size
 * @param [in] f    - Function or value that initializes each array element
 *
 * @return An array of size sz, with each element initialized with f().
*/
function initArray(sz, f)
{
    // Try ES6
    // try { return Array.from({length: sz}, f); } catch(e) {}

    let a = Array(sz);
    if (typeof f === 'function')
        for (let i = 0; i < sz; i++)
            a[i] = f(i);
    else
        for (let i = 0; i < sz; i++)
            a[i] = f;
    return a;
}


/** Logging class
    @param [in] linetmpl    - Line templates

                                ts          = timestamp
                                file        = filename
                                line        = line number
                                function    = Function name

                                Examples:
                                    '[<<ts>>] <<file>>(<<line>>): '                 -> [10:06:37] ./test.py(147):
                                    '[<<ts>>] <<file>>::<<function>>(<<line>>): '   -> [10:08:47] ./test.py::test_5(147):

    @param [in] tstmpl      - Timestamp template
                                Examples:
                                    '%H:%M:%S'

    @param [in] reldir      - Relative directory to files to show in logs
                                null    = Full paths
                                '-'     = No paths
                                '.'     = Relative to current working directory
                                ...     = Relative to specified path

*/
function Sparen(linetmpl=null, tstmpl='%H:%M:%S', reldir='.')
{
    //--------------------------------------------------------------
    // Interface

    this.log = log;
    this.addLogFilter = addLogFilter;
    this.addLogFilters = addLogFilters;
    this.getLogFilters = getLogFilters;
    this.setLogFunction = setLogFunction;
    this.setLogFile = setLogFile;
    this.setMinLogInterval = setMinLogInterval;


    //--------------------------------------------------------------
    // Data

    let m_color_filters = {};
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
    let m_log = console.log;
    let m_logFile = null;
    let m_logFileFailTime = 0;
    let m_minLogInterval = 60;
    let m_linetmpl = linetmpl;
    let m_reldir = null;

    if ('.' == reldir)
        m_reldir = process.cwd();
    else
        m_reldir = reldir;


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

    /// Set log output function / Default is console.log
    function setLogFunction(fLog)
    {   m_log = fLog;
    }

    /// Set a log filename for log output
    function setLogFile(fname)
    {   m_logFile = fname;
    }

    /// Set the minimum time between logging internal errors
    function setMinLogInterval(minLogInterval)
    {   m_minLogInterval = minLogInterval;
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
        let fpath = st ? st.getFileName() : '';
        let fname = st ? parseFileName(st.getFileName()) : '';
        let lin = st ? st.getLineNumber() : '';
        let file = fname;
        if (m_reldir)
            if ('-' == m_reldir)
                file = fname;
            else if ('+' == m_reldir)
                file = fpath;
            else
            {   let usefull = false;
                try { if (fpath.split('/')[1] != m_reldir.split('/')[1]) usefull = true;
                } catch(e) {usefull = false;}
                if (usefull)
                    file = fpath;
                else
                    file = "./" + path.relative(m_reldir, fpath);
            }
        else
            file = fpath;

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
            m_log(e);
            beg = '';
            end = '';
        }

        // Create timestamp
        let now = new Date();
        let hour = String(now.getHours()).padStart(2,'0');
        let mins = String(now.getMinutes()).padStart(2,'0');
        let secs = String(now.getSeconds()).padStart(2,'0');
        let ts = `${hour}:${mins}:${secs}`;
        let tstr = isTty ? `\u001b[2m[${ts}]\u001b[0m` : `[${ts}]`

        // Message string
        let lstr;
        if (m_linetmpl)
            lstr = m_linetmpl.replace('<<ts>>', ts)
                             .replace('<<file>>', file)
                             .replace('<<function>>', fn)
                             .replace('<<line>>', lin);
        else
            lstr = `[${ts}] ${file}(${lin}): `;

        // Show the message
        m_log(`\u001b[2m${lstr}\u001b[0m${beg}${args}${end}`);

        // // Message string
        lstr += `${args}\n`;

        // Save to file if a name was provided
        if (m_logFile)
        {
            function logFileError(e)
            {   let t = Date.now() / 1000;
                if (t < m_logFileFailTime)
                    return;
                m_logFileFailTime = t + m_minLogInterval;
                m_log(e);
            }

            // try { fs.appendFile(m_logFile, lstr, logFileError); }
            try { fs.appendFileSync(m_logFile, lstr); }
            catch(e) { logFileError(e); }
        }

        return lstr;
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
            catch(e) { m_log("ERROR: Invalid log filter:", String(e)); }
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

/** Plots an array
    @param [in] a       - Array data to plot
    @param [in] fn      - Optional function for retrieving data elements
    @param [in] scalex  - True to scale values to the x axis
    @param [in] scaley  - True to scale values to the y axis
    @param [in] height  - Height of the output plot
    @param [in] width   - Width of the output plot
    @param [in] plot    - Character to use to plot the data
    @param [in] miny    - Minimum Y axis value
    @param [in] maxy    - Maximum Y axis value
    @param [in] marginy - Y axis top and bottom margin
*/
function plotArray(a, fn = null, scalex = true, scaley = true, height = 12, width = 70,
                   plot='.', miny = 0, maxy = 100, marginy = 1)
{
    let w = width;
    let h = height;
    let m = initArray(h, ()=>initArray(w, " "));

    let l = a.length;
    let v = fn ? a.map(fn) : a;

    // Scaling the y axis?
    if (scaley)
    {   miny = Math.min.apply(null,v) - marginy;
        maxy = Math.max.apply(null,v) + marginy;
    }
    let rg = maxy - miny;
    if (0 == rg)
        rg = 1;

    let x = 0, xa = 0;
    for (let i = 0; i < l; i++)
    {
        // New y value
        let y = parseInt((v[i]-miny) * h / rg);

        // Update x pos
        while (xa >= l)
            xa -= l, x += 1;
        if (x >= w)
            break;

        // Incremental division
        xa += scalex ? w : l;

        // Character to plot
        let pt = plot;
        if (y < 0)
            y = 0, pt = '_';
        if (y >= h)
            y = h - 1, pt = '^';

        // Plot the character
        m[h - y - 1][x] = pt;
    }

    // How wide is the y gutter
    let j = Math.max(String(miny).length, String(maxy).length);

    // Build the plot
    let y = h - 1;
    let pl = null, ret = [];
    for (let r of m)
    {   let py = miny + ((y+1) * rg / h);
        py = parseInt(py - (0 > py ? 1 : 0));
        py = String(py).padStart(j, ' ');
        let sy = pl == py ? '  ' : py;
        pl = py;
        ret.push(`${sy} : ${r.join('')}`);
        y -= 1
    }

    // Build the x axis markers
    ret.push(initArray(j+1, ' ').join('') + initArray(w+2, '-').join(''));
    let nstr = '';
    for (let x = 0; x < parseInt(w/10); x++)
        nstr += String((x+1)*10).padStart(9, ' ')+'^';
    ret.push(initArray(j, ' ').join('') + nstr);

    return ret.join('\n');
}

/** Returns a formated string of the specified time interval
    @param [in] t   - Time interval in seconds
    @param [in] fmt - Format string
                        $s  - Seconds
                        $S  - Seconds with leading zero
                        $m  - Minutes
                        $M  - Minutes with leading zero
                        $h  - Hours
                        $H  - Hours with leading zero
                        $d  - Days
                        $D  - Days with leading zero
                        $y  - Years
                        $Y  - Years with leading zero
                        $f  - Decimal
                        $F  - Decimal with trailing zeros
                        $+_ - Show full value

    @param [in] dec - Number of decimal digits to include

    @begincode

        print(formatInterval())

    @encode
*/
function formatInterval(t, fmt="$+H:$M:$S", dec=3)
{
    let rep = {
        "$f":   (t) => (t-parseInt(t)).toFixed(dec).slice(2).replace(/0+$/g, ''),
        "$F":   (t) => (t-parseInt(t)).toFixed(dec).slice(2),
        "$s":   (t) => String(parseInt(t) % 60),
        "$+s":  (t) => String(parseInt(t)),
        "$S":   (t) => String(parseInt(t) % 60).padStart(2,'0'),
        "$+S":  (t) => String(parseInt(t)).padStart(2,'0'),
        "$m":   (t) => String(parseInt(t / 60) % 60),
        "$+m":  (t) => String(parseInt(t / 60)),
        "$M":   (t) => String(parseInt(t / 60) % 60).padStart(2,'0'),
        "$+M":  (t) => String(parseInt(t / 60)).padStart(2,'0'),
        "$h":   (t) => String(parseInt(t / 60 / 60) % 24),
        "$+h":  (t) => String(parseInt(t / 60 / 60)),
        "$H":   (t) => String(parseInt(t / 60 / 60) % 24).padStart(2,'0'),
        "$+H":  (t) => String(parseInt(t / 60 / 60)).padStart(2,'0'),
        "$d":   (t) => String(parseInt(t / 24 / 60 / 60) % 365),
        "$+d":  (t) => String(parseInt(t / 24 / 60 / 60)),
        "$D":   (t) => String(parseInt(t / 24 / 60 / 60) % 365).padStart(3,'0'),
        "$+D":  (t) => String(parseInt(t / 24 / 60 / 60)).padStart(3,'0'),
        "$y":   (t) => String(parseInt(t / 365 / 24 / 60 / 60)),
        "$Y":   (t) => String(parseInt(t / 365 / 24 / 60 / 60)).padStart(2,'0'),
    }

    let max = 99;
    for (let k in rep)
        while (0 < max-- && 0 <= fmt.indexOf(k))
            fmt = fmt.replace(k, rep[k](t));

    return fmt;
}
