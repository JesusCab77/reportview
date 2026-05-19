var w = c.width = window.innerWidth,
    h = c.height = window.innerHeight,
    ctx = c.getContext( '2d' ),
    
    hw = w / 2,
    hh = h / 2,
    
    opts = {
        strings: [ '♡ FELIZ', 'CUMPLEAÑOS', '♡ AMOOOR ♡'],
        charSize: 38,          // Letras un poco más grandes y legibles
        charSpacing: 42,
        lineHeight: 55,
        
        cx: w / 2,
        cy: h / 2,
        
        // --- MEJORAS DE DINAMISMO (MÁS RÁPIDO Y EXPLOSIVO) ---
        fireworkPrevPoints: 6,       // Estelas más cortas y limpias
        fireworkBaseLineWidth: 3,
        fireworkAddedLineWidth: 5,
        fireworkSpawnTime: 120,      // Aparecen más rápido uno tras otro
        fireworkBaseReachTime: 15,   // Suben el doble de rápido
        fireworkAddedReachTime: 15,
        fireworkCircleBaseSize: 30,  // Explosión central más grande
        fireworkCircleAddedSize: 20,
        fireworkCircleBaseTime: 15,  // El destello inicial es más súbito
        fireworkCircleAddedTime: 15,
        fireworkCircleFadeBaseTime: 20,
        fireworkCircleFadeAddedTime: 10,
        
        fireworkBaseShards: 12,      // ¡Más chispas por explosión!
        fireworkAddedShards: 8,
        fireworkShardPrevPoints: 8,
        fireworkShardBaseVel: 7,     // Explosión inicial con mucha más fuerza
        fireworkShardAddedVel: 4,
        fireworkShardBaseSize: 2.5,
        fireworkShardAddedSize: 2.5,
        
        gravity: .25,                // Gravedad más realista para las chispas
        upFlow: -.15,                // Los globos suben con más ligereza
        letterContemplatingWaitTime: 200, // Tiempo de espera más corto para no aburrir
        
        balloonSpawnTime: 15,
        balloonBaseInflateTime: 8,
        balloonAddedInflateTime: 8,
        balloonBaseSize: 22,
        balloonAddedSize: 15,
        balloonBaseVel: .6,
        balloonAddedVel: .6,
        balloonBaseRadian: -( Math.PI / 2 - .3 ),
        balloonAddedRadian: -.6,
    },
    calc = {
        totalWidth: opts.charSpacing * Math.max( opts.strings[0].length, opts.strings[1].length, opts.strings[2].length )
    },
    
    Tau = Math.PI * 2,
    TauQuarter = Tau / 4,
    
    letters = [];

ctx.font = 'bold ' + opts.charSize + 'px Verdana';

function Letter( char, x, y ){
    this.char = char;
    this.x = x;
    this.y = y;
    
    this.dx = -ctx.measureText( char ).width / 2;
    this.dy = +opts.charSize / 2;
    
    this.fireworkDy = this.y - hh;
    
    var hue = (x + calc.totalWidth/2) / calc.totalWidth * 360;
    
    // Colores más vibrantes
    this.color = 'hsl(hue,100%,60%)'.replace( 'hue', hue );
    this.lightAlphaColor = 'hsla(hue,100%,70%,alp)'.replace( 'hue', hue );
    this.lightColor = 'hsl(hue,100%,75%)'.replace( 'hue', hue );
    this.alphaColor = 'hsla(hue,100%,60%,alp)'.replace( 'hue', hue );
    
    // Para el balanceo orgánico del globo
    this.balloonSwayOffset = Math.random() * 100;
    
    this.reset();
}

Letter.prototype.reset = function(){
    this.phase = 'firework';
    this.tick = 0;
    this.spawned = false;
    this.spawningTime = opts.fireworkSpawnTime * Math.random() |0;
    this.reachTime = opts.fireworkBaseReachTime + opts.fireworkAddedReachTime * Math.random() |0;
    this.lineWidth = opts.fireworkBaseLineWidth + opts.fireworkAddedLineWidth * Math.random();
    this.prevPoints = [ [ 0, hh, 0 ] ];
}

