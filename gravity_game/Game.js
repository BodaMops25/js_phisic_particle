
class Body {
  constructor({x = 0, y = 0, mass = 1, radius = 1, force = 0, angle = 0, id = '', debug} = {}) {
    [x, y, mass, radius, force, angle] = MathTools.validateNum(x, y, mass, radius, force, angle)

    this._x = x
    this._y = y
    this._mass = mass
    this._radius = radius
    this._acceleration = new PolarVector(force, angle)

    if(id !== '' && typeof id === 'string') this._id = id
    if(debug) this._debug = true
  }

  set x(num) {this._x = MathTools.validateNum(num)}
  get x() {return this._x}

  set y(num) {this._y = MathTools.validateNum(num)}
  get y() {return this._y}

  set mass(num) {this._mass = MathTools.validateNum(num)}
  get mass() {return this._mass}

  set radius(num) {this._radius = MathTools.validateNum(num)}
  get radius() {return this._radius}

  set acceleration(polarVector) {
    if(polarVector.constructor !== PolarVector) {console.error('Parameter must be class PolarVector'); return}
    this._acceleration = polarVector
  }
  get acceleration() {return this._acceleration}
  
  set id(string) {
    if(typeof string !== 'string') {console.error('Parameter must be string'); return}
    this._id = string
  }
  get id() {return this._id}

  addAcceleration(polarVector) {
    if(polarVector.constructor !== PolarVector) {console.error('Parameter must be class PolarVector'); return}

    const v1 = this.acceleration.toCartesianCoords(),
          v2 = polarVector.toCartesianCoords()

    this.acceleration = v1.add(v2).toPolarCoords()
  }

  step() {
    const vec = this.acceleration.toCartesianCoords().divideAbs(this.mass)
    this.x += vec.x
    this.y += vec.y
  }
}

class GravityGame {
  constructor(gravityConst) {
    if(gravityConst !== undefined) this.gravityConst = gravityConst
  }
  _bodies = []
  #bodiesFrame = []
  _gravityConst = 6.674 * 10e-11

  set gravityConst(num) {
    this._gravityConst = MathTools.validateNum(num)
  }
  get gravityConst() {return this._gravityConst}

  get bodies() {return this._bodies}

  /**
   * @param {stringOrNumber} mark if parameter "mark" has data type "string" looking for body by id, 
   * else if parameter mark has data type "number" looking for body by index
   */
  getBody(mark) {
    let b = null,
      searchingType = ''

    if(typeof mark === 'string') {
      b = this.bodies.find(b => b.id === mark)
      searchingType = 'id'
    }
    else if(Number.isNaN(+mark) === false) {
      b = this.bodies[+mark]
      searchingType = 'index'
    }
    else {console.error('Parameter must be string or number'); return}

    if(b === undefined) {console.error('Can\'t find body with current mark'); return}
    return b
  }

  addBody(bodyObj) {
    if(bodyObj.constructor !== Body) {console.error('Parameter must be class Body'); return false}
    this.bodies.push(bodyObj)
    return bodyObj
  }

  removeBodyByIndex(index) {
    index = +index
    if(Number.isNaN(index)) {console.error('Parameter must be number'); return}
    else if(this.bodies[index] === undefined) {console.error('Can\'t finde body with current index'); return}

    this.#bodiesFrame = []
    return this.bodies.splice(index, 1)
  }

  removeBodyById(id) {
    if(typeof id !== 'string') {console.error('Parameter must be string'); return}
    const index = this.bodies.findIndex(b => b.id === id)
    if(index === -1) {console.error('Can\'t finde body with current id'); return}

    this.#bodiesFrame = []
    return this.bodies.splice(index, 1)
  }

  gravityLaw(b1, b2) {
    if(b1.constructor !== Body || b2.constructor !== Body) {console.error('Parameters must be class Body'); return false}
    return (b1.mass * b2.mass) / GravityGame.bodiesDistance(b1, b2) * this.gravityConst
  }

  gravityPolarVector(b1, b2) {
    if(b1.constructor !== Body || b2.constructor !== Body) {console.error('Parameters must be class Body'); return false}
    const force = this.gravityLaw(b1, b2),
          angle = GravityGame.bodiesAngle(b1, b2)

    return new PolarVector(force, angle)
  }

