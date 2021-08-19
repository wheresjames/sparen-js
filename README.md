
# sparen

Create richer more helpful logs using terminal coloring, file saving,
graph plotting, and ascii drawing.

``` javascript

    const sparen = require('sparen');
    sparen.log('This is a message');

```

---------------------------------------------------------------------
## Table of contents

* [Install](#install)
* [Examples](#examples)
* [References](#references)

&nbsp;

---------------------------------------------------------------------
## Install

    $ npm install sparen

&nbsp;


---------------------------------------------------------------------
## Examples

``` javascript

    const sparen = require('sparen');
    const Log = sparen.log;

    sparen.log('This is a message');

    sparen.addLogFilters('info:blue,warning:yellow,error:red');
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

```


&nbsp;


---------------------------------------------------------------------
## References

- Python
    - https://www.python.org/

- pip
    - https://pip.pypa.io/en/stable/

