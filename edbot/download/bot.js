var DB_PATH = "/sdcard/edbot/rpg_db.json";
var CONFIG_PATH = "/sdcard/edbot/config.json";

var CONFIG = JSON.parse(FileStream.read(CONFIG_PATH));

var DB = JSON.parse(FileStream.read(DB_PATH));
if(!DB) {
    DB = {
        now: new Date().getTime(),
        users:{},
        hunting:false,
        createdAt: new Date().getTime(),
        lastUpdatedTime: new Date().getTime()
    };
}
if(!DB.users) DB.users = {};
if(!DB.hunts) DB.hunts = {};
if(!DB.createdAt) DB.createdAt = new Date().getTime();
if(!DB.lastUpdatedTime) DB.lastUpdatedTime = new Date().getTime;

FileStream.write(DB_PATH,JSON.stringify(DB,null,4));

var ITEMS = JSON.parse(FileStream.read("/sdcard/edbot"+CONFIG.root.item));
var MONSTERS = JSON.parse(FileStream.read("/sdcard/edbot"+CONFIG.root.monster));
var SHOPS = JSON.parse(FileStream.read("/sdcard/edbot"+CONFIG.root.shop));

/* ====================================
              GAME LOGIC
==================================== */

function newUser(username) {
    if(DB.users[username]) return null;
    DB.users[username] = {
        level: 1,
        exp: 0,
        coin: 100,
        attack: 7,
        defense: 5,
        equip: {
            sword: null,
            shield: null
        },
        inv: [],
        hp: 100,
        maxHp: 100,
        lastAdventureTime: 0,
        lastAttemptTime: 0
    }
    FileStream.write(DB_PATH,JSON.stringify(DB,null,4));
    return DB.users[username];
}

function coinDrop(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min)
}


/* ==================
   ITEM DROP LOGIC
================== */

function getItemId(name) {
    for(var key in ITEMS) {
        if(ITEMS[key].name === name) {
            return key;
        }
    }
    return name;
}

function getItemName(id) {
    return ITEMS[id].name || id;
}

function dropItem(dropData,player) {
    var drop = [];
    for(var i of dropData) {
        var rand = Math.random()*100;
        var c = 0;
        if(rand < i.w) {
            if(Array.isArray(i.count)) {
                c = Math.floor(Math.random()*(i.count[1]-i.count[0]+1)+i.count[0]);
            } else if(typeof i.count === "number") {
                c = i.count;
            }
            var foundIndex = -1;
            for(var j = 0; j < player.inv.length; j++) {
                var invItem = player.inv[j];
                if(invItem.id === i.id && JSON.stringify(invItem.meta) === JSON.stringify(i.meta)) {
                    foundIndex = j;
                    break;
                }
            }
            if(foundIndex > -1) {
                player.inv[foundIndex].count += c;
            } else {
                player.inv.push({
                    id: i.id,
                    count: c,
                    meta: i.meta
                });
            }
            drop.push(getItemName(i.id));
        }
    }
    return drop;
}

function getRandomMonsterByLevel(level) {
    var monster = [];
    for(var key in MONSTERS) {
        if(MONSTERS[key].level === level) {
            monster.push(key);
        }
    }
    if(monster > 0) {
        return monster[Math.floor(Math.random()*monster.length)];
    }
    return level;
}

function effect(user,id, value) {
    if(id === "heal") {
        user.hp += value;
        if(user.hp > user.maxHp) {
            user.hp = user.maxHp;
        }
        return true;
    }
    if(id === "hunger") {
        user.hp -= value;
        if(user.hp <= 0) {
            user.hp = 1;
        }
    }
}

function usingItem(user,item) {
    if(item.type === "potion" || item.type === "food") {
        for(var i of item.effect) {
            var rand = Math.random()*100;
            if(rand < i.w) {
                return effect(user,i.id,i.value);
            }
        }
        return false;
    }
}

function calcDamage(attack, defense) {
    // 1. 기본 데미지 계산 (공격력 - 방어력)
    var baseDamage = attack - defense;

    // 2. 데미지가 0보다 낮아지지 않도록 설정
    if (baseDamage < 0) baseDamage = 0;

    // 3. 랜덤 변동폭 적용 (예: 기본 데미지의 90% ~ 110% 사이)
    // 0.9 ~ 1.1 사이의 난수를 생성하여 곱함
    var variance = 0.1; // 10% 변동폭
    var randomMultiplier = (1 - variance) + (Math.random() * variance * 2);
    
    var finalDamage = Math.round(baseDamage * randomMultiplier);

    return finalDamage;
}

function getRandomDialogue(monster,type) {
    var d = monster.dialogue[type];
    return d[Math.floor(Math.random()*d.length)];
}

