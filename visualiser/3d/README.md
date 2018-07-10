# `3d`

This uses threejs to generate a 3d scene that you can pan and move around during the visualisation. Points are located in x and y space using the time domain data as it provides more variation. There is an explanation in the code as to how this is determined which is copied below. The z location is determined from the frequency data which is the other key difference from the 2d version as this value is represented by a second ring. 

```javascript
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

**[A demo is available here](visualiser.3d.html)**