Letter.prototype.step = function(){
    
    if( this.phase === 'firework' ){
        
        if( !this.spawned ){
            ++this.tick;
            if( this.tick >= this.spawningTime ){
                this.tick = 0;
                this.spawned = true;
            }
        } else {
            ++this.tick;
            
            var linearProportion = this.tick / this.reachTime,
                armonicProportion = Math.sin( linearProportion * TauQuarter ),
                x = linearProportion * this.x,
                y = hh + armonicProportion * this.fireworkDy;
            
            if( this.prevPoints.length > opts.fireworkPrevPoints )
                this.prevPoints.shift();
            
            this.prevPoints.push( [ x, y, linearProportion * this.lineWidth ] );
            
            var lineWidthProportion = 1 / ( this.prevPoints.length - 1 );
            
            ctx.save();
            // Efecto Neón al subir
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            for( var i = 1; i < this.prevPoints.length; ++i ){
                var point = this.prevPoints[ i ],
                    point2 = this.prevPoints[ i - 1 ];
                    
                ctx.strokeStyle = this.alphaColor.replace( 'alp', i / this.prevPoints.length );
                ctx.lineWidth = point[ 2 ] * lineWidthProportion * i;
                ctx.beginPath();
                ctx.moveTo( point[ 0 ], point[ 1 ] );
                ctx.lineTo( point2[ 0 ], point2[ 1 ] );
                ctx.stroke();
            }
            ctx.restore();
            
            if( this.tick >= this.reachTime ){
                this.phase = 'contemplate';
                
                this.circleFinalSize = opts.fireworkCircleBaseSize + opts.fireworkCircleAddedSize * Math.random();
                this.circleCompleteTime = opts.fireworkCircleBaseTime + opts.fireworkCircleAddedTime * Math.random() |0;
                this.circleCreating = true;
                this.circleFading = false;
                
                this.circleFadeTime = opts.fireworkCircleFadeBaseTime + opts.fireworkCircleFadeAddedTime * Math.random() |0;
                this.tick = 0;
                this.tick2 = 0;
                
                this.shards = [];
                
                var shardCount = opts.fireworkBaseShards + opts.fireworkAddedShards * Math.random() |0,
                    angle = Tau / shardCount;
                
                for( var i = 0; i < shardCount; ++i ){
                    var targetAngle = angle * i + Math.random() * 0.4,
                        vx = Math.cos(targetAngle),
                        vy = Math.sin(targetAngle);
                    this.shards.push( new Shard( this.x, this.y, vx, vy, this.alphaColor ) );
                }
            }
        }
    } else if( this.phase === 'contemplate' ){
        ++this.tick;
        
        if( this.circleCreating ){
            ++this.tick2;
            var proportion = this.tick2 / this.circleCompleteTime,
                armonic = -Math.cos( proportion * Math.PI ) / 2 + .5;
            
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.fillStyle = this.lightAlphaColor.replace( 'light', 50 + 50 * proportion ).replace( 'alp', proportion * 0.6 );
            ctx.arc( this.x, this.y, armonic * this.circleFinalSize, 0, Tau );
            ctx.fill();
            ctx.restore();
            
            if( this.tick2 > this.circleCompleteTime ){
                this.tick2 = 0;
                this.circleCreating = false;
                this.circleFading = true;
            }
        } else if( this.circleFading ){
            ctx.save();
            ctx.shadowBlur = 12;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.lightColor;
            ctx.fillText( this.char, this.x + this.dx, this.y + this.dy );
            ctx.restore();
            
            ++this.tick2;
            var proportion = this.tick2 / this.circleFadeTime,
                armonic = -Math.cos( proportion * Math.PI ) / 2 + .5;
            
            ctx.beginPath();
            ctx.fillStyle = this.lightAlphaColor.replace( 'light', 100 ).replace( 'alp', (1 - armonic) * 0.4 );
            ctx.arc( this.x, this.y, this.circleFinalSize, 0, Tau );
            ctx.fill();
            
            if( this.tick2 >= this.circleFadeTime )
                this.circleFading = false;
            
        } else {
            // El texto brilla estáticamente mientras espera
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.lightColor;
            ctx.fillText( this.char, this.x + this.dx, this.y + this.dy );
            ctx.restore();
        }
        
        for( var i = 0; i < this.shards.length; ++i ){
            this.shards[ i ].step();
            if( !this.shards[ i ].alive ){
                this.shards.splice( i, 1 );
                --i;
            }
        }
        
        if( this.tick > opts.letterContemplatingWaitTime ){
            this.phase = 'balloon';
            this.tick = 0;
            this.spawning = true;
            this.spawnTime = opts.balloonSpawnTime * Math.random() |0;
            this.inflating = false;
            this.inflateTime = opts.balloonBaseInflateTime + opts.balloonAddedInflateTime * Math.random() |0;
            this.size = opts.balloonBaseSize + opts.balloonAddedSize * Math.random() |0;
            
            var rad = opts.balloonBaseRadian + opts.balloonAddedRadian * Math.random(),
                vel = opts.balloonBaseVel + opts.balloonAddedVel * Math.random();
            
            this.vx = Math.cos( rad ) * vel;
            this.vy = Math.sin( rad ) * vel;
        }
    } else if( this.phase === 'balloon' ){
        ctx.strokeStyle = this.lightColor.replace( 'light', 60 );
        ctx.lineWidth = 1.5;
        
        if( this.spawning ){
            ++this.tick;
            ctx.fillStyle = this.lightColor;
            ctx.fillText( this.char, this.x + this.dx, this.y + this.dy );
            
            if( this.tick >= this.spawnTime ){
                this.tick = 0;
                this.spawning = false;
                this.inflating = true;  
            }
        } else if( this.inflating ){
            ++this.tick;
            
            var proportion = this.tick / this.inflateTime,
                x = this.cx = this.x,
                y = this.cy = this.y - this.size * proportion;
            
            ctx.fillStyle = this.alphaColor.replace( 'alp', proportion * 0.8 );
            ctx.beginPath();
            generateBalloonPath( x, y, this.size * proportion );
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo( x, y );
            ctx.lineTo( x, this.y );
            ctx.stroke();
            
            ctx.fillStyle = this.lightColor;
            ctx.fillText( this.char, this.x + this.dx, this.y + this.dy );
            
            if( this.tick >= this.inflateTime ){
                this.tick = 0;
                this.inflating = false;
            }
        } else {
            // --- MOVIMIENTO ORGÁNICO: Balanceo usando Seno ---
            this.tick += 0.04; 
            var sway = Math.sin(this.tick + this.balloonSwayOffset) * 0.8; 
            
            this.cx += this.vx + sway;
            this.cy += this.vy += opts.upFlow;
            
            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            
            ctx.fillStyle = this.color;
            ctx.beginPath();
            generateBalloonPath( this.cx, this.cy, this.size );
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo( this.cx, this.cy );
            ctx.lineTo( this.cx, this.cy + this.size );
            ctx.stroke();
            
            ctx.fillStyle = '#fff'; // Texto blanco dentro del globo resalta más
            ctx.fillText( this.char, this.cx + this.dx, this.cy + this.dy + this.size * 0.6 );
            ctx.restore();
            
            if( this.cy + this.size < -hh || this.cx < -hw || this.cx > hw )
                this.phase = 'done';
        }
    }
}

