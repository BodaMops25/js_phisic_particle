// const G = 6.674 * 10e-11
const G = 1e-11

const cnvs = document.querySelector('canvas'),
			ctx = cnvs.getContext('2d')
      
cnvs.width = parseInt(getComputedStyle(cnvs).width)
cnvs.height = parseInt(getComputedStyle(cnvs).height)

const body = []

function Body({x = 0, y = 0, mass = 1, radius = 1, acceleration = {force: 0, angle: 0}} = {}) {
	this.x = x
  this.y = y
  this.mass = mass
  this.radius = radius
  this.acceleration = acceleration
}

function randomBetweenInt(min, max) {
	return Math.round(min + Math.random() * (max - min))
}

body.push(new Body({
  x: cnvs.width / 2 - 0,
  y: cnvs.height / 2,
  radius: 20,
  mass: 1e12,
  acceleration: {force: 0, angle: 0}
}))
body.push(new Body({
  x: cnvs.width / 2 + 300,
  y: cnvs.height / 2 + 50,
  radius: 20,
  mass: 1,
  acceleration: {force: 2, angle: 90}
}))

/* for(let i = 0; i < 2; i++) {
  body.push(new Body({
    x: randomBetweenInt(0, cnvs.width),
    y: randomBetweenInt(0, cnvs.height),
    mass: randomBetweenInt(1e12, 1e12),
    radius: 20,
  }))
} */

function radToDeg(rad) {return 180 / Math.PI * rad}
function degToRad(deg) {return Math.PI / 180 * deg}

function vectorModule(x, y) {return (x**2 + y**2)**.5}

function vectorAngle(x, y) {
	if(x == 0 && y == 0) return 0
  
	const cos = x / vectorModule(x, y),
  			angle = radToDeg(Math.acos(cos))
	return y > 0 ? angle : 360 - angle
}

function accelerationToVector({force, angle}) {
	return {
  	x: Math.cos(degToRad(angle)) * force,
    y: Math.sin(degToRad(angle)) * force
  }
}

function bodyDistant(b1, b2) {
	return vectorModule(b2.x - b1.x, b2.y - b1.y)
}

function acceleration(b1, b2) {
	const force = (b1.mass * b2.mass) / bodyDistant(b1, b2) * G,
  			angle = vectorAngle(b2.x - b1.x , b2.y - b1.y)
        
	return {force, angle}
}

function mergeAccelerations(accelerationsArr) {
	
	const {x, y} = accelerationsArr.reduce(({x: x1, y: y1}, acceleration) => {
  	
    const {x: x2, y: y2} = accelerationToVector(acceleration)
    return {x: x1 + x2, y: y1 + y2}
  }, {x: 0, y: 0})
  
  return {force: vectorModule(x, y), angle: vectorAngle(x, y)}
}

function drawVector(x0, y0, x1, y1, size = 2, color = 'white') {
	ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  
  ctx.lineWidth = size
  ctx.strokeStyle = color
  ctx.stroke()
  
  ctx.beginPath()
  ctx.arc(x1, y1, size * 2, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
}

function drawBody(b, debug = false) {
	ctx.beginPath()
	ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2)
  ctx.fillStyle = 'white'
  ctx.fill()
  
  if(debug) {
  	const {x, y} = accelerationToVector(b.acceleration)
  	drawVector(b.x, b.y, b.x + x * 10, b.y + y * 10, undefined, 'orange')
    body.forEach(b2 => {
    	if(b2 !== b) {
        
      	const {x: gx, y: gy} = accelerationToVector(acceleration(b, b2))
        drawVector(b.x, b.y, b.x + gx * 100, b.y + gy * 100, undefined, 'green')
      }
    })
  }
}

const fps = 60,
			loop = setInterval(() => {
      	
        ctx.clearRect(0, 0, cnvs.width, cnvs.height)
        
        body.forEach(b1 => {
        	
					const accelerations = body.reduce((acc, b2) => {
          	if(b2 !== b1) {
            	acc.push(acceleration(b1, b2))
              return acc
            }
            return acc
          }, [])
          
          accelerations.push(b1.acceleration)
          
          b1.acceleration = mergeAccelerations(accelerations)
          
          const {x, y} = accelerationToVector(b1.acceleration)
          b1.x += x / b1.mass
          b1.y += y / b1.mass
          
          body.forEach(b2 => {
          	if(b2 !== b1) {
            	
            	if(vectorModule(b2.x - b1.x, b2.y - b1.y) <= b1.radius + b2.radius) {
              	// debugger
              	const {force, angle} = acceleration(b1, b2)
                
                b1.acceleration = mergeAccelerations([b1.acceleration, {force: -((force+1)*10), angle: angle}])
              }
            }
          })
          
          drawBody(b1, true)
        })
      }, 1000 / fps)
      
/* clearInterval(loop) */