function getMedalInPlayer(player, name) {
    if(!player || !getMedal(name)) return null;
    var index = player.inv.findIndex(item => item.id === "medal" && item.meta.medal === name && item.count > 0);
    if(index !== -1) {
        var item = player.inv[index];
        return item;
    }
    return null;
}

function getItemById(player, id) {
    if(!player || !player.inv) return null;
    var index = player.inv.findIndex(item => item.id === id && item.type !== "medal");
    if(index !== -1) {
        return index
    }
    return null;
}

function getMedal(name) {
    if(!CONFIG.medal[name]) return null;
    return CONFIG.medal[name];
}

//response function
function response(room, msg, sender, isGroupChat, replier) {
    DB.now = new Date().getTime();
    if(msg === "$가입") {
        var u = newUser(sender);
        if(!u) {
            replier.reply("이미 가입된 사용자입니다.");
            return;
        }
        replier.reply("가입을 축하드립니다!\n"+edbot.getName()+"(을)를 잘 이용해주세요!\n$도움을 통해 명령어를 확인할 수 있습니다!")
        return;
    }
    if(msg === "$모험") {
        if(!DB.users[sender]) {
            replier.reply("먼저 가입해주세요!");
            return;
        }
        if(DB.now - DB.users[sender].lastAdventureTime < CONFIG.system.AdventureCooldown*1000) {
            var remainTime = DB.now - DB.users[sender].lastAdventureTime;
            replier.reply("아직 모험할 시간이 아닙니다!\n모험까지 남은 시간: "+remainTime+"초");
            return;
        }
        replier.reply("모험 시작!");
        var item = dropItem(CONFIG.loot.adventure.item,DB.users[sender]);
        if(item.length >= 1) {
            replier.reply("모험중에... "+item.join(", ")+"(을)를 얻었다!");
        }
        var getCoin = coinDrop(CONFIG.loot.adventure.coin[0],CONFIG.loot.adventure.coin[1]);
        DB.users[sender].coin += getCoin;
        replier.reply("그러고 모험은 끝이 났다. (얻은 코인: "+getCoin+")");
        DB.users[sender].lastAdventureTime = DB.now;
        FileStream.write(DB_PATH,JSON.stringify(DB,null,4));
    }
    if(msg.startsWith("$판매 ")) {
        if(!DB.users[sender]) {
            replier.reply("먼저 가입해주세요!");
            return;
        }
        var sell = msg.replace(/^\$판매\s*/, "");
        if(sell.startsWith("메달:")) {
            replier.reply("메달은 판매할 수 없습니다!");
            return;
        }
        var item = DB.users[sender].inv[getItemById(DB.users[sender],(getItemId(sell) || ""))];
        if(!item || item.count === 0) {
            replier.reply("그런 아이템을 가지고 있지 않습니다!");
            return;
        }
        if(!SHOPS.sell[item.id]) {
            replier.reply("그 아이템은 팔 수 없습니다!");
            return;
        }
        item.count -= 1;
        DB.users[sender].coin += SHOPS.sell[item.id];
        replier.reply("아이템을 팔았다! 얻은코인: "+SHOPS.sell[item.id]);
    }
    if(msg.startsWith("$구매 ")) {
        if(!DB.users[sender]) {
            replier.reply("먼저 가입해주세요!");
            return;
        }
        var sell = msg.replace(/^\$구매\s*/, "");
        if(sell.startsWith("메달:")) {
            replier.reply("메달은 구매할 수 없습니다!");
            return;
        }
        var item = SHOPS.buy[getItemId(sell)];
        if(!item) {
            replier.reply("그 아이템은 살 수 없습니다!");
            return;
        }
        if(item > DB.users[sender].coin) {
            replier.reply("잔액 부족: "+DB.users[sender].coin);
            return;
        }
        DB.users[sender].coin -= item;
        dropItem([{
            id: getItemId(sell),
            w: 100,
            count: 1
        }],DB.users[sender]);
        replier.reply("구매 완료! 잔액: "+DB.users[sender].coin);
    }
    if(msg.startsWith("$사용 ")) {
        if(!DB.users[sender]) {
            replier.reply("먼저 가입해주세요!");
            return;
        }
        var use = msg.replace(/^\$사용\s*/, "");
        if(sell.startsWith("메달:")) {
            replier.reply("메달은 사용할 수 없습니다!");
            return;
        }
        var item = DB.users[sender].inv[getItemById(DB.users[sender],getItemId(use || ""))];
        if(!item || item.count === 0) {
            replier.reply("그런 아이템을 갖고 있지 않습니다!");
            return;
        }
        if(item.type !== "potion" && item.type !== "food" && item.type !== "bundle") {
            replier.reply("사용 가능한 아이템이 아닙니다!");
            return;
        }
        var useItem = usingItem(DB.users[sender],item);
        replier.reply("아이템 사용 완료! 뭔가 달라진 것 같다!");
        if(useItem) {
            replier.reply("효과 발동!");
            return;
        }
        replier.reply("효과가 발동되지 않았다!");
    }
    if(msg === "$내정보") {
        if(!DB.users[sender]) return;
        var u = DB.users[sender];
        var message = sender+"님의 정보\n";
        message += "골드: "+u.coin+"\n";
        message += "공격력: "+u.attack+", 방어력: "+u.defense+"\n";
        message += "장착 아이템: (검="+(u.equip.sword || "없음")+",방패="+(u.equip.shield || "없음")+")\n";
        message += "HP: "+u.hp+"/"+u.maxHp+"\n";
        message += "인벤:\n";
        u.inv.forEach((inventory) => {
            if(inventory.count > 0) {
                if(!inventory.meta.medal) {
                    message += "\t"+getItemName(inventory.id)+" x"+inventory.count+"\n";
                }
            }
        });
    }
    if(msg.startsWith("$장착 ")) {
        if(!DB.users[sender]) {
            replier.reply("먼저 가입해주세요!");
            return;
        }
        var eq = msg.replace(/^\$장착\s*/, "");
        if(eq.startsWith("메달:")) {
            replier.reply("메달은 장착할 수 없습니다!");
            return;
        }
        var item = DB.users[sender].inv[getItemById(DB.users[sender],(getItemId(sell) || ""))];
        if(!item || item.count === 0) {
            replier.reply("그런 아이템을 가지고 있지 않습니다!");
            return;
        }
        var itemType = null;
        if(ITEMS[item.id].type === "sword" || ITEMS[item.id].type === "shield") {
            itemType = ITEMS[getItemId(eq)].type
        }
        if(!itemType) {
            replier.reply("그 아이템은 장착이 가능한 아이템이 아닙니다!");
            return;
        }
        var formerId = DB.users[sender].equip[itemType];
        if(formerId) {
            DB.users[sender].attack -= ITEMS[formerId].atk;
            DB.users[sender].defense -= ITEMS[formerId].def;
            dropItem({
                id: formerId,
                w: 100,
                count: 1
            }, sender);
            DB.users[sender].equip[itemType] = null;
        }
        DB.users[sender].equip[itemType] = item.id;
        DB.users[sender].attack += ITEMS[item.id].atk;
        DB.users[sender].defense += ITEMS[item.id].def;
        item.count -= 1;
        replier.reply("아이템 장착 완료! 뭔가 더 세진것 같은데?");
    }
    if(msg.startsWith("$메달")) {
        if(msg === "$메달") {
            replier.reply("여기에선 메달 각각의 정보만 확인할 수 있습니다!\n사용법: $메달 (메달:)<메달이름>");
            return;
        }
        var raw = msg.replace(/^\$메달\s*/, "");
        if(raw.startsWith("메달:")) {
            raw = msg.replace(/^\$메달:\s*/, "");
        }
        var medal = getMedal(raw);
        if(!medal) {
            replier.reply("그런 메달은 없습니다!");
            return;
        }
        var item = getMedalInPlayer(sender,raw);
        if(!item) {
            replier.reply("그 메달을 소지하고 있지 않습니다!");
            return;
        }
        var info = "";
        info += "메달: "+raw+"\n";
        info += "설명: "+medal.description+"\n";
        info += "희귀도: "+medal.value+"\n";
        info += "얻은 대상: "+medal.by;
        replier.reply(info);
    }
    if(msg === "$-----피회복") {
        if(!CONFIG.admins.includes(sender)) return;
        if(!DB.users[sender]) {
            replier.reply("먼저 가입해주세요!");
            return;
        }
        if(DB.hunting) {
            replier.reply("헌팅중엔 피회복이 안됩니다!");
            return;
        }
        DB.users[sender].hp = DB.users[sender].maxHp;
        replier.reply("피회복 완료!");
    }
    if(msg === "$사냥") {
        if(DB.hunting) return;
        DB.hunting = true;
        var monster = getRandomMonsterByLevel("grunt");
        replier.reply("앗 야생의 "+monster.name+"(을)를 만났다!\n몬스터: "+getRandomDialogue(monster,"encounter"));
        replier.reply("⚔️자동전투 진행!");
        while(DB.hunting) {
            var message = "\n";
            var mDamage = calcDamage(DB.users[sender].attack,monster.defense);
            monster.hp -= mDamage;
            if(monster.hp < 0) monster.hp = 0;
            message += "플레이어 공격! "+mDamage+"만큼의 데미지를 주었다!\n";
            message += "몬스터 남은 체력: "+monster.hp+"/"+monster.maxHp;

            if(monster.hp === 0) {
                replier.reply(message);
                var winMessage = "신난다! "+monster.name+"(을)를 잡았다!\n";
                winMessage += "몬스터: "+getRandomDialogue(monster,"win");
                var drop = dropItem(monster.drop,sender);
                if(drop.length > 0) {
                    winMessage += "\n얻은 물건: "+drop;
                }
                var coin = coinDrop(50,150);
                DB.users[sender].coin += coin;
                winMessage += "\n얻은 코인: "+coin;
                replier.reply(winMessage);
                huntProcessing = false;
                break;
            }

            var pDamage = calcDamage(monster.attack,DB.users[sender].defense);
            DB.users[sender].hp -= pDamage;
            if(DB.users[sender].hp < 0) DB.users[sender].hp = 0;
            message += "\n\n몬스터 공격! "+pDamage+"만큼의 데미지를 받았다!\n";
            message += "플레이어 남은 체력: "+DB.users[sender].hp+"/"+DB.users[sender].maxHp;

            if(DB.users[sender].hp === 0) {
                replier.reply(message);
                var loseMessage = "앗! 쓰러지고 말았다!\n";
                loseMessage += "몬스터: "+getRandomDialogue(monster,"lose");
                DB.users[sender].hp = DB.users[sender].maxHp;
                loseMessage += "\n피는 자동회복되었다!";
                replier.reply(loseMessage);
                huntProcessing = false;
                break;
            }
            replier.reply(message);
        }
        DB.hunting = false;
    }
    if(msg === "$헌팅") {
        if(DB.hunting) return;
        DB.hunting = true;
        var monster = getRandomMonsterByLevel(Math.random*100 < 66.6 ? "common" : "rare");
        replier.reply("앗 야생의 "+monster.name+"(을)를 만났다!\n몬스터: "+getRandomDialogue(monster,"encounter"));
        replier.reply("⚔️자동전투 진행!");
        while(DB.hunting) {
            var message = "\n";
            var mDamage = calcDamage(DB.users[sender].attack,monster.defense);
            monster.hp -= mDamage;
            if(monster.hp < 0) monster.hp = 0;
            message += "플레이어 공격! "+mDamage+"만큼의 데미지를 주었다!\n";
            message += "몬스터 남은 체력: "+monster.hp+"/"+monster.maxHp;

            if(monster.hp === 0) {
                replier.reply(message);
                var winMessage = "신난다! "+monster.name+"(을)를 잡았다!\n";
                winMessage += "몬스터: "+getRandomDialogue(monster,"win");
                var drop = dropItem(monster.drop,sender);
                if(drop.length > 0) {
                    winMessage += "\n얻은 물건: "+drop;
                }
                var coin = coinDrop(50,150);
                DB.users[sender].coin += coin;
                winMessage += "\n얻은 코인: "+coin;
                replier.reply(winMessage);
                DB.hunting = false;
                break;
            }

            var pDamage = calcDamage(monster.attack,DB.users[sender].defense);
            DB.users[sender].hp -= pDamage;
            if(DB.users[sender].hp < 0) DB.users[sender].hp = 0;
            message += "\n\n몬스터 공격! "+pDamage+"만큼의 데미지를 받았다!\n";
            message += "플레이어 남은 체력: "+DB.users[sender].hp+"/"+DB.users[sender].maxHp;

            if(DB.users[sender].hp === 0) {
                replier.reply(message);
                var loseMessage = "앗! 쓰러지고 말았다!\n";
                loseMessage += "몬스터: "+getRandomDialogue(monster,"lose");
                DB.users[sender].hp = DB.users[sender].maxHp;
                loseMessage += "\n피는 자동회복되었다!";
                replier.reply(loseMessage);
                DB.hunting = false;
                break;
            }
            replier.reply(message);
        }
        DB.hunting = false;
    }
    if(msg === "$보스잡기") {
        //var monster = getRandomMonsterByLevel("boss");
        replier.reply("아직 안만듬");
    }
    if(CONFIG.admins.includes(sender)) {
        if(msg.startsWith("$랜덤지급 ")) {
            var count = msg.replace(/^\$랜덤지급\s*/, "");
            var key = Object.keys(DB.users);
            for(var i = 0; i < count; i++) {
                var congrat = key[Math.floor(Math.random()*key.length)];
                var drop = dropItem(CONFIG.loot.roulette,DB.users[congrat]);
                replier.reply("당첨! "+congrat+".\n"+drop.join(", ")+" 획득!")
            }
            replier.reply("Rmx.");
        }
        if(msg === "$헌팅리셋") {
            DB.hunting = false;
            replier.reply("성공적으로 리셋됨.");
        }
    }
}