function Shard( x, y, vx, vy, color ){
    var vel = opts.fireworkShardBaseVel + opts.fireworkShardAddedVel * Math.random();
    
    this.vx = vx * vel;
    this.vy = vy * vel;
    this.x = x;
    this.y = y;
    
    this.prevPoints = [ [ x, y ] ];
    this.color = color;
    this.alive = true;
    this.size = opts.fireworkShardBaseSize + opts.fireworkShardAddedSize * Math.random();
}

Shard.prototype.step = function(){
    this.x += this.vx;
    this.y += this.vy += opts.gravity;
    
    // Fricción del aire para simular explosión real (se frena poco a poco)
    this.vx *= 0.96;
    this.vy *= 0.96;
    
    if( this.prevPoints.length > opts.fireworkShardPrevPoints )
        this.prevPoints.shift();
    
    this.prevPoints.push( [ this.x, this.y ] );
    
    var lineWidthProportion = this.size / this.prevPoints.length;
    
    for( var k = 0; k < this.prevPoints.length - 1; ++k ){
        var point = this.prevPoints[ k ],
            point2 = this.prevPoints[ k + 1 ];
        
        ctx.strokeStyle = this.color.replace( 'alp', (k / this.prevPoints.length) * 0.8 );
        ctx.lineWidth = k * lineWidthProportion;
        ctx.beginPath();
        ctx.moveTo( point[ 0 ], point[ 1 ] );
        ctx.lineTo( point2[ 0 ], point2[ 1 ] );
        ctx.stroke();
    }
    
    if( this.prevPoints[ 0 ][ 1 ] > hh || this.prevPoints[0][0] < -hw || this.prevPoints[0][0] > hw)
        this.alive = false;
}

function generateBalloonPath( x, y, size ){
    ctx.moveTo( x, y );
    ctx.bezierCurveTo( x - size * 0.7, y - size * 0.3,
                       x - size * 0.5, y - size * 1.3,
                       x,              y - size * 1.2 );
    ctx.bezierCurveTo( x + size * 0.5, y - size * 1.3,
                       x + size * 0.7, y - size * 0.3,
                       x,              y );
}

function anim(){
    window.requestAnimationFrame( anim );
    
    // Estela de fondo ligeramente más transparente para dar efecto de velocidad
    ctx.fillStyle = 'rgba(17, 17, 17, 0.25)';
    ctx.fillRect( 0, 0, w, h );
    
    ctx.translate( hw, hh );
    
    var done = true;
    for( var l = 0; l < letters.length; ++l ){
        letters[ l ].step();
        if( letters[ l ].phase !== 'done' )
            done = false;
    }
    
    ctx.translate( -hw, -hh );
    
    if( done )
        for( var l = 0; l < letters.length; ++l )
            letters[ l ].reset();
}

// Centrado perfecto e inteligente por línea
for( var i = 0; i < opts.strings.length; ++i ){
    var lineText = opts.strings[i];
    for( var j = 0; j < lineText.length; ++j ){
        letters.push( new Letter( lineText[ j ], 
                                  j * opts.charSpacing + opts.charSpacing / 2 - (lineText.length * opts.charSpacing) / 2,
                                  i * opts.lineHeight + opts.lineHeight / 2 - (opts.strings.length * opts.lineHeight) / 2 ) );
    }
}

anim();

window.addEventListener( 'resize', function(){
    w = c.width = window.innerWidth;
    h = c.height = window.innerHeight;
    hw = w / 2;
    hh = h / 2;
    ctx.font = 'bold ' + opts.charSize + 'px Verdana';
});