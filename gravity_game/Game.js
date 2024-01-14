
class Body {
  constructor({
    x = 0, y = 0, mass = 1, radius = 1, force = 0, angle = 0, id = '',
    debug, debugVectors
  } = {}) {
    [x, y, mass, radius, force, angle] = MathTools.validateNum(x, y, mass, radius, force, angle)

    this._x = x
    this._y = y
    this._mass = mass
    this._radius = radius
    this._acceleration = new PolarVector(force, angle)

    if(id !== '' && typeof id === 'string') this._id = id
    if(debug) {
      this._debug = {}
      this._debug._orbit = []

      if(debugVectors) this._debug._debugVectors = true
    }
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
  constructor({gravityConst, speed} = {}) {
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
    return this.gravityConst * (b1.mass * b2.mass) / GravityGame.bodiesDistance(b1, b2)**2
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
    gravityConst, canvas, fps = 60,
    debug, pointsLimit, debugVectors,
    x, y, scale, mapViewBodyRadius
  } = {}) {
    super(gravityConst)
  
    if(canvas.nodeName !== 'CANVAS') {console.error('Parameter mus be Canvas Node')}
    this.#cnvs = canvas
    this.#ctx = this.#cnvs.getContext('2d')

    this.fps = fps

    x !== undefined ? this.offsetX = x : ''
    y !== undefined ? this.offsetY = y : ''
    scale !== undefined ? this.scale = scale : ''

    mapViewBodyRadius !== undefined ? this.mapViewBodyRadius = MathTools.validateNum(mapViewBodyRadius) : ''

    if(debug) {
      this._debug = {}

      if(debugVectors) this._debug._debugVectors = true

      this._debug._pointsLimit = MathTools.validateNum(pointsLimit)
    }

    this.setHotkeys()
  }

  _x = 0
  _y = 0
  _offsetX = 0
  _offsetY = 0
  _scale = 1
  _focusBody = null
  _mapViewBodyRadius = 0

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

  set mapViewBodyRadius(num) {this._mapViewBodyRadius = MathTools.validateNum(num)}
  get mapViewBodyRadius() {return this._mapViewBodyRadius}

  set offsetX(num) {
    num = MathTools.validateNum(num)
    this._offsetX = num
    this._x = num

    if(this.focusBody !== null) this._x += this.focusBody.x
    this.drawFrame()
  }
  get offsetX() {return this._offsetX}

  set offsetY(num) {
    num = MathTools.validateNum(num)
    this._offsetY = num
    this._y = num

    if(this.focusBody !== null) this._y += this.focusBody.y
    this.drawFrame()
  }
  get offsetY() {return this._offsetY}

