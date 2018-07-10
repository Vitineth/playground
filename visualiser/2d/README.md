# `2d`

This uses the same idea as the 3d version (and was actually developed first so it should really be the other way around). The innermost ring uses the same code as above to determine x and y and the outermost ring uses the same code but uses the frequencyData instead. There is also the slight modification that it does not render points that have a default position. This means that points appear and disappear and there is not a plain circle surrounding it which didn't quite look as good.

One of the big changes from the 3d model as well is the fact that this one has a fade out system. On each draw the canvas is blanked with a 0.1 opacity black square which means that points will slowly fade out leaving a set of trails. This could not be replicated in the 3d version, or at least I couldn't put in the effort to figure out how to do it.

An example output is shown below

![Example output of the 2D visualiser at a random instant](https://i.imgur.com/MiYY5Mk.png)

**[A demo is available here](visualiser/2d/visualiser.html)**

