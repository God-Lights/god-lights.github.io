const kboTeam = {
    "키움":"WO",
    "LG":"LG",
    "KT":"KT",
    "KIA":"HT",
    "두산":"OB",
    "NC":"NC",
    "삼성":"SS",
    "롯데":"LT",
    "한화":"HH",
    "SSG":"SK"
}


const kboScrollData = {
    "leId":1,
    "srId":0,
    "seasonId":2024,
    "gameId":"20240930WOSK0"
};
function fop(season, month, day, hometeam, awayteam, le, sr) {
    var m = "";
    var d = "";
    kboScrollData["leId"] = Number(le);
    kboScrollData["srId"] = Number(sr);
    kboScrollData["seasonId"] = Number(season);
    if(Number(month) < 10) {
        m = `0${month}`;
    } else {
        m = month;
    }
    if(Number(day) < 10) {
        d = `0${day}`;
    } else {
        d = day;
    }
    kboScrollData["gameId"] = season+m+d+hometeam+awayteam+"0";
    return kboScrollData;
}

function selectTeam() {
    var sel = document.getElementById('team');
    return sel;
}
function fo() {
    var foo = document.getElementById('fo');
    foo.innerHTML = selectTeam().value;
    requestAnimationFrame(fo);
    if(selectTeam().value == 'WO') {
        document.body.class = "WO";
    } else {
        document.body.class = "";
    }
}
window.oncontextmenu=function() {
    return false;
}