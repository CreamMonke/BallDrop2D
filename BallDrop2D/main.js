const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = "400";
canvas.height = "600";

ctx.textAlign = "center";

const renderRate = 10;
const clickCooldown = 1000;
const colors = 
[
    'rgb(220, 0, 0)',
    'rgb(255, 120, 0)',
    'rgb(255, 200, 0)',
    'rgb(120, 220, 0)',
    'rgb(0, 255, 220)',
    'rgb(0, 75, 255)',
    'rgb(120, 0, 255)'
];
const colorsD = //darker varients
[
    'rgb(110, 0, 0)',
    'rgb(128, 60, 0)',
    'rgb(128, 100, 0)',
    'rgb(60, 110, 0)',
    'rgb(0, 128, 110)',
    'rgb(0, 37, 128)',
    'rgb(60, 0, 128)'
];

chrome.storage.sync.get(['high'], function(result) 
{
    if(result.high == undefined) { chrome.storage.sync.set({high: 0}); }
});

var currentColor = Math.round(Math.random()*6);

var circles = [];
var fTxt = [];
var particles = [];

var target = new Circle(Math.round(Math.random()) * 400, 550-(Math.round(Math.random()*3) * 100), 25, colorsD[currentColor]);
target.vm = Math.floor(Math.random() * 20) + 5;
target.vX = target.x > 399 ? -target.vm : target.vm;
target.vdr = Math.round((Math.random()+0.001) * 10)/100;

canvas.style.backgroundColor = colors[currentColor];
var balls = 5;
var score = 0;

var canClick = true;

function Render()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height); //clear
    
    ctx.fillStyle = colorsD[currentColor];
    ctx.font = "30px Arial";
    ctx.fillText("Score: " + score, 200, 25);
    ctx.font = "20px Arial";
    ctx.fillText("Balls: " + balls, 200, 60);

    target.update();

    for(let i = 0; i < circles.length; i++)
    { 
        circles[i].update(); 
        circles[i].vY += 9.81 / (1000/renderRate); 
        if(circles[i].y > 650){ circles.shift(); if(balls < 1) { EndGame(); return;}}

        if(circles.length != 0 && Math.abs(target.x - circles[i].x) < (target.r) && Math.abs(target.y - circles[i].y) < (target.r)) 
        { 
            currentColor = Math.round(Math.random()*6);
            canvas.style.backgroundColor = colors[currentColor];

            particles.push(new ParticleExplosion(6, new Circle(target.x, target.y, 5, colorsD[currentColor]), 3));
            setTimeout(()=>{ particles.shift(); }, 750);
            
            target = new Circle(Math.round(Math.random()) * 400, 550-(Math.round(Math.random()*3) * 100), 25, colorsD[currentColor]);
            target.vm = Math.floor(Math.random() * 20) + 5;
            target.vX = target.x > 399 ? -target.vm : target.vm;
            target.vdr = Math.round((Math.random()+0.001) * 10)/100;
            
            balls += 2;
            balls = balls > 29 ? 30 : balls;//cap
            
            let p = Math.floor(Math.random() * 100) + 35;//points
            score += p;
            fTxt.push(new FloatingText(p, 200, 0, p, colorsD[currentColor]));
        }
    }
    for(let i = 0; i < fTxt.length; i++) 
    { 
        fTxt[i].color = colorsD[currentColor]; 
        fTxt[i].update(); 
        if(fTxt[i].s < 1){ fTxt.shift(); }
    }
    for(let i = 0; i < particles.length; i++) { particles[i].update(); }
}
var loop = window.setInterval(Render, renderRate);

canvas.addEventListener('click', function(evt) 
{ 
    if(balls < 1 || !canClick){return;}
    canClick = false;
    setTimeout(() => { canClick = true; }, clickCooldown);
    circles.push(new Circle(evt.clientX - canvas.getBoundingClientRect().left, 0, 20, "black")); 
    balls--;
    if(balls == 1) { fTxt.push(new FloatingText("One Ball Remaining!", 200, 100, 50, colorsD[currentColor])); }
});
document.addEventListener('keydown', function(event)
{
    if(event.keyCode == '82'){ //r
        window.location.reload(true);
    }
});
function EndGame()
{
    window.clearInterval(loop);

    ctx.clearRect(0, 0, canvas.width, canvas.height); //clear
    
    ctx.fillStyle = colorsD[currentColor];
    ctx.font = "30px Arial";
    ctx.fillText("Score: " + score, 200, 25);
    ctx.font = "20px Arial";
    ctx.fillText("Balls: " + balls, 200, 60);

    ctx.font = "70px Arial";
    ctx.fillText("Game Over!", 200, 200);
    ctx.font = "20px Arial";
    ctx.fillText("You Have Run Out of Balls.", 200, 250);
    ctx.fillText("Press R to Retry.", 200, 270);

    chrome.storage.sync.get(['high'], function(result) 
    {
        ctx.font = "20px Arial";
        if(result.high < score)
        {
            ctx.fillText("New High Score of " + score + "!", 200, 340);
            ctx.fillText("Your Previous High Score Was: " + result.high, 200, 360);
            chrome.storage.sync.set({high: score});
        }
        else
        {
            ctx.fillText("No New High Score.", 200, 340);
            ctx.fillText("Your Current High Score Is: " + result.high, 200, 360);
        }
        return;
    });
}

function FloatingText(text, x, y, s, color)
{
    this.text = text;
    this.x = x;
    this.y = y;
    this.s = s;
    this.color = color;

    this.v = 2;//velocity
    this.sr = 0.5;//shrink rate

    this.update = function()
    {
        this.y += this.v;
        this.s -= this.sr;

        ctx.fillStyle = this.color;
        ctx.font = this.s + "px Arial";
        ctx.fillText(this.text, this.x, this.y);
    }
}

function Circle(x, y, r, color)
{
    this.x = x;
    this.y = y;
    this.r = r;
    this.color = color;

    this.vY = 0;//velocity
    
    //Target:
    this.vX = 0;
    this.vm = 0;//velocity max
    this.vdr = 0;//velocity decrease rate
    
    this.update = function()
    {
        this.y += this.vY;
        this.x += this.vX;

        this.vX = this.vX > 1 ? this.vX-this.vdr : this.vX < -1 ? this.vX+this.vdr : this.vm;
        let dir = 1;
        if(this.x > 399){ this.x = 399; dir = -1; }
        else if(this.x < 1){ this.x = 1; dir = -1; }
        this.vX *= dir; this.vm *= dir;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    this.copy = function() { return new Circle(x, y, r, color) }
}

function ParticleExplosion(amount, shape, speed)
{
    this.amount = amount;
    this.shape = shape;
    this.speed = speed;
    
    this.shapes = [];

    for(let i = 0; i < this.amount; i++){
        this.shapes.push(this.shape.copy());
    }
    
    this.update = function()
    {
        let l = this.shapes.length;
        for(let i = 0; i < l; i++)
        {
            this.shapes[i].vX = Math.cos(i) * this.speed;
            this.shapes[i].vY = Math.sin(i) * this.speed;
            this.shapes[i].update();
        }
    }
}