  getScaledX(x) {
    x = MathTools.validateNum(x)

    x = (x - (this.#cnvs.width/2 - this._x)) * this.scale
    x += this._x + (this.#cnvs.width/2 - this._x)

    return x
  }
  getScaledY(y) {
    y = MathTools.validateNum(y)

    y = (y - (this.#cnvs.height/2 - this._y)) * this.scale
    y += this._y + (this.#cnvs.height/2 - this._y)

    return y
  }
  getScaledSize(size) {return size * this.scale}

  set scale(num) {
    this._scale = MathTools.validateNum(num)
    this.drawFrame()
    sessionStorage.gameScale = this._scale
  }
  get scale() {return this._scale}

  get focusBody() {return this._focusBody}
  set focusBody(body) {
    if(body.constructor !== Body) {console.error('Parameter must be class Body'); return}
    this._focusBody = body
    this.drawFrame()
  }
  removeFocus() {this._focusBody = null; this.drawFrame()}

  drawDot(x, y, size, color) {
    [x, y, size] = MathTools.validateNum(x, y, size)

    this.#ctx.beginPath()
    this.#ctx.arc(this.getScaledX(x), this.getScaledY(y), this.getScaledSize(size), 0, Math.PI * 2)
    this.#ctx.fillStyle = color
    this.#ctx.fill()
  }

  drawVector(offsetX, offsetY, cartesianVector, size = 2, color = 'white') {
    [offsetX, offsetY, size] = MathTools.validateNum(offsetX, offsetY, size)
    if(cartesianVector.constructor !== CartesianVector) {console.error('Parameter must be class CartesianVector'); return}

    const x = this.getScaledX(offsetX), y = this.getScaledY(offsetY),
          vecX = this.getScaledSize(cartesianVector.x),
          vecY = this.getScaledSize(cartesianVector.y)

    this.#ctx.beginPath()
    this.#ctx.moveTo(x, y)
    this.#ctx.lineTo(x + vecX, y + vecY)
    
    this.#ctx.lineWidth = size
    this.#ctx.strokeStyle = color
    this.#ctx.stroke()

    this.drawDot(offsetX + cartesianVector.x, offsetY + cartesianVector.y, size / this.scale, color)
  }

  drawBody(b) {
    const drawRadius = this.scale * b.radius < this.mapViewBodyRadius ? this.mapViewBodyRadius / this.scale : b.radius
    this.drawDot(b.x, b.y, drawRadius, 'white')
    
    if(this._debug && b._debug) {

      if(this._debug._debugVectors && b._debug._debugVectors) {
        let newVec = new CartesianVector().from(b.acceleration.toCartesianCoords().multiplyAbs(10))

        this.drawVector(b.x, b.y, newVec, undefined, 'orange')
        game._bodies.forEach(b2 => {
          if(b2 !== b) {
            newVec = new CartesianVector().from(game.gravityPolarVector(b, b2).toCartesianCoords().multiplyAbs(10))
            this.drawVector(b.x, b.y, newVec, undefined, 'green')
          }
        })
      }

      b._debug._orbit.push({x: b.x, y: b.y})
      if(b._debug._orbit.length > this._debug._pointsLimit) b._debug._orbit.shift()

      this.#ctx.beginPath()
      this.#ctx.moveTo(this.getScaledX(b._debug._orbit[0].x), this.getScaledY(b._debug._orbit[0].y))
      b._debug._orbit.forEach(({x, y}) => this.#ctx.lineTo(this.getScaledX(x), this.getScaledY(y)))
      this.#ctx.strokeStyle = 'rgba(255, 255, 255, .5)'
      this.#ctx.lineWidth = 1
      this.#ctx.stroke()
    }
  }

  drawFrame() {
    this.#ctx.clearRect(0, 0, this.#cnvs.width, this.#cnvs.height)

    if(this._focusBody !== null) {
      this._x = -this._focusBody.x + this.#cnvs.width/2 + this.offsetX
      this._y = -this._focusBody.y + this.#cnvs.height/2 + this.offsetY
    }

    this.bodies.forEach(b => this.drawBody(b))
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

  setHotkeys() {
    let moveCameraX = 0,
        moveCameraY = 0,
        thisX = 0,
        thisY = 0,
        focusBodyIndex = -1

    function setCoords(e) {
      this.offsetX = (e.offsetX - moveCameraX) / this.scale + thisX
      this.offsetY = (e.offsetY - moveCameraY) / this.scale + thisY
      this.drawFrame()
    }
    setCoords = setCoords.bind(this)

    this.#cnvs.addEventListener('mousedown', e => {
      if(e.button === 1) {
        moveCameraX = e.offsetX
        moveCameraY = e.offsetY
        thisX = this.offsetX
        thisY = this.offsetY

        this.#cnvs.addEventListener('mousemove', setCoords)
      }
    })

    this.#cnvs.addEventListener('mouseup', e => {
      if(e.button === 1) this.#cnvs.removeEventListener('mousemove', setCoords)
    })

    this.#cnvs.addEventListener('wheel', e => {
      if(e.deltaY < 0) this.scale *= 2
      else if(e.deltaY > 0) this.scale /= 2
      this.drawFrame()
    })

    document.body.addEventListener('keydown', e => {
      switch(e.key) {
        case ',': {
          if(this.bodies.length !== 0) {
            if(this.bodies[--focusBodyIndex] === undefined) focusBodyIndex = this.bodies.length - 1
            this.focusBody = this.bodies[focusBodyIndex]
            this.offsetX = 0
            this.offsetY = 0
          }
          break
        }
        case '.': {
          if(this.bodies.length !== 0) {
            if(this.bodies[++focusBodyIndex] === undefined) focusBodyIndex = 0
            this.focusBody = this.bodies[focusBodyIndex]
            this.offsetX = 0
            this.offsetY = 0
          }
          break
        }
        case '`': {
          this.removeFocus()
          break
        }
      }

      // console.log(e)
    })
  }
}