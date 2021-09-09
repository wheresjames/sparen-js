#!/usr/bin/env nodejs
'use strict';

const sparen = require('./sparen.js');
const Log = console.log;

/** Exports
*/
module.exports = {
        Canvas: Canvas
    };

/** Canvas
    @param [in] width   - Width of the canvas
    @param [in] height  - Height of the canvas
    @param [in] charset - Index of active characterset
*/
function Canvas(width=70, height=15, charset=0)
{
    //--------------------------------------------------------------
    // Interface

    this.toString = toString;
    this.getError = getError;
    this.setCharset = setCharset;
    this.setCharsetIdx = setCharsetIdx;
    this.getWidth = getWidth;
    this.getHeight = getHeight;
    this.create = create;
    this.destroy = destroy;
    this.getPoint = getPoint;
    this.setPoint = setPoint;
    this.subChar = subChar;
    this.line = line;
    this.fillRect = fillRect;
    this.erase = erase;
    this.rect = rect;
    this.arc = arc;
    this.circle = circle;
    this.text = text;
    this.splitText = splitText;
    this.textBox = textBox;


    //--------------------------------------------------------------
    // Data

    let m_sErr = '';
    let m_charsets = [
            {'lines': '-|.|--+|xx----', 'plot': '.', 'fill': '#'},
            {'lines': '─│·├┬┴┼┤xx┌┐└┘', 'plot': '·', 'fill': '█'},
            {'lines': '═║·╠╦╩╬╣xx╔╗╚╝', 'plot': '·', 'fill': '█'}
        ];
    let m_nWidth = 0;
    let m_nHeight = 0;
    let m_nSize = 0;
    let m_buf = [];

    // Initial charset
    if (charset >= m_charsets.length)
        charset = m_charsets.length - 1;
    let m_charset = m_charsets[charset];

    // Initialize
    if (0 < width && 0 < height)
        create(width, height);


    //--------------------------------------------------------------
    // Functions

    /** Returns the internal drawing buffer as a string
    */
    function toString()
    {
        return m_buf.join('');
    }


    /** Returns a description of the last error
    */
    function getError()
    {
        return m_sErr
    }


    /** Sets arbitrary character set
        @param [in] cs  - Dictionary defining the character set
    */
    function setCharset( cs)
    {
        if (!cs.lines || cs.corners || !cs.plot || !cs.fill)
        {   m_sErr = 'Invalid parameter';
            return false;
        }
        m_charset = cs;
    }


    /** Selects one of the predefined drawing charsets
        @param [in] cs  - Index to a predefined character set
    */
    function setCharsetIdx(cs)
    {
        if (cs >= m_charsets.length)
            cs = 0;
        setCharset(m_charsets[cs]);
    }


    /** Returns the canvas width
    */
    function getWidth()
    {
        return m_nWidth;
    }


    /** Returns the canvas height
    */
    function getHeight()
    {
        return m_nHeight;
    }


    /** Destroys the class instance
    */
    function destroy()
    {
        m_nWidth = 0;
        m_nHeight = 0;
        m_nSize = 0;
        m_buf = [];
    }


    /** Initializes the class instance
        @param [in] width   - Width of the canvas
        @param [in] height  - Height of the canvas
    */
    function create(width=70, height=15)
    {
        destroy()

        if (0 >= width || 0 >= height)
        {   m_sErr = "Invalid canvas size";
            return false;
        }

        m_nWidth = width;
        m_nHeight = height;
        m_nSize = m_nWidth * m_nHeight + m_nHeight;
        m_buf = sparen.initArray(m_nSize, ' ');
        for (let i = 0; i < m_nHeight; i++)
            m_buf[i + (i+1) * m_nWidth] = '\n';

        return true
    }


    /** Gets a single point on the canvas
        @param [in] x   - X coord of the point to set
        @param [in] y   - Y coord of the point to set
    */
    function getPoint(x, y)
    {
        if (0 > x || m_nWidth <= x || 0 > y || m_nHeight <= y)
            return null;
        return m_buf[y * (m_nWidth + 1) + x];
    }


    /** Sets a single point on the canvas
        @param [in] x   - X coord of the point to set
        @param [in] y   - Y coord of the point to set
        @param [in] ch  - Character value to set
    */
    function setPoint(x, y, ch)
    {
        if (!ch)
            ch = m_charset['plot'];
        if (0 > x || m_nWidth <= x || 0 > y || m_nHeight <= y)
            return false;
        m_buf[y * (m_nWidth + 1) + x] = ch;
        return true;
    }


    /** Substitute character based on a translation mapping
        @param [in] src - Source character (to be written)
        @param [in] dst - Destination character (that already exists at that spot)
        @param [in] cm  - Character map
        @param [in] tm  - Translation map
    */
    function subChar(src, dst, cm, tm)
    {
        if (!dst || ' ' >= dst)
            return src;
        for (let i in tm)
            if (dst == cm[i])
                return 0 > tm[i] ? src : cm[tm[i]];
        return src;
    }


    /** Draws a line
        @param [in] x1  - X coord of the line starting point
        @param [in] y1  - Y coord of the line starting point
        @param [in] x2  - X coord of the line ending point
        @param [in] y2  - Y coord of the line ending point
        @param [in] cm  - Character map
                            '─│·├┬┴┼┤xx┌┐└┘'
                            '01234567xx0123'
                             ||||||||  ||||
                             ||||||||  |||+---> 13: Bottom right corner
                             ||||||||  ||+----> 12: Bottom left corner
                             ||||||||  |+-----> 11: Top right corner
                             ||||||||  +------> 10: Top left corner
                             |||||||+--------->  7: Right Junction
                             ||||||+---------->  6: All Junction
                             |||||+----------->  5: Bottom Junction
                             ||||+------------>  4: Top Junction
                             |||+------------->  3: Left Junction
                             ||+-------------->  2: Arbitrary line
                             |+--------------->  1: Vertical line
                             +---------------->  0: Horizontal line
    */
    function line(x1, y1, x2, y2, cm=null)
    {
        if (!cm)
            cm = m_charset['lines'];
        if (14 > cm.length)
            cm = cm.padEnd(14, cm[cm.length -1]);

        x1 = parseInt(x1);
        y1 = parseInt(y1);
        x2 = parseInt(x2);
        y2 = parseInt(y2);

        if (x1 > x2)
            [x1, x2] = [x2, x1];
        if (y1 > y2)
            [y1, y2] = [y2, y1];

        let m;
        let w = m_nWidth;
        let h = m_nHeight;
        let max = w * h;

        // Horz line?
        if (y1 == y2)
        {
            x1 = Math.max(0,Math.min(x1, w));
            x2 = Math.max(0,Math.min(x2, w));
            for (let x = x1; x < x2 + 1; x++ && 0 < max--)
            {
                if (x == x1)
                    m = [0, 3, -1, 3, 4, 5, 6, 6, -1, -1, 10, 4, 12, 5];
                else if (x == x2)
                    m = [0, 7, -1, 6, 4, 5, 6, 7, -1, -1, 4, 11, 5, 13];
                else
                    m = [0, 6, -1, 6, 4, 5, 6, 6, -1, -1, 4, 4, 5, 5];
                setPoint(x, y1, subChar(cm[0], getPoint(x, y1), cm, m))
            }
        }

        // Vert line?
        else if (x1 == x2)
        {
            y1 = Math.max(0,Math.min(y1, h));
            y2 = Math.max(0,Math.min(y2, h));
            for (let y = y1; y < y2 + 1; y++ && 0 < max--)
            {
                if (y == y1)
                    m = [4, 1, -1, 3, 4, 6, 6, 7, -1, -1, 10, 11, 3, 7];
                else if (y == y2)
                    m = [5, 1, -1, 3, 6, 5, 6, 7, -1, -1, 3, 7, 12, 13];
                else
                    m = [6, 1, -1, 3, 6, 6, 6, 7, -1, -1, 3, 7, 3, 7];
                setPoint(x1, y, subChar(cm[1], getPoint(x1, y), cm, m));
            }
        }

        // Arbitrary line
        else
        {
            let mx = 0;
            let my = 0;
            let xl = Math.abs(x2 - x1);
            let yl = Math.abs(y2 - y1);
            let xd = x1 < x2 ? 1 : -1;
            let yd = y1 < y2 ? 1 : -1;

            let done = false;
            while(!done && max--)
            {
                if (x1 == x2 && y1 == y2)
                    done = true;

                if (0 <= x1 && x1 < w && 0 <= y1 && y1 < h)
                    setPoint(x1, y1, cm[2]);

                mx += xl
                if (x1 != x2 && mx > yl)
                    x1 += xd, mx -= yl;

                my += yl
                if (y1 != y2 && my > xl)
                    y1 += yd, my -= xl;
            }
        }
    }


    /** Fills a rectangle with the specified character value
        @param [in] x1  - X coord of the upper left point
        @param [in] y1  - Y coord of the upper left point
        @param [in] x2  - X coord of the lower right point
        @param [in] y2  - Y coord of the lower right point
        @param [in] ch  - Character to fill the rectangle with
    */
    function fillRect(x1, y1, x2, y2, ch=null)
    {
        if (!ch)
            ch = m_charset['fill'];

        if (x1 > x2)
            x1,x2 = x2,x1;
        if (y1 > y2)
            y1,y2 = y2,y1;

        for (let y = y1; y < y2; y++)
            for (let x = x1; x < x2; x++)
                setPoint(x, y, ch);
    }


    /** Fills the entire canvas with the specified character
        @param [in] ch  - Character to fill the canvas with
    */
    function erase(ch=' ')
    {
        self.fillRect(0, 0, m_nWidth, m_nHeight, ch);
    }


    /** Draws a rectangle outline with the specified character map
        @param [in] x1  - X coord of the upper left point
        @param [in] y1  - Y coord of the upper left point
        @param [in] x2  - X coord of the lower right point
        @param [in] y2  - Y coord of the lower right point
        @param [in] cm  - Character map
                            '─│·├┬┴┼┤xx┌┐└┘'
                            '01234567xx0123'
                             ||||||||  ||||
                             ||||||||  |||+---> 13: Bottom right corner
                             ||||||||  ||+----> 12: Bottom left corner
                             ||||||||  |+-----> 11: Top right corner
                             ||||||||  +------> 10: Top left corner
                             |||||||+--------->  7: Right Junction
                             ||||||+---------->  6: All Junction
                             |||||+----------->  5: Bottom Junction
                             ||||+------------>  4: Top Junction
                             |||+------------->  3: Left Junction
                             ||+-------------->  2: Arbitrary line
                             |+--------------->  1: Vertical line
                             +---------------->  0: Horizontal line
    */
    function rect(x1, y1, x2, y2, cm = null)
    {
        if (!cm)
            cm = m_charset['lines'];
        if (14 > cm.length)
            cm = cm.padEnd(14, cm[cm.length -1]);

        // Read corners
        let c0 = getPoint(x1, y1);
        let c1 = getPoint(x2, y1);
        let c2 = getPoint(x1, y2);
        let c3 = getPoint(x2, y2);

        // Draw lines
        line(x1, y1, x2, y1, cm);
        line(x2, y1, x2, y2, cm);
        line(x2, y2, x1, y2, cm);
        line(x1, y2, x1, y1, cm);

        // Choose correct corner
        setPoint(x1, y1, subChar(cm[10], c0, cm, [4, 3, -1, 3, 4, 6, 6, 6, -1, -1, 10, 4, 3, 6]));
        setPoint(x2, y1, subChar(cm[11], c1, cm, [4, 7, -1, 6, 4, 6, 6, 7, -1, -1, 4, 11, 6, 7]));
        setPoint(x1, y2, subChar(cm[12], c2, cm, [5, 3, -1, 3, 6, 5, 6, 6, -1, -1, 3, 6, 12, 5]));
        setPoint(x2, y2, subChar(cm[13], c3, cm, [5, 7, -1, 6, 6, 5, 6, 7, -1, -1, 6, 7, 5, 13]));
    }


    /** Draws an arc
    @param [in] x   - X coord of the arc focus point
    @param [in] y   - Y coord of the arc focus point
    @param [in] r   - Arc radius
    @param [in] s   - Starting angle in degrees
    @param [in] e   - Ending angle in degrees
    @param [in] ch  - Character to plot
    @param [in] ar  - Aspect ratio, to make circles look a
                      bit rounder, this can be set to 2,
                      use 1 for a precision circle
    */
    function arc(x, y, r, s, e, ch=null, ar=2)
    {
        if (!ch)
            ch = m_charset['plot'];

        let pi2 = Math.PI * 2;
        s = s * Math.PI / 180;
        e = e * Math.PI / 180;
        if (e < s)
            e,s = s,e;

        let a = e - s;
        let pts = parseInt((r * 8) * a / pi2);
        for (let i = 0; i < pts; i++)
        {   let px = parseInt(x + r * Math.cos(s + i * a / pts) * ar);
            let py = parseInt(y + r * Math.sin(s + i * a / pts));
            setPoint(px, py, ch);
        }
    }


    /** Draws a circle
        @param [in] x   - X coord of the circle focus point
        @param [in] y   - Y coord of the circle focus point
        @param [in] r   - Circle radius
        @param [in] ch  - Character to plot
        @param [in] ar  - Aspect ratio, to make circles look a
                        bit rounder, this can be set to 2,
                        use 1 for a precision circle
    */
    function circle(x, y, r, ch=null, ar=2)
    {
        arc(x, y, r, 0, 360, ch, ar);
    }


    /** Draw text at the specified position
        @param [in] x   - X coord of the text
        @param [in] y   - Y coord of the text
        @param [in] txt - Text to plot
    */
    function text(x, y, txt)
    {
        for (let i = 0; i < txt.length; i++)
            if (!setPoint(x + i, y, txt[i]))
                break
    }


    /** Splits a string to the specified length on whitespace when possible
        @param [in] txt     - Text to split
        @param [in] mx      - Maximum length of a single line

        @returns Returns an array of rows of split text
    */
    function splitText(txt, mx)
    {
        if (0 >= mx)
            return [txt];

        // Fix tabs and crlf's and split lines
        let lines = txt.replace(/\t/g, '  ').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split("\n")

        let rows = [];

        for (let ln of lines)
        {
            ln = ln.trim();
            while (mx < ln.length)
            {
                let l = 0
                let sp = 0
                while (l < mx)
                {   if (ln[l] <= ' ')
                        sp = l;
                    l += 1;
                }

                // Soft break
                if (0 < sp)
                {   rows.push(ln.slice(0, sp));
                    ln = ln.slice(sp+1).trim();
                }

                // Hard break
                else
                {   rows.push(ln.slice(0, mx-1));
                    ln = ln.slice(mx-1).trim();
                }
            }

            if (0 < ln.length)
                rows.push(ln);
        }

        return rows;
    }


    /** Draw text and contain it in the specified box
        @param [in] x1          - X coord of the upper left point
        @param [in] y1          - Y coord of the upper left point
        @param [in] x2          - X coord of the lower right point
        @param [in] y2          - Y coord of the lower right point
        @param [in] txt         - Text to plot
        @param [in] xjustify    - How to justify the text on the X axis
                                    Can be: center, left, right
        @param [in] yjustify    - How to justify the text on the Y axis
                                    Can be: center, top, bottom
    */
    function textBox(x1, y1, x2, y2, txt, xjustify='center', yjustify='center')
    {
        if (x1 > x2)
            x1,x2 = x2,x1;
        if (y1 > y2)
            y1,y2 = y2,y1;

        let w = x2 - x1;
        let h = y2 - y1;

        // Split the text into rows
        let rows = splitText(txt, w);

        x1 += 1
        y1 += 1

        // Drop rows that don't fit
        if (rows.length >= h)
            rows = rows.slice(0, h-1);

        // Y axis justification
        if ('top' == yjustify)
            ;
        else if ('bottom' == yjustify)
            y1 = y1 + h - rows.length - 1;
        else
            y1 = Math.ceil(y1 + (h - rows.length) / 2 - 1);

        // Draw each row of text
        for (let r of rows)
        {
            if (y1 >= y2)
                break;

            // X axis justification
            let x;
            if ('left' == xjustify)
                x = x1;
            else if ('right' == xjustify)
                x = x2 - r.length;
            else
                x = Math.ceil(x1 + (w - r.length) / 2 - 1);

            text(x, y1, r);
            y1 += 1;
        }
    }
}

