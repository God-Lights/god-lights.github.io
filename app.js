const canvas = document.getElementById("jsCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1080;
canvas.height = 720;

ctx.strokeStyle = "white";
ctx.lineWidth = 2.5;

let painting = false;

window.oncontextmenu=function() {
    return false;
}

function startPainting(e) {
    if(e.button === 2 || e.which === 3) {
        ctx.strokeStyle = "darkgreen";
        ctx.lineWidth = 10;
        painting = true;
    } else {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2.5;
        painting = true;
    }
}
function stopPainting(event) {
    painting=false;
}

function onMouseMove(event) {
    const x = event.offsetX;
    const y = event.offsetY;
    if(!painting) {
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    else {
        ctx.lineTo(x, y);
        ctx.stroke();
    }
}

if (canvas) {
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", startPainting);
    canvas.addEventListener("mouseup", stopPainting);
    canvas.addEventListener("mouseleave", stopPainting);
}