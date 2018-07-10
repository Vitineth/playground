# playground

This is just a repository that is going to contain all of the random stuff that I make. A lot of these will be pretty shoddy and developed quite badly but I will try and go through an at least comment them with what they are doing. The majority of these will be things finished at 2/3am so the code will likely be inefficient or slightly buggy.

## Projects

### [`walker`](walker/README.md)

This a path walker visualisation program. Built entirely in JS, a point walks around a grid and a map is drawn of its movements. The more times it visits a point, the large the circle drawn at that point of the grid is. As the code stands in the repo an unvisited spot is 4 times more likely to be visited than a visited spot. Additionally, the more times a point is visited, the lighter the colour is at that point. It is advised to run this with the console open as progress and some statistical information is printed there, rather than the main screen.

An example of the output is given below.

![Example of Output](https://imgur.com/qsc75Jq.png)

### [`visualiser`](visualiser/README.md)

This is a basic audio visualiser. It is split into two subprojects: `3d` and `2d` which, as the names suggest are 3d and 2d versions of the same project

#### [`3d`](visualiser/3d/README.md)

This uses threejs to generate a 3d scene that you can pan and move around during the visualisation. Points are located in x and y space using the time domain data as it provides more variation. There is an explanation in the code as to how this is determined which is copied below. The z location is determined from the frequency data which is the other key difference from the 2d version as this value is represented by a second ring. 

``` javascript
// Calculate the x and y location. We need to work out the radius of the sphere the point
//   is being drawn to and we know that the maximum value we can receive is 255 so we turn it
//   into a muliitpler and then times it by the scale to form the radius
// Then using standard trig we can work out the x and y positions using the parametric equations
//   of a circle
var v = (timeDomainData[i] / 255.0);
var r = scale * v;
let x = r * Math.cos(activeAngle);
let y = r * Math.sin(activeAngle);
```

An example output is shown below although a lot of the effect is lost without being able to pan around

![An example output of the 3D visualiser at a random instant](https://i.imgur.com/NJmhuWx.png)

#### [`2d`](visualiser/2d/README.md)

This uses the same idea as the 3d version (and was actually developed first so it should really be the other way around). The innermost ring uses the same code as above to determine x and y and the outermost ring uses the same code but uses the frequencyData instead. There is also the slight modification that it does not render points that have a default position. This means that points appear and disappear and there is not a plain circle surrounding it which didn't quite look as good.

One of the big changes from the 3d model as well is the fact that this one has a fade out system. On each draw the canvas is blanked with a 0.1 opacity black square which means that points will slowly fade out leaving a set of trails. This could not be replicated in the 3d version, or at least I couldn't put in the effort to figure out how to do it.

An example output is shown below

![Example output of the 2D visualiser at a random instant](https://i.imgur.com/MiYY5Mk.png)

### [`terrain`](terrain/README.md)

This is an implementation of the [diamond-square algorithm](https://en.wikipedia.org/wiki/Diamond-square_algorithm) which generates a random terrain map of a given resolution and then displays it as a graph surface using Plottly.js.

This was written a long time ago and so the comments in it may not be the highest quality but it should do the job

An example output is given below

![Example output of the terrain generator](https://i.imgur.com/BUUf9pJ.png)