  /**
   * returns an array of bodies that will collide with the body in the next step
   */
  collision(b) {
    if(b.constructor !== Body) {console.error('Parameter must be class Body'); return false}

    const b_accelerationCartesionVec = b.acceleration.toCartesianCoords(),
          b_vec = new CartesianVector(b.x, b.y),
          b_nextVec = b_vec.add(b_accelerationCartesionVec.divideAbs(b.mass))

    return this.bodies.filter(b2 => {
      if(b === b2) return false

      const b2_accelerationCartesionVec = b2.acceleration.toCartesianCoords(),
            b2_vec = new CartesianVector(b2.x, b2.y),
            b2_nextVec = b2_vec.add(b2_accelerationCartesionVec.divideAbs(b2.mass))

      const d = b2_nextVec.substract(b_nextVec).toPolarCoords().x

      return d <= b.radius + b2.radius
    })
  }

  /* collision(b) {
    if(b.constructor !== Body) {console.error('Parameter must be class Body'); return false}

    const arr = this.bodies.filter(b2 => {
      if(b === b2) return false
      return Math.abs(b2.x - b.x) <= b.radius + b2.radius
    })

    return arr.filter(b2 => {
      return Math.abs(b2.y - b.y) <= b.radius + b2.radius
    })
  } */

  nextFrame() {

    this.bodies.forEach((b, i) => {

      this.#bodiesFrame[i] = b.acceleration.toCartesianCoords()

      this.bodies.forEach(b2 => {
        if(b2 !== b) {
          const gravity = this.gravityPolarVector(b, b2)
          this.#bodiesFrame[i] = this.#bodiesFrame[i].add(gravity.toCartesianCoords())
        }
      })

      this.collision(b).forEach(b2 => {
        const resistence = GravityGame.collisionResistence(b, b2)
        this.#bodiesFrame[i] = this.#bodiesFrame[i].add(resistence.toCartesianCoords())
      })
    })

    this.bodies.forEach((b, i) => {
      b.acceleration = this.#bodiesFrame[i].toPolarCoords()
      b.step()
    })
  }

  /**
   * use only in collision
   */
  static collisionResistence(b1, b2) {
    if(b1.constructor !== Body || b2.constructor !== Body) {console.error('Parameters must be class Body'); return false}
    
    const b1_accelerationCartesionVec = b1.acceleration.toCartesianCoords(),
          b1_vec = new CartesianVector(b1.x, b1.y),
          b1_nextVec = b1_vec.add(b1_accelerationCartesionVec.divideAbs(b1.mass)),
          b2_accelerationCartesionVec = b2.acceleration.toCartesianCoords(),
          b2_vec = new CartesianVector(b2.x, b2.y),
          b2_nextVec = b2_vec.add(b2_accelerationCartesionVec.divideAbs(b2.mass)),
          collisionData = b2_nextVec.substract(b1_nextVec).toPolarCoords(),
          rel = b2.mass / (b1.mass + b2.mass)

    collisionData.x = -((b1.radius + b2.radius) - collisionData.x) * rel * b1.mass
    return collisionData
  }

  static bodiesDistance(b1, b2) {
    if(b1.constructor !== Body || b2.constructor !== Body) {console.error('Parameters must be class Body'); return false}
    return new CartesianVector(b2.x - b1.x, b2.y - b1.y).toPolarCoords().x
  }

  static bodiesAngle(b1, b2) {
    if(b1.constructor !== Body || b2.constructor !== Body) {console.error('Parameters must be class Body'); return false}
    return new CartesianVector(b2.x - b1.x, b2.y - b1.y).toPolarCoords().y
  }
}

class GravityGameRenderEngine extends GravityGame {
  constructor({
    gravityConst, canvas, fps = 60, debug, pointsLimit, debugVectors,
    x, y, scale
  } = {}) {
    super(gravityConst)
  
    if(canvas.nodeName !== 'CANVAS') {console.error('Parameter mus be Canvas Node')}
    this.#cnvs = canvas
    this.#ctx = this.#cnvs.getContext('2d')

    this.fps = fps

    this.x = x !== undefined ? x : this.#cnvs.width / 2
    this.y = y !== undefined ? y : this.#cnvs.height / 2
    scale !== undefined ? this.scale = scale : ''

    if(debug) {
      this.debug = true
      this._points = []
      this._pointsLimit = MathTools.validateNum(pointsLimit)
      this._debugVectors = MathTools.validateNum(debugVectors)
    }
  }

  _x = 0
  _y = 0
  _scale = 1
  _focusBody = null

  #cnvs = null
  #ctx = null
  #gameLoop = null
  #iterations = 0
  _fps = null

  set fps(num) {
    this._fps = MathTools.validateNum(num)
    if(this.#gameLoop !== null) this.play()
  }
  get fps() {return this._fps}

  set x(num) {this._x = MathTools.validateNum(num) + this.#cnvs.width / 2}
  get x() {return this._x}

  set y(num) {this._y = MathTools.validateNum(num) + this.#cnvs.height / 2}
  get y() {return this._y}

  set scale(num) {this._scale = MathTools.validateNum(num)}
  get scale() {return this._scale}

  set focusBody(body) {
    if(body.constructor !== Body) {console.error('Parameter must be class Body'); return}
    this._focusBody = body
  }
  removeFocus() {this._focusBody = null; this.x = 0; this.y = 0}

  drawDot(x, y, size, color) {
    [x, y, size] = MathTools.validateNum(x, y, size)

    x *= this.scale
    y *= this.scale

    x += this.x 
    y += this.y 

    this.#ctx.beginPath()
    this.#ctx.arc(x, y, size * this.scale, 0, Math.PI * 2)
    this.#ctx.fillStyle = color
    this.#ctx.fill()
  }

  drawVector(offsetX, offsetY, cartesianVector, size = 2, color = 'white') {
    [offsetX, offsetY, size] = MathTools.validateNum(offsetX, offsetY, size)
    if(cartesianVector.constructor !== CartesianVector) {console.error('Parameter must be class CartesianVector'); return}

    let x = offsetX * this.scale,
        y = offsetY * this.scale
    
    x += this.x
    y += this.y

    this.#ctx.beginPath()
    this.#ctx.moveTo(x, y)
    this.#ctx.lineTo(x + cartesianVector.x * this.scale, y + cartesianVector.y * this.scale)
    
    this.#ctx.lineWidth = size
    this.#ctx.strokeStyle = color
    this.#ctx.stroke()

    this.drawDot(offsetX + cartesianVector.x, offsetY + cartesianVector.y, size * 2, color)
  }

  drawBody(b) {
    this.drawDot(b.x, b.y, b.radius, 'white')
    
    if(this.debug) {
      this._points.push({x: b.x, y: b.y})
      if(this._points.length > this._pointsLimit) this._points.shift()

      if(this._debugVectors && b._debug) {
        let newVec = new CartesianVector().from(b.acceleration.toCartesianCoords().multiplyAbs(10))

        this.drawVector(b.x, b.y, newVec, undefined, 'orange')
        game._bodies.forEach(b2 => {
          if(b2 !== b) {
            newVec = new CartesianVector().from(game.gravityPolarVector(b, b2).toCartesianCoords().multiplyAbs(10))
            this.drawVector(b.x, b.y, newVec, undefined, 'green')
          }
        })
      }
    }
  }

  drawFrame() {
    this.#ctx.clearRect(0, 0, this.#cnvs.width, this.#cnvs.height)

    if(this._focusBody !== null) {
      this.x = -this._focusBody.x * this.scale
      this.y = -this._focusBody.y * this.scale
    }

    this.bodies.forEach(b => this.drawBody(b))

    if(this.debug) this._points.forEach(({x, y}) => this.drawDot(x, y, 50, 'white'))
  }

  play() {
    clearInterval(this.#gameLoop)
    this.#iterations = 0

    this.#gameLoop = setInterval(() => {
      this.nextFrame()
      this.drawFrame()
      this.#iterations++
    }, 1000 / this.fps)
  }

  stop() {clearInterval(this.#gameLoop); this.#gameLoop = null; this.#iterations = 0}
}