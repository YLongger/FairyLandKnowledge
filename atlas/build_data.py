# -*- coding: utf-8 -*-
"""Build atlas/data.js from local 典藏 data + the original Geocities worldmap catalog."""
from __future__ import print_function
import json, re, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent

REGIONS = [
    {"id": "mainland", "n": "主大陸", "en": "The Continent", "tone": "pine",
     "d": "人類、精靈、矮人三族的出生之地。徐大少手繪全圖，迷宮另見各點。"},
    {"id": "mermaid", "n": "人魚傳說", "en": "Mermaid Tales", "tone": "water",
     "d": "從貝伯港出航，進入史蓋窩克海與群島。"},
    {"id": "alice", "n": "愛麗絲夢遊仙境", "en": "Alice", "tone": "rose",
     "d": "夢想花園一路走到撲克花園，門之迷宮藏在花園底下。"},
    {"id": "nights", "n": "一千零一夜", "en": "1001 Nights", "tone": "sand",
     "d": "巴斯拉、巴格達與沙漠群島，空域與古墓交錯。"},
    {"id": "clothes", "n": "國王的新衣", "en": "New Clothes", "tone": "gold",
     "d": "瓦尼島之下，二十二層地下遺跡。"},
    {"id": "oz", "n": "綠野仙蹤", "en": "Oz", "tone": "emerald",
     "d": "從彩花村走到翡翠城，再入黑森林與威奇迷宮。"},
    {"id": "thumb", "n": "拇指姑娘", "en": "Thumbelina", "tone": "moss",
     "d": "木偶山山腳向下，罐頭地道通往拇指花園與夢奇地。"},
    {"id": "beast", "n": "美女與野獸", "en": "Beauty & Beast", "tone": "wine",
     "d": "風之谷、羊角村，穿過沙漠抵達普諾特古堡。"},
    {"id": "momo", "n": "桃太郎", "en": "Momotaro", "tone": "peach",
     "d": "桃花村出海：鬼島、霧張、龍宮三條路線。"},
    {"id": "candy", "n": "糖果屋", "en": "Candy House", "tone": "ice",
     "d": "登山小徑通向葛雷夏與凍原；轉生神殿獨立在側。"},
]

# id, name, aliases, region, kind, x, y, links, page, img, blurb
# x,y = percent on that region's canvas
P = []
def add(*a):
    P.append(a)

# ----- 主大陸：座標對齊 site/htm/map/test.htm 熱區中心 -----
add("jean", "吉恩村", ["人類新手村"], "mainland", "village", 53.0, 43.4,
    ["north_green", "south_green", "frog"], "copy/map2.htm#1", None,
    "人類出生村。北接北綠野、南接南綠野、東南青蛙沼澤，村內可學大多數工作技能。")
add("north_green", "北綠野", ["北綠"], "mainland", "field", 43.5, 35.6,
    ["jean", "rainbow", "slime"], "htm/map/n.htm", "htm/map/map/north.jpg",
    "吉恩村北郊，等級約 4–9，新手練功首選。")
add("slime", "史萊姆迷宮", ["史來姆迷宮", "史萊姆洞窟", "史來姆迷宮"], "mainland", "dungeon", 41.0, 30.8,
    ["north_green"], "htm/map/s1.htm", "htm/map/s1.jpg",
    "藏在北綠野裡的三層迷宮，原大地圖不標示迷宮，點名冊才找得到。")
add("south_green", "南綠野", ["南綠"], "mainland", "field", 42.6, 51.6,
    ["jean", "west_green"], "htm/map/s.htm", "htm/map/map/so.jpg",
    "吉恩村南郊，幻獸約十級起跳，比北綠野硬一截。")
add("frog", "青蛙沼澤", [], "mainland", "field", 71.0, 62.9,
    ["jean", "mystery", "lamp"], "htm/map/fog.htm", "htm/map/map/fog.jpg",
    "吉恩東南的濕地，通往神秘洞窟，再往南是神燈沙漠。")
add("mystery", "神秘洞窟", ["神秘迷宮"], "mainland", "dungeon", 74.2, 58.6,
    ["frog"], "htm/map/wa.htm", "htm/map/wa.jpg",
    "青蛙沼澤內的洞窟。")
add("rainbow", "彩虹城", ["首都"], "mainland", "city", 34.2, 36.9,
    ["north_green", "west_green", "lettuce", "smile", "rainbow_mz", "town_base"], "copy/map2.htm#4", None,
    "人類首都。西綠野、萵苣村、微笑森林在四周，國庫與多數公會在此。")
add("rainbow_mz", "彩虹城迷宮", ["彩虹地下城", "彩虹地下城迷宮"], "mainland", "dungeon", 31.2, 41.8,
    ["rainbow"], "htm/map/r1.htm", "htm/map/r1.jpg",
    "彩虹城底下的兩層迷宮。")
add("town_base", "市鎮地下室", [], "mainland", "dungeon", 36.6, 33.2,
    ["rainbow"], None, None,
    "三大城底下的公共空間。原站沒有獨立詳圖。")
add("west_green", "西綠野", ["西綠"], "mainland", "field", 29.4, 48.2,
    ["rainbow", "south_green", "sleep_lake"], "htm/map/w.htm", "htm/map/map/west.jpg",
    "彩虹城西南的原野，往沉睡湖的必經之路。")
add("sleep_lake", "沉睡湖", ["沈睡湖"], "mainland", "lake", 26.1, 62.8,
    ["west_green", "sleep_town", "under"], "htm/map/sh.htm", "htm/map/map/sleep.jpg",
    "西綠野之南的湖泊，湖畔通往沉睡村與地底迷宮。")
add("sleep_town", "沉睡村", ["沈睡村"], "mainland", "village", 19.4, 72.4,
    ["sleep_lake", "coconut"], "htm/map/st.htm", "htm/map/map/st.jpg",
    "沉睡湖西南的小村，再往西是椰子島。")
add("under", "地底迷宮", ["沈睡迷宮", "地底洞窟"], "mainland", "dungeon", 22.4, 58.0,
    ["sleep_lake"], "htm/map/di.htm", "htm/map/di.jpg",
    "沉睡湖底下的迷宮。")
add("coconut", "椰子島", [], "mainland", "island", 13.2, 74.8,
    ["sleep_town"], "htm/map/1.htm", "htm/map/1.jpg",
    "沉睡村外海的小島。")
add("lettuce", "萵苣村", [], "mainland", "village", 23.0, 38.3,
    ["rainbow", "secret", "pineapple"], "htm/map/ton.htm", "htm/map/map/ton.jpg",
    "彩虹城西邊的村子，往秘密平原與鳳梨山。")
add("secret", "秘密平原", ["祕密平原"], "mainland", "field", 18.7, 27.6,
    ["lettuce", "tanlana", "hachu"], "htm/map/mimi.htm", "htm/map/map/mimi.jpg",
    "萵苣村北方的開闊地，連著坦拉娜迷宮與哈啾島。")
add("tanlana", "坦拉娜迷宮", [], "mainland", "dungeon", 15.8, 32.4,
    ["secret"], "htm/map/tann.htm", None,
    "秘密平原附近的迷宮。")
add("hachu", "哈啾島", ["哈哈島"], "mainland", "island", 12.8, 23.4,
    ["secret"], "htm/map/2.htm", "htm/map/2.jpg",
    "秘密平原西北外海。")
add("pineapple", "鳳梨山", [], "mainland", "mountain", 14.2, 51.0,
    ["lettuce", "bluemeow", "blueisle", "cat_mz"], "htm/map/fo.htm", "htm/map/map/fon.jpg",
    "萵苣村西南的山區，藍喵喵迷宮、貓迷宮與藍喵島在這一帶。")
add("bluemeow", "藍喵喵迷宮", [], "mainland", "dungeon", 10.6, 47.2,
    ["pineapple", "blueisle", "cat_mz"], "htm/map/miou.htm", "htm/map/miou.jpg",
    "鳳梨山附近的迷宮。去打藍貓記得帶月光村雪怪掉的美味麻糬。")
add("blueisle", "藍喵島", [], "mainland", "island", 8.4, 54.6,
    ["pineapple", "bluemeow"], None, "htm/map/fill/blueisle.jpg",
    "鳳梨山外海的小島。")
add("cat_mz", "貓迷宮", [], "mainland", "dungeon", 12.0, 44.0,
    ["pineapple", "bluemeow"], "htm/map/miou.htm", "htm/map/fill/cat_mz.jpg",
    "從鳳梨山左上方進入。月光村雪怪的美味麻糬在這一帶用得到。")
add("greenleaf", "綠夫村", ["精靈新手村"], "mainland", "village", 64.5, 42.6,
    ["smile", "rose_lake", "nick"], "copy/map2.htm#2", None,
    "精靈出生村。北微笑森林、東玫瑰湖、南尼克草原。")
add("smile", "微笑森林", [], "mainland", "forest", 53.3, 29.5,
    ["greenleaf", "rainbow", "candy_mt"], "htm/map/smile.htm", "htm/map/map/smile.jpg",
    "綠夫與彩虹之間的森林，往北可接糖果山。")
add("rose_lake", "玫瑰湖", [], "mainland", "lake", 81.2, 35.5,
    ["greenleaf", "rose_isle", "bluebird", "pea"], "htm/map/rose.htm", "htm/map/map/rose.jpg",
    "綠夫村東邊的湖，湖上是玫瑰島，再東是青鳥城。")
add("rose_isle", "玫瑰島", [], "mainland", "island", 85.8, 38.8,
    ["rose_lake"], "htm/map/rosed.htm", None,
    "玫瑰湖上的小島。")
add("bluebird", "青鳥城", ["精靈首都"], "mainland", "city", 78.6, 27.1,
    ["rose_lake", "darkcave", "snow", "pea", "bird_mz"], "copy/map2.htm#5", None,
    "精靈首都。木材、皮甲與修士工會多在此。")
add("bird_mz", "青鳥城迷宮", ["青鳥地下城", "青鳥地下城迷宮"], "mainland", "dungeon", 83.8, 31.0,
    ["bluebird"], "htm/map/b1.htm", "htm/map/b1.jpg",
    "青鳥城底下的兩層迷宮。")
add("darkcave", "陰暗山洞", ["陰暗洞窟"], "mainland", "dungeon", 83.4, 23.0,
    ["bluebird"], "htm/map/in.htm", "htm/map/in.jpg",
    "青鳥城附近的洞窟。")
add("pea", "碗豆湖", ["豌豆湖"], "mainland", "lake", 63.6, 19.0,
    ["rose_lake", "redhood", "candy_mt", "smile"], "htm/map/do.htm", "htm/map/map/bean.jpg",
    "糖果山與紅帽村之間的湖。")
add("redhood", "紅帽村", [], "mainland", "village", 73.0, 11.1,
    ["pea", "swan", "snow", "tulip"], "htm/map/red.htm", "htm/map/map/red.jpg",
    "北方的小村，連著天鵝湖、白雪森林與鬱金香島。")
add("swan", "天鵝湖", [], "mainland", "lake", 92.3, 8.6,
    ["redhood", "snow"], "htm/map/duck.htm", "htm/map/map/swan.jpg",
    "地圖東北角的湖。")
add("snow", "白雪森林", [], "mainland", "forest", 91.9, 22.3,
    ["redhood", "swan", "bluebird"], "htm/map/white.htm", "htm/map/map/white.jpg",
    "青鳥城東北的雪林。")
add("tulip", "鬱金香島", [], "mainland", "island", 69.6, 6.9,
    ["redhood"], "htm/map/3.htm", "htm/map/3.jpg",
    "紅帽村北面外海。")
add("candy_mt", "糖果山", [], "mainland", "mountain", 46.6, 15.2,
    ["smile", "pea", "wolf"], "htm/map/tan.htm", "htm/map/map/tan.jpg",
    "微笑森林之北，大野狼洞窟就在山裡。")
add("wolf", "大野狼洞窟", ["大野狼的洞窟"], "mainland", "dungeon", 42.8, 11.4,
    ["candy_mt"], "htm/map/da.htm", "htm/map/da.jpg",
    "糖果山內的洞窟。")
add("ili", "伊利村", ["矮人新手村"], "mainland", "village", 53.8, 73.8,
    ["dwarf_mt", "fear", "goldcity"], "copy/map2.htm#3", None,
    "矮人出生村。西矮人山、北害怕峽谷、南金銀城。挖礦與鑲嵌多在這一帶學。")
add("dwarf_mt", "矮人山", [], "mainland", "mountain", 34.7, 70.0,
    ["ili", "hearsay"], "htm/map/i.htm", "htm/map/map/i.jpg",
    "伊利村西邊的山地，外海是聽說島。")
add("hearsay", "聽說島", [], "mainland", "island", 27.5, 82.8,
    ["dwarf_mt"], "htm/map/heard.htm", "htm/map/heard.jpg",
    "矮人山西南外海。")
add("fear", "害怕峽谷", [], "mainland", "field", 47.0, 62.8,
    ["ili", "rat", "puppet"], "htm/map/high.htm", "htm/map/map/high.jpg",
    "伊利村北的峽谷，連著鼠洞與木偶山。")
add("rat", "鼠洞", [], "mainland", "dungeon", 44.2, 58.4,
    ["fear"], "htm/map/su1.htm", "htm/map/su1.gif",
    "害怕峽谷裡的多層鼠洞。")
add("puppet", "木偶山", [], "mainland", "mountain", 58.3, 61.3,
    ["fear", "northcave", "goldcity"], "htm/map/mu.htm", "htm/map/map/mu.jpg",
    "害怕峽谷東側，北方洞窟在山中；資料片拇指姑娘由此山腳進入。")
add("northcave", "北方洞窟", [], "mainland", "dungeon", 60.6, 56.8,
    ["puppet"], "htm/map/north.htm", "htm/map/north.jpg",
    "木偶山內的洞窟。")
add("goldcity", "金銀城", ["矮人首都"], "mainland", "city", 40.7, 76.2,
    ["ili", "goldlake", "lamp", "gold_mz"], "copy/map2.htm#6", None,
    "矮人首都，打鐵與寶石公會在此。南金銀湖、東神燈沙漠。")
add("gold_mz", "金銀城迷宮", ["金銀地下城", "金銀地下城迷宮"], "mainland", "dungeon", 36.8, 81.6,
    ["goldcity"], "htm/map/g1.htm", "htm/map/g1.jpg",
    "金銀城底下的兩層迷宮。")
add("goldlake", "金銀湖", [], "mainland", "lake", 57.0, 82.4,
    ["goldcity", "gulu", "crystal"], "htm/map/hu.htm", "htm/map/map/gh.jpg",
    "金銀城東南的湖，湖外是咕嚕島。")
add("gulu", "咕嚕島", [], "mainland", "island", 62.7, 93.2,
    ["goldlake"], "htm/map/gu.htm", "htm/map/gu.jpg",
    "金銀湖外海。")
add("lamp", "神燈沙漠", ["神祕沙漠"], "mainland", "desert", 66.5, 72.5,
    ["goldcity", "frog", "dragon"], "htm/map/shen.htm", "htm/map/map/shen.jpg",
    "金銀城東、青蛙沼澤南的沙漠，龍窟藏在沙裡。")
add("dragon", "龍窟", [], "mainland", "dungeon", 70.4, 76.8,
    ["lamp"], "htm/map/lon.htm", "htm/map/lon.jpg",
    "神燈沙漠中的龍窟。")
add("crystal", "水晶山", [], "mainland", "mountain", 41.5, 88.5,
    ["goldlake", "nameless", "moon"], "htm/map/gi.htm", "htm/map/map/sg.jpg",
    "金銀湖南邊的山，不知名迷宮在山中。")
add("nameless", "不知名迷宮", [], "mainland", "dungeon", 38.2, 92.4,
    ["crystal"], "htm/map/bu.htm", None,
    "水晶山裡連名字都懶得取的迷宮。原站只有走法，沒有平面圖。")
add("moon", "月光村", [], "mainland", "village", 29.3, 96.2,
    ["crystal"], "htm/map/moon.htm", "htm/map/map/moon.jpg",
    "地圖西南角的海邊村子。")
add("nick", "尼克草原", ["Nicholas Steppe"], "mainland", "field", 64.5, 49.8,
    ["greenleaf", "babe"], "htm/map/nick.htm", "htm/map/map/nick.jpg",
    "綠夫村南的草原，人魚傳說由此接到貝伯港。")
add("babe", "貝伯港", [], "mainland", "port", 73.0, 49.0,
    ["nick", "skye"], "htm/map/babe.htm", "htm/map/map/babe.jpg",
    "主大陸東岸港口，船出航向史蓋窩克海。")

# ----- 人魚傳說 -----
add("skye", "史蓋窩克海", ["史蓋窩克海西"], "mermaid", "sea", 28, 48,
    ["babe", "misha", "basm", "papa", "skye_e"], "htm/map/sea.htm", "htm/map/map/sea.jpg",
    "貝伯港外的大海，連米夏島、巴斯密洞與趴趴迷宮。")
add("misha", "米夏島", [], "mermaid", "island", 52, 32,
    ["skye"], "htm/map/mi.htm", None,
    "史蓋窩克海上的島。")
add("basm", "巴斯密洞", ["巴斯迷宮"], "mermaid", "dungeon", 58, 58,
    ["skye"], None, None,
    "海上洞窟，分多層。")
add("papa", "趴趴迷宮", [], "mermaid", "dungeon", 72, 44,
    ["skye", "skye_e"], None, None,
    "海上迷宮，三層。")
add("skye_e", "史蓋窩克海東", ["史蓋窩克海"], "mermaid", "sea", 84, 62,
    ["skye", "papa"], None, None,
    "原圖把史蓋窩克海標了兩次——東側海域另成一塊。")

# ----- 愛麗絲 -----
add("dream", "夢想花園", [], "alice", "field", 12, 52,
    ["door"], "htm/map/dream.htm", "htm/map/dream.jpg",
    "愛麗絲資料片入口，1–5 級花園。")
add("door", "門之迷宮", [], "alice", "dungeon", 28, 52,
    ["dream", "w_lost", "e_lost"], "htm/map/door1.htm", "htm/map/door1.jpg",
    "花園底下的兩層迷宮。")
add("w_lost", "西迷路森林", [], "alice", "forest", 46, 28,
    ["door", "rabbit"], "htm/map/wmi.htm", "htm/map/wmi.jpg",
    "迷宮出來往西的迷路林。")
add("e_lost", "東迷路森林", [], "alice", "forest", 46, 74,
    ["door", "rabbit"], "htm/map/emi.htm", "htm/map/emi.jpg",
    "迷宮出來往東的迷路林。")
add("rabbit", "羅比特草原", ["羅比特平原"], "alice", "field", 62, 52,
    ["w_lost", "e_lost", "oddflower"], "htm/map/rabbit.htm", "htm/map/rabbit.jpg",
    "三月兔與微笑貓咪出沒的草原。")
add("oddflower", "莫名其妙花叢", [], "alice", "field", 76, 52,
    ["rabbit", "ncat", "scat"], "htm/map/mo.htm", "htm/map/mo.jpg",
    "名字就叫莫名其妙。往北南貓咪森林。")
add("ncat", "北貓咪森林", [], "alice", "forest", 88, 24,
    ["oddflower", "rose_gd"], "htm/map/ncat.htm", "htm/map/ncat.jpg",
    "花叢北邊的貓林。")
add("scat", "南貓咪森林", [], "alice", "forest", 88, 78,
    ["oddflower", "rose_gd"], "htm/map/scat.htm", "htm/map/scat.jpg",
    "花叢南邊的貓林。")
add("rose_gd", "玫瑰園", [], "alice", "field", 72, 16,
    ["ncat", "poker"], "htm/map/rose0.htm", "htm/map/rose0.jpg",
    "往撲克花園前的玫瑰園。")
add("poker", "撲克花園", [], "alice", "field", 54, 12,
    ["rose_gd"], "htm/map/pook.htm", "htm/map/pook.jpg",
    "愛麗絲路線的盡頭花園。")

# ----- 一千零一夜：拉開成地理空間，不再擠成流程圖 -----
# 西北高原／谷地 → 西沙漠 → 中央巴格達 → 南港與島鏈 → 東島
add("syria", "西里亞高原", [], "nights", "field", 10, 12,
    ["galan", "kalas"], "htm/map/she.htm", "htm/map/she.jpg",
    "最西北的高原。")
add("kalas", "卡拉斯山區", [], "nights", "mountain", 26, 9,
    ["galan", "syria", "kalas_sky"], "htm/map/klss.htm", "htm/map/klss.jpg",
    "北境山區。")
add("kalas_sky", "卡拉斯空域", [], "nights", "sky", 36, 5,
    ["kalas"], None, "htm/map/kls.jpg",
    "卡拉斯上空。")
add("galan", "迦蘭谷地", [], "nights", "field", 12, 26,
    ["syria", "kalas"], "htm/map/el.htm", "htm/map/el.jpg",
    "西北谷地。")
add("thief", "大盜巢穴", [], "nights", "dungeon", 22, 20,
    ["elian"], None, "htm/map/dd1.jpg",
    "三層盜賊巢穴。")
add("trial", "試煉洞窟", [], "nights", "dungeon", 36, 15,
    ["elian"], None, "htm/map/sl1.jpg",
    "三層高階洞窟，掉寶很肥。")
add("tomb", "秘密古墓", ["祕密古墓"], "nights", "dungeon", 48, 18,
    ["elian"], None, None,
    "沙漠裡的三層古墓。")
add("underworld", "冥界洞窟", [], "nights", "dungeon", 80, 12,
    ["elian"], None, "htm/map/mm3.jpg",
    "三層冥界，靈與魔女出沒。")
add("palace", "空中宮殿", [], "nights", "dungeon", 70, 22,
    ["baghdad_sky"], None, "htm/map/kk1.jpg",
    "三層空中宮殿。")
add("spring", "甘泉村", [], "nights", "village", 28, 34,
    ["elian"], "htm/map/gh.htm", "htm/map/gh.jpg",
    "沙漠裡的綠洲村子。")
add("elian", "以利暗沙漠", [], "nights", "desert", 40, 40,
    ["baghdad", "spring", "trial", "thief", "tomb"], "htm/map/1l.htm", "htm/map/1l.jpg",
    "巴格達西邊的沙漠。")
add("baghdad_sky", "巴格達空域", [], "nights", "sky", 58, 30,
    ["baghdad", "palace"], None, "htm/map/bg.jpg",
    "巴格達上空，通往空中宮殿。")
add("baghdad", "巴格達城", [], "nights", "city", 58, 48,
    ["basra", "baghdad_sky", "palace", "elian"], "htm/map/baga.htm", "htm/map/baga.jpg",
    "天方夜譚的大城市。")
add("sandypeel", "沙皮島", [], "nights", "island", 88, 40,
    ["rock", "eatman", "baghdad_sky"], None, "htm/map/ss.jpg",
    "東側島嶼。")
add("basra_sky", "巴斯拉空域", [], "nights", "sky", 20, 50,
    ["flyfish", "basra"], None, "htm/map/bs.jpg",
    "巴斯拉上空。")
add("flyfish", "飛魚角", [], "nights", "port", 8, 64,
    ["basra_sky", "basra"], "htm/map/f1.htm", "htm/map/f1.jpg",
    "天方夜譚常見起點，海邊。")
add("basra", "巴斯拉港", [], "nights", "port", 24, 68,
    ["flyfish", "basra_sky", "momo_isle", "baghdad"], "htm/map/buss.htm", "htm/map/buss.jpg",
    "天方的港口城市。")
add("eatman", "吃人島", ["喫人島"], "nights", "island", 90, 64,
    ["rock", "sandypeel"], None, "htm/map/tt.jpg",
    "名字很老實的島。")
add("momo_isle", "摩摩島", [], "nights", "island", 36, 82,
    ["basra", "tutu"], "htm/map/momo.htm", "htm/map/momo.jpg",
    "巴斯拉外海。")
add("tutu_sky", "禿禿島空域", [], "nights", "sky", 54, 72,
    ["tutu"], None, "htm/map/tutuk.jpg",
    "禿禿島上空。")
add("tutu", "禿禿島", [], "nights", "island", 54, 88,
    ["momo_isle", "tutu_sky", "hasin"], "htm/map/tutu.htm", "htm/map/tutu.jpg",
    "南方島嶼。")
add("rock", "巨岩島", ["巨巖島"], "nights", "island", 76, 80,
    ["eatman", "sandypeel"], None, "htm/map/gg.jpg",
    "東南海島。")
add("hasin", "哈辛島", [], "nights", "island", 68, 90,
    ["tutu"], "htm/map/hs.htm", "htm/map/hs.jpg",
    "南方島。")

# ----- 國王的新衣 -----
add("wani", "瓦尼島", [], "clothes", "island", 22, 50,
    ["ruins"], "htm/map/wani/a.htm", None,
    "國王的新衣入口島，底下就是二十二層遺跡。")
add("ruins", "地下遺跡", ["遺跡地下"], "clothes", "dungeon", 62, 50,
    ["wani"], "htm/map/wani/muss.htm", None,
    "1F 到 22F 的長階梯，原頁把它收成一個點。")

# ----- 綠野仙蹤 -----
add("flower_v", "彩花村", [], "oz", "village", 10, 55,
    ["colorfield"], None, None,
    "綠野仙蹤起點村子。")
add("colorfield", "彩色田", ["彩花田"], "oz", "field", 24, 48,
    ["flower_v", "sunforest"], None, None,
    "稻草包與花木豹的田。")
add("sunforest", "陽光森林", [], "oz", "forest", 38, 40,
    ["colorfield", "flower_val"], None, None,
    "往百花谷的森林。")
add("flower_val", "百花谷", [], "oz", "field", 52, 34,
    ["sunforest", "emerald", "headless"], None, None,
    "山谷，連翡翠城與斷頭谷。")
add("emerald", "翡翠城", [], "oz", "city", 66, 22,
    ["flower_val"], None, None,
    "綠野仙蹤的城。原頁另有翡翠城平原，這裡收在城下。")
add("headless", "斷頭谷", [], "oz", "field", 64, 48,
    ["flower_val", "tanlin"], None, None,
    "名字嚇人的谷。")
add("tanlin", "坦林平原", [], "oz", "field", 76, 58,
    ["headless", "dk_n", "west_secret"], None, None,
    "通往黑森林的平原。")
add("dk_n", "黑森林之北", ["黑森林北面"], "oz", "forest", 88, 48,
    ["tanlin", "dk_s"], None, None,
    "黑森林北側。")
add("dk_s", "黑森林之南", ["黑森林南面"], "oz", "forest", 88, 68,
    ["dk_n", "witch"], None, None,
    "黑森林南側，往威奇迷宮。")
add("west_secret", "西方秘境", [], "oz", "field", 72, 78,
    ["tanlin"], None, None,
    "坦林平原西側的秘境。")
add("witch", "威奇迷宮", [], "oz", "dungeon", 54, 78,
    ["dk_s", "witch_nx"], None, None,
    "兩層高階迷宮。")
add("witch_nx", "威奇魔法陣", [], "oz", "dungeon", 38, 82,
    ["witch"], None, None,
    "迷宮盡頭的魔法陣。")

# ----- 拇指姑娘 -----
add("puppet_ft", "木偶山山腳", [], "thumb", "field", 12, 50,
    ["puppet", "dreamland"], None, None,
    "從主大陸木偶山下來，拇指姑娘由此進。")
add("dreamland", "夢奇地", [], "thumb", "field", 32, 36,
    ["puppet_ft", "tunnel_in"], None, None,
    "依等級切 31–100 區，原頁只標一個夢奇地。")
add("tunnel_in", "地道入口", [], "thumb", "field", 48, 52,
    ["dreamland", "can_tunnel"], "htm/map/wani/g1.htm", "htm/map/wani/g1.jpg",
    "罐頭地道的入口，詳圖見地道 B1。")
add("can_tunnel", "罐頭地道", [], "thumb", "dungeon", 64, 52,
    ["tunnel_in", "thumb_gd"], None, None,
    "兩層地道，通往拇指花園。")
add("thumb_gd", "拇指花園", [], "thumb", "field", 78, 40,
    ["can_tunnel", "lotus"], None, None,
    "地道另一頭的花園。")
add("lotus", "荷花池塘", [], "thumb", "lake", 86, 62,
    ["thumb_gd", "lotus_land"], None, None,
    "花園外的池塘。")
add("lotus_land", "荷花仙境", [], "thumb", "field", 72, 78,
    ["lotus"], None, None,
    "池塘深處。")

# ----- 美女與野獸 -----
add("wind_val", "風之谷", [], "beast", "field", 14, 42,
    ["ram_v"], None, None,
    "美女與野獸起點。")
add("ram_v", "羊角村", [], "beast", "village", 30, 50,
    ["wind_val", "forget", "gale"], None, None,
    "谷地裡的村子。")
add("forget", "遺忘森林", [], "beast", "forest", 46, 36,
    ["ram_v"], None, None,
    "村子北邊的森林。")
add("gale", "狂風沙漠", [], "beast", "desert", 48, 66,
    ["ram_v", "sand_keep"], None, None,
    "往沙漠地城的沙地。")
add("sand_keep", "沙漠地城", [], "beast", "dungeon", 64, 70,
    ["gale", "castle_ug"], None, None,
    "兩層沙漠地城。")
add("castle_ug", "古堡地下迷宮", ["古堡地下"], "beast", "dungeon", 78, 56,
    ["sand_keep", "pronot"], None, None,
    "B3 到 B1，往上是普諾特古堡。")
add("pronot", "普諾特古堡", [], "beast", "city", 86, 34,
    ["castle_ug"], None, None,
    "路線盡頭的古堡。原站未收到這張詳圖。")

# ----- 桃太郎 -----
add("peach", "桃花村", [], "momo", "village", 12, 48,
    ["greenhill"], None, None,
    "桃太郎資料片的村子。")
add("greenhill", "青葉丘", [], "momo", "field", 26, 36,
    ["peach", "tiger"], None, None,
    "村外丘陵。")
add("tiger", "虎之原", [], "momo", "field", 40, 48,
    ["greenhill", "oni_isle", "kirihari"], None, None,
    "往鬼島與霧張島的分岔原。原站沒有這張詳圖。")
add("oni_isle", "鬼島", [], "momo", "island", 58, 28,
    ["tiger", "oni_hall"], None, None,
    "海上鬼島。")
add("oni_hall", "鬼之殿", [], "momo", "dungeon", 74, 22,
    ["oni_isle"], None, None,
    "三層鬼殿。")
add("kirihari", "霧張島", [], "momo", "island", 58, 64,
    ["tiger", "kiri_cave", "kiri_sea"], None, None,
    "另一條出海線。")
add("kiri_cave", "霧張秘洞", ["霧張祕洞"], "momo", "dungeon", 70, 78,
    ["kirihari"], None, None,
    "島上秘洞。原站沒有這張詳圖。")
add("kiri_sea", "霧張之海", [], "momo", "sea", 78, 58,
    ["kirihari", "ryugu"], None, None,
    "兩層海域，通往龍宮。")
add("ryugu", "龍宮", [], "momo", "dungeon", 90, 48,
    ["kiri_sea"], None, None,
    "三層龍宮。")

# ----- 糖果屋 -----
add("trail", "登山小徑", [], "candy", "field", 14, 58,
    ["gresia", "maple"], "htm/map/c/b.htm", "htm/map/c/b.gif",
    "糖果屋常見進圖路線。")
add("rebirth", "轉生神殿", [], "candy", "temple", 14, 22,
    [], "htm/map/c/c.htm", "htm/map/c/c.gif",
    "獨立的轉生場所，不在練級線上。")
add("gresia", "葛雷夏村與郊外", ["葛雷夏村", "葛雷夏郊外", "葛雷夏村郊外"], "candy", "village", 36, 50,
    ["trail", "ashwood"], "htm/map/c/d.htm", "htm/map/c/d.gif",
    "凍原前的村子與郊外。")
add("ashwood", "艾司伍林地", [], "candy", "forest", 56, 42,
    ["gresia", "quiet", "maple"], "htm/map/c/e.htm", "htm/map/c/e.gif",
    "林地，往凍原與楓果森林。")
add("quiet", "寧靜凍原", [], "candy", "field", 74, 36,
    ["ashwood", "ice"], "htm/map/c/g.htm", "htm/map/c/g.gif",
    "雪原。")
add("ice", "冰原洞窟", [], "candy", "dungeon", 88, 28,
    ["quiet"], "htm/map/c/aa.htm", "htm/map/c/aa.gif",
    "凍原盡頭的兩層洞窟。")
add("maple", "楓果森林", [], "candy", "forest", 56, 68,
    ["trail", "ashwood", "candy_ft"], "htm/map/c/f.htm", "htm/map/c/f.gif",
    "另一條往糖果森林的林道。")
add("candy_ft", "糖果森林", [], "candy", "forest", 74, 74,
    ["maple", "candy_mz"], None, None,
    "往糖果屋迷宮的森林。原站註明暫無地圖，入口在寧靜凍原左上叢林後。")
add("candy_mz", "糖果屋迷宮", [], "candy", "dungeon", 88, 80,
    ["candy_ft"], None, None,
    "資料片同名迷宮。原站註明暫無地圖。")


print("places", len(P))

KIND_ZH = {
    "village": "村莊", "city": "城市", "field": "原野", "lake": "湖泊",
    "mountain": "山地", "island": "島嶼", "port": "港口", "dungeon": "迷宮",
    "sky": "空域", "sea": "海域", "desert": "沙漠", "temple": "神殿",
    "forest": "森林",
}

VAR = str.maketrans({
    "祕": "秘", "沈": "沉", "來": "萊", "喫": "吃", "巖": "岩",
    "峯": "峰", "裏": "裡",
})

def norm(s):
    s = (s or "").translate(VAR)
    s = s.replace("碗豆", "豌豆").replace("史來姆", "史萊姆")
    s = s.replace(" ", "").replace("　", "")
    return s

def strip_floor(s):
    s = norm(s)
    s = re.sub(r"(地下)?[Bb]\d+$", "", s)
    s = re.sub(r"\d+F$", "", s)
    s = re.sub(r"\d+樓$", "", s)
    s = re.sub(r"之[東西南北]$", "", s)
    return s

def load_tools():
    raw = (REPO / "app" / "data-tools.js").read_text(encoding="utf-8")
    m = re.match(r"window\.__TOOLS=(.*)\s*$", raw, re.S)
    return json.loads(m.group(1).rstrip(";"))

def load_mons():
    raw = (REPO / "site" / "modern" / "data-monsters.js").read_text(encoding="utf-8")
    m = re.match(r"window\.__MON=(.*)\s*$", raw, re.S)
    return json.loads(m.group(1).rstrip(";"))


# 敗家一族原圖：補齊 page / img，資料片針位拉開給「圖節點」用
EXTRA_PAGE = {
    "jean": "copy/map2.htm#1",
    "greenleaf": "copy/map2.htm#2",
    "ili": "copy/map2.htm#3",
    "rainbow": "copy/map2.htm#4",
    "bluebird": "copy/map2.htm#5",
    "goldcity": "copy/map2.htm#6",
    "bluemeow": "htm/map/miou.htm",
    "rat": "htm/map/su1.htm",
    "gulu": "htm/map/gu.htm",
    "dragon": "htm/map/lon.htm",
    "nameless": "htm/map/bu.htm",
    "rainbow_mz": "htm/map/r1.htm",
    "gold_mz": "htm/map/g1.htm",
    "bird_mz": "htm/map/b1.htm",
    "tunnel_in": "htm/map/wani/g1.htm",
    "wani": "htm/map/wn.htm",
    "ruins": "htm/map/gg1.htm",
    "flower_v": "htm/map/wani/a.htm",
    "colorfield": "htm/map/wani/b.htm",
    "sunforest": "htm/map/wani/d.htm",
    "flower_val": "htm/map/wani/c.htm",
    "emerald": "htm/map/wani/e.htm",
    "headless": "htm/map/wani/g.htm",
    "tanlin": "htm/map/wani/h.htm",
    "dk_n": "htm/map/wani/i.htm",
    "dk_s": "htm/map/wani/j.htm",
    "west_secret": "htm/map/wani/k.htm",
    "witch": "htm/map/wani/l.htm",
    "witch_nx": "htm/map/wani/m.htm",
    "puppet_ft": "htm/map/wani/mus.htm",
    "dreamland": "htm/map/wani/mon.htm",
    "can_tunnel": "htm/map/wani/g1.htm",
    "thumb_gd": "htm/map/wani/mh.htm",
    "lotus": "htm/map/wani/ho.htm",
    "lotus_land": "htm/map/wani/hs.htm",
    "wind_val": "htm/map/new/wind.htm",
    "ram_v": "htm/map/new/sh.htm",
    "forget": "htm/map/new/for.htm",
    "gale": "htm/map/new/sa.htm",
    "sand_keep": "htm/map/new/s1.htm",
    "castle_ug": "htm/map/new/g3.htm",
    "peach": "htm/map/new/7yy.htm",
    "greenhill": "htm/map/new/7y7.htm",
    "oni_isle": "htm/map/new/gddd.htm",
    "oni_hall": "htm/map/new/gu1.htm",
    "kirihari": "htm/map/new/wzz.htm",
    "kiri_sea": "htm/map/new/wzzz1.htm",
    "ryugu": "htm/map/new/lg1.htm",
    "misha": "htm/map/mi.htm",
    "basm": "htm/map/bus.htm",
    "papa": "htm/map/papa1.htm",
    "skye_e": "htm/map/sky1.htm",
    "rabbit": "htm/map/rabbit.htm",
    "oddflower": "htm/map/mo.htm",
    "ncat": "htm/map/ncat.htm",
    "scat": "htm/map/scat.htm",
    "rose_gd": "htm/map/rose0.htm",
    "poker": "htm/map/pook.htm",
    "momo_isle": "htm/map/momo.htm",
    "tutu": "htm/map/tutu.htm",
    "elian": "htm/map/1l.htm",
    "spring": "htm/map/gh.htm",
    "kalas": "htm/map/klss.htm",
    "tomb": "htm/map/mm1.htm",
    "thief": "htm/map/dd1.htm",
    "trial": "htm/map/sl1.htm",
    "underworld": "htm/map/mg1.htm",
    "palace": "htm/map/kk1.htm",
    "basra_sky": "htm/map/bs.htm",
    "baghdad_sky": "htm/map/bg.htm",
    "tutu_sky": "htm/map/tutuk.htm",
    "kalas_sky": "htm/map/kls.htm",
    "rock": "htm/map/gg.htm",
    "eatman": "htm/map/tt.htm",
    "sandypeel": "htm/map/ss.htm",
}

EXTRA_IMG = {
    "misha": "htm/map/mi.jpg",
    "basm": "htm/map/bus.jpg",
    "papa": "htm/map/papa1.jpg",
    "skye_e": "htm/map/sky1.jpg",
    "rabbit": "htm/map/rabbit.jpg",
    "oddflower": "htm/map/mo.jpg",
    "ncat": "htm/map/ncat.jpg",
    "scat": "htm/map/scat.jpg",
    "rose_gd": "htm/map/rose0.jpg",
    "poker": "htm/map/pook.jpg",
    "momo_isle": "htm/map/momo.jpg",
    "tutu": "htm/map/tutu.jpg",
    "elian": "htm/map/1l.jpg",
    "spring": "htm/map/gh.jpg",
    "kalas": "htm/map/klss.jpg",
    "tomb": "htm/map/mm1.jpg",
    "thief": "htm/map/dd1.jpg",
    "trial": "htm/map/sl1.jpg",
    "underworld": "htm/map/mg1.jpg",
    "palace": "htm/map/kk1.jpg",
    "basra_sky": "htm/map/bs.jpg",
    "baghdad_sky": "htm/map/bg.jpg",
    "tutu_sky": "htm/map/tutuk.jpg",
    "kalas_sky": "htm/map/kls.jpg",
    "rock": "htm/map/gg.jpg",
    "eatman": "htm/map/tt.jpg",
    "sandypeel": "htm/map/ss.jpg",
    "wani": "htm/map/gg1.jpg",
    "ruins": "htm/map/gg1.jpg",
    "flower_v": "htm/map/wani/a.gif",
    "colorfield": "htm/map/wani/b.gif",
    "sunforest": "htm/map/wani/d.gif",
    "flower_val": "htm/map/wani/c.gif",
    "emerald": "htm/map/wani/e.gif",
    "headless": "htm/map/wani/g.gif",
    "tanlin": "htm/map/wani/h.gif",
    "dk_n": "htm/map/wani/i.gif",
    "dk_s": "htm/map/wani/j.gif",
    "west_secret": "htm/map/wani/k.gif",
    "witch": "htm/map/wani/l.gif",
    "witch_nx": "htm/map/wani/m.gif",
    "puppet_ft": "htm/map/wani/mus.gif",
    "dreamland": "htm/map/wani/mon.gif",
    "can_tunnel": "htm/map/wani/g1.gif",
    "thumb_gd": "htm/map/wani/mh.gif",
    "lotus": "htm/map/wani/ho.gif",
    "lotus_land": "htm/map/wani/hs.gif",
    "wind_val": "htm/map/new/wind.gif",
    "ram_v": "htm/map/new/sh.gif",
    "forget": "htm/map/new/for.gif",
    "gale": "htm/map/new/sa.gif",
    "sand_keep": "htm/map/new/s1.gif",
    "castle_ug": "htm/map/new/g3.gif",
    "peach": "htm/map/new/7yy.gif",
    "greenhill": "htm/map/new/7y7.gif",
    "oni_isle": "htm/map/new/gddd.gif",
    "oni_hall": "htm/map/new/gu1.gif",
    "kirihari": "htm/map/new/wzz.gif",
    "kiri_sea": "htm/map/new/wzzz1.gif",
    "ryugu": "htm/map/new/lg1.jpg",
    "dragon": "htm/map/lon.jpg",
    "jean": "cimage/1.jpg",
    "greenleaf": "cimage/2.jpg",
    "ili": "cimage/3.jpg",
    "rainbow": "cimage/4.jpg",
    "bluebird": "cimage/5.jpg",
    "goldcity": "cimage/6.jpg",
    "bluemeow": "htm/map/miou.jpg",
    "rat": "htm/map/su1.gif",
    "gulu": "htm/map/gu.jpg",
    "rainbow_mz": "htm/map/r1.jpg",
    "gold_mz": "htm/map/g1.jpg",
    "bird_mz": "htm/map/b1.jpg",
    "tunnel_in": "htm/map/wani/g1.jpg",
    "blueisle": "htm/map/fill/blueisle.jpg",
    "tanlana": "htm/map/fill/tanlana.jpg",
    "nameless": "htm/map/fill/nameless.jpg",
    "rose_isle": "htm/map/fill/rose_isle.jpg",
    "tiger": "htm/map/fill/tiger.jpg",
    "kiri_cave": "htm/map/fill/kiri_cave.jpg",
    "pronot": "htm/map/fill/pronot.jpg",
    "candy_ft": "htm/map/fill/candy_ft.jpg",
    "candy_mz": "htm/map/fill/candy_mz.jpg",
    "town_base": "htm/map/fill/town_base.jpg",
    "cat_mz": "htm/map/fill/cat_mz.jpg",
    "trail": "htm/map/c/b.jpg",
    "rebirth": "htm/map/c/c.jpg",
    "gresia": "htm/map/c/d.jpg",
    "ashwood": "htm/map/c/e.jpg",
    "quiet": "htm/map/c/g.jpg",
    "ice": "htm/map/c/aa.jpg",
    "maple": "htm/map/c/f.jpg",
    "flower_v": "htm/map/wani/a.jpg",
    "colorfield": "htm/map/wani/b.jpg",
    "sunforest": "htm/map/wani/d.jpg",
    "flower_val": "htm/map/wani/c.jpg",
    "emerald": "htm/map/wani/e.jpg",
    "headless": "htm/map/wani/g.jpg",
    "tanlin": "htm/map/wani/h.jpg",
    "dk_n": "htm/map/wani/i.jpg",
    "dk_s": "htm/map/wani/j.jpg",
    "west_secret": "htm/map/wani/k.jpg",
    "witch": "htm/map/wani/l.jpg",
    "witch_nx": "htm/map/wani/m.jpg",
    "puppet_ft": "htm/map/wani/mus.jpg",
    "dreamland": "htm/map/wani/mon.jpg",
    "can_tunnel": "htm/map/wani/g1.jpg",
    "thumb_gd": "htm/map/wani/mh.jpg",
    "lotus": "htm/map/wani/ho.jpg",
    "lotus_land": "htm/map/wani/hs.jpg",
    "wind_val": "htm/map/new/wind.jpg",
    "ram_v": "htm/map/new/sh.jpg",
    "forget": "htm/map/new/for.jpg",
    "gale": "htm/map/new/sa.jpg",
    "sand_keep": "htm/map/new/s1.jpg",
    "castle_ug": "htm/map/new/g3.jpg",
    "peach": "htm/map/new/7yy.jpg",
    "greenhill": "htm/map/new/7y7.jpg",
    "oni_isle": "htm/map/new/gddd.jpg",
    "oni_hall": "htm/map/new/gu1.jpg",
    "kirihari": "htm/map/new/wzz.jpg",
    "kiri_sea": "htm/map/new/wzzz1.jpg",
    "ryugu": "htm/map/new/lg1.jpg",
}

# 2026 客戶端已核對的地圖編號（城際傳送卷 live + maps\NNNNN.adf）
CLIENT_MAP_ID = {
    "rainbow": 10009,
    "bluebird": 10058,
    "goldcity": 40003,
    "baghdad": 40301,
    "emerald": 10405,
    "jean": 10001,
    "ili": 40002,
    "greenleaf": 10051,
    "w_lost": 10203,
    "e_lost": 10204,  # 客戶端兩張都寫西迷路；這張連羅比特草原，當東迷路
    "tomb": 20670,    # 客戶端寫「秘密古幕」
    "bluemeow": 20151,
    "blueisle": 20152,
    "tunnel_in": 20903,
    "kalas": 40303,
    "puppet_ft": 20901,
}

# 客戶端迷宮配置與玩家詳圖不同（改版重做過，ADF 走格已核對與 LPQ 小圖一致，
# 但與詳圖記錄的舊版走法對不上）。詳圖為準，客戶端卡加標註。
CLIENT_VER_DIFF = {
    20088: "客戶端檔內是改版後的迷宮配置，實際走法以詳圖為準。",
    21308: "客戶端檔內是改版後的迷宮配置，實際走法以詳圖為準。",
}

FILL = "補圖：原站缺平面圖，依敗家一族畫風重繪，給認路用。"
IMG_NOTE = {
    "wani": "原站瓦尼島頁沒有島嶼平面圖，下面用遺跡 0F 當入口圖，各層詳圖可翻。",
    "nameless": FILL,
    "blueisle": FILL,
    "tanlana": FILL,
    "rose_isle": FILL,
    "tiger": FILL,
    "kiri_cave": FILL,
    "pronot": FILL,
    "candy_ft": FILL,
    "candy_mz": FILL,
    "town_base": FILL,
    "cat_mz": FILL,
    "tunnel_in": "入口收在罐頭地道頁，這裡用 B1 當入口圖。",
}

# 多層迷宮：封面之外再附各層原圖
GALLERY = {
    "slime": [("1F", "htm/map/s1.jpg"), ("2F", "htm/map/s2.jpg"), ("3F", "htm/map/s3.jpg")],
    "door": [("B1", "htm/map/door1.jpg"), ("B2", "htm/map/door2.jpg")],
    "basm": [("B1", "htm/map/bus.jpg"), ("B2", "htm/map/bus2.jpg"), ("B3", "htm/map/bus3.jpg")],
    "papa": [("B1", "htm/map/papa1.jpg"), ("B2", "htm/map/papa2.jpg"), ("B3", "htm/map/papa3.jpg")],
    "thief": [("B1", "htm/map/dd1.jpg"), ("B2", "htm/map/dd2.jpg"), ("B3", "htm/map/dd3.jpg")],
    "trial": [("B1", "htm/map/sl1.jpg"), ("B2", "htm/map/sl2.jpg")],
    "tomb": [("B1", "htm/map/mm1.jpg"), ("B2", "htm/map/mm2.jpg"), ("B3", "htm/map/mm3.jpg")],
    "underworld": [("B1", "htm/map/mg1.jpg"), ("B2", "htm/map/mg2.jpg"), ("B3", "htm/map/mg3.jpg")],
    "palace": [("1F", "htm/map/kk1.jpg"), ("2F", "htm/map/kk2.jpg"), ("3F", "htm/map/kk3.jpg")],
    "skye": [("海", "htm/map/map/sea.jpg"), ("B1", "htm/map/sky1.jpg"), ("B2", "htm/map/sky2.jpg")],
    "rat": [("B1", "htm/map/su1.gif"), ("B2", "htm/map/su2.gif"), ("B3", "htm/map/su3.gif")],
    "ice": [("B1", "htm/map/c/aa.jpg"), ("B2", "htm/map/c/bb.jpg")],
    "sand_keep": [("B1", "htm/map/new/s1.jpg"), ("B2", "htm/map/new/s2.jpg")],
    "castle_ug": [("B3", "htm/map/new/g3.jpg"), ("B2", "htm/map/new/g2.jpg")],
    "oni_hall": [("B1", "htm/map/new/gu1.jpg"), ("B2", "htm/map/new/gu2.jpg"), ("B3", "htm/map/new/gu3.jpg")],
    "kiri_sea": [("B1", "htm/map/new/wzzz1.jpg"), ("B2", "htm/map/new/wzzz2.jpg")],
    "ryugu": [("1F", "htm/map/new/lg1.jpg"), ("2F", "htm/map/new/lg2.jpg"), ("3F", "htm/map/new/lg3.jpg")],
    "witch": [("B1", "htm/map/wani/l.jpg"), ("B2", "htm/map/wani/m.jpg")],
    "can_tunnel": [("B1", "htm/map/wani/g1.jpg"), ("B2", "htm/map/wani/g2.jpg")],
    "rainbow_mz": [("B1", "htm/map/r1.jpg"), ("B2", "htm/map/r2.jpg")],
    "gold_mz": [("B1", "htm/map/g1.jpg"), ("B2", "htm/map/g2.jpg")],
    "bird_mz": [("B1", "htm/map/b1.jpg"), ("B2", "htm/map/b2.jpg")],
    "rainbow": [("村莊全圖", "cimage/4.jpg"), ("NPC 標註", "htm/map/rainbow2.jpg")],
    "bluebird": [("村莊全圖", "cimage/5.jpg"), ("NPC 標註", "htm/map/bird2.jpg")],
    "goldcity": [("村莊全圖", "cimage/6.jpg"), ("NPC 標註", "htm/map/gold2.jpg")],
    "jean": [("村莊全圖", "cimage/1.jpg")],
    "greenleaf": [("村莊全圖", "cimage/2.jpg")],
    "ili": [("村莊全圖", "cimage/3.jpg")],
}

# 一千零一夜：拉開給原圖節點，對齊天方總覽的地理感
LAYOUT = {
    "syria": (10, 8),
    "kalas": (34, 7),
    "kalas_sky": (56, 6),
    "galan": (12, 28),
    "thief": (32, 26),
    "trial": (54, 24),
    "tomb": (74, 22),
    "underworld": (90, 12),
    "spring": (20, 46),
    "elian": (42, 44),
    "baghdad_sky": (64, 38),
    "palace": (86, 34),
    "baghdad": (50, 58),
    "basra_sky": (20, 62),
    "flyfish": (8, 76),
    "basra": (28, 80),
    "sandypeel": (90, 54),
    "eatman": (92, 74),
    "rock": (78, 86),
    "momo_isle": (40, 92),
    "tutu_sky": (58, 80),
    "tutu": (58, 96),
    "hasin": (90, 98),
}

def file_ok(rel):
    return bool(rel) and (REPO / "site" / rel).is_file()

def prefer_img(rel):
    if not rel:
        return None
    p = Path(rel.replace("\\", "/"))
    stem = p.with_suffix("").as_posix()
    for ext in (".jpg", ".JPG", ".jpeg", ".gif", ".GIF", ".png"):
        cand = stem + ext
        if file_ok(cand):
            return cand
    return rel if file_ok(rel) else None

def resolve_img(pid, page, img):
    extra = EXTRA_IMG.get(pid)
    hit = prefer_img(extra) or prefer_img(img)
    if hit:
        return hit
    if page:
        stem = Path(page.split("#")[0])
        hit = prefer_img(str(stem.with_suffix(".jpg")).replace("\\", "/"))
        if hit:
            return hit
    return img if file_ok(img) else None

def ruins_gallery():
    out = []
    early = [("0F", "htm/map/gg1.jpg"), ("1F", "htm/map/gg2.jpg"),
             ("2F", "htm/map/gg22.jpg"), ("3F", "htm/map/gg3.jpg")]
    for lab, rel in early:
        hit = prefer_img(rel)
        if hit:
            out.append({"n": lab, "img": hit})
    for n in range(4, 24):
        hit = prefer_img("htm/map/wani/%d.jpg" % n)
        if hit:
            out.append({"n": "%dF" % n, "img": hit})
    return out

def build_gallery(pid, cover):
    rows = []
    if pid == "ruins":
        rows = ruins_gallery()
    else:
        for lab, rel in GALLERY.get(pid, []):
            hit = prefer_img(rel)
            if hit:
                rows.append({"n": lab, "img": hit})
    if cover and not any(r["img"] == cover for r in rows):
        rows.insert(0, {"n": "詳圖", "img": cover})
    # unique
    seen, uniq = set(), []
    for r in rows:
        if r["img"] in seen:
            continue
        seen.add(r["img"])
        uniq.append(r)
    return uniq

def main():
    tools = load_tools()
    mons = load_mons()

    # dropExp: list of {n, areas:[{a,lv,e,d,m}]}
    drop_by_area = {}
    drop_by_exp = {}
    for exp in tools["dropExp"]:
        drop_by_exp[exp["n"]] = exp["areas"]
        for a in exp["areas"]:
            drop_by_area.setdefault(norm(a["a"]), []).append(dict(a, exp=exp["n"]))

    # monsters by map
    mon_by_map = collections.defaultdict(list)
    for mo in mons:
        rec = {
            "n": mo["n"],
            "e": mo.get("e") or "",
            "lv": (mo.get("s") or {}).get("等級") or "",
            "d": mo.get("d") or [],
        }
        for loc in mo.get("m") or []:
            mon_by_map[norm(loc)].append(rec)

    # gather by location keyword
    gather_by = collections.defaultdict(list)
    for skill, items in tools["gather"].items():
        for g in items:
            for loc in g.get("loc") or []:
                gather_by[norm(loc)].append({"n": g["n"], "lv": g.get("lv"), "sk": skill, "loc": loc})

    # region name -> id
    rname = {r["n"]: r["id"] for r in REGIONS}
    rname["愛麗絲夢遊仙境"] = "alice"
    rname["一千零一夜"] = "nights"
    rname["國王的新衣"] = "clothes"
    rname["綠野仙蹤"] = "oz"
    rname["拇指姑娘"] = "thumb"
    rname["美女與野獸"] = "beast"
    rname["桃太郎"] = "momo"
    rname["糖果屋"] = "candy"

    places = []
    by_id = {}
    for row in P:
        pid, name, aliases, region, kind, x, y, links, page, img, blurb = row
        rec = {
            "id": pid,
            "n": name,
            "aka": aliases,
            "r": region,
            "k": kind,
            "kz": KIND_ZH[kind],
            "x": x, "y": y,
            "links": links,
            "page": page,
            "img": img,
            "blurb": blurb,
            "floors": [],
            "mons": [],
            "drops": [],
            "lv": "",
            "elem": "",
            "gather": [],
            "gallery": [],
            "note": "",
            "mid": None,
            "signs": [],
            "cimg": None,
            "cto": [],
            "cnpcs": [],
        }
        if pid in EXTRA_PAGE:
            rec["page"] = EXTRA_PAGE[pid]
        if pid in LAYOUT:
            rec["x"], rec["y"] = LAYOUT[pid]
        rec["img"] = resolve_img(pid, rec["page"], rec["img"])
        rec["note"] = IMG_NOTE.get(pid, "")
        rec["gallery"] = build_gallery(pid, rec["img"])
        rec["mid"] = CLIENT_MAP_ID.get(pid)
        places.append(rec)
        by_id[pid] = rec

    # attach dropExp floors + summary
    # map region -> dropExp name
    exp_name = {r["id"]: r["n"] for r in REGIONS}
    exp_name["alice"] = "愛麗絲夢遊仙境"
    exp_name["nights"] = "一千零一夜"
    exp_name["clothes"] = "國王的新衣"
    exp_name["oz"] = "綠野仙蹤"
    exp_name["thumb"] = "拇指姑娘"
    exp_name["beast"] = "美女與野獸"
    exp_name["momo"] = "桃太郎"
    exp_name["candy"] = "糖果屋"

    def names_of(rec):
        out = [rec["n"]] + list(rec["aka"])
        return out

    def match_area_name(aname, rec):
        a = norm(aname)
        cands = [norm(x) for x in names_of(rec)]
        if a in cands:
            return True
        # floor: 門之迷宮B1 under 門之迷宮; 遺跡地下1F under 地下遺跡
        base = strip_floor(aname)
        # extra aliases for complexes
        extra = {
            "ruins": ["遺跡地下", "地下遺跡", "遺跡"],
            "door": ["門之迷宮"],
            "slime": ["史萊姆迷宮", "史萊姆洞窟", "史來姆迷宮"],
            "dreamland": ["夢奇地"],
            "can_tunnel": ["罐頭地道"],
            "sand_keep": ["沙漠地城"],
            "castle_ug": ["古堡地下", "古堡地下迷宮"],
            "oni_hall": ["鬼之殿"],
            "kiri_sea": ["霧張之海"],
            "ryugu": ["龍宮"],
            "palace": ["空中宮殿"],
            "trial": ["試煉洞窟"],
            "thief": ["大盜巢穴"],
            "underworld": ["冥界洞窟"],
            "tomb": ["秘密古墓", "祕密古墓"],
            "basm": ["巴斯密洞", "巴斯迷宮"],
            "papa": ["趴趴迷宮"],
            "witch": ["威奇迷宮"],
            "ice": ["冰原洞窟"],
            "gresia": ["葛雷夏"],
            "rat": ["鼠洞"],
            "rainbow_mz": ["彩虹城迷宮", "彩虹地下城"],
            "gold_mz": ["金銀城迷宮", "金銀地下城"],
            "bird_mz": ["青鳥城迷宮", "青鳥地下城"],
            "town_base": ["市鎮地下室"],
            "cat_mz": ["貓迷宮"],
            "bluemeow": ["藍喵喵迷宮"],
            "nameless": ["不知名迷宮"],
            "west_secret": ["西方秘境", "西方祕境"],
            "witch_nx": ["威奇魔法陣"],
            "under": ["地底", "沈睡迷宮"],
            "darkcave": ["陰暗"],
            "wolf": ["大野狼"],
            "dragon": ["龍窟"],
            "skye": ["史蓋窩克海"],
            "skye_e": ["史蓋窩克海"],
        }
        if rec["id"] in extra:
            for e in extra[rec["id"]]:
                if a.startswith(norm(e)) or norm(e) in a:
                    return True
        for c in cands:
            if not c:
                continue
            if a.startswith(c) or c.startswith(a):
                return True
            if c in a:
                return True
        return False

    # attach drop rows
    for rec in places:
        rows = []
        for key, arr in drop_by_area.items():
            for a in arr:
                if match_area_name(a["a"], rec):
                    rows.append(a)
        # unique by area name
        seen = set()
        floors = []
        lvs, elems, drops = [], [], []
        for a in rows:
            if a["a"] in seen:
                continue
            seen.add(a["a"])
            floors.append({
                "a": a["a"], "lv": a.get("lv") or "", "e": a.get("e") or "",
                "d": a.get("d") or "", "m": a.get("m") or "",
            })
            if a.get("lv"):
                lvs.append(a["lv"])
            if a.get("e"):
                elems.append(a["e"])
            if a.get("d"):
                drops.append(a["d"])
        rec["floors"] = floors
        rec["lv"] = "、".join(lvs[:4]) + ("…" if len(lvs) > 4 else "")
        # merge unique elems
        elset = []
        for e in elems:
            for part in re.split(r"[、,，]", e):
                part = part.strip()
                if part and part not in elset:
                    elset.append(part)
        rec["elem"] = "、".join(elset)
        dset = []
        for d in drops:
            for part in re.split(r"[、,，]", d):
                part = part.strip()
                if part and part not in dset:
                    dset.append(part)
        rec["drops"] = dset[:18]

    # attach monsters
    for rec in places:
        found = []
        seen = set()
        for mname, arr in mon_by_map.items():
            # skip junk
            if "未開放" in mname or "卡獎品" in mname:
                continue
            dummy = {"id": rec["id"], "n": rec["n"], "aka": rec["aka"]}
            if match_area_name(mname, dummy) or any(norm(a) in mname or mname in norm(a) for a in names_of(rec)):
                for mo in arr:
                    if mo["n"] in seen:
                        continue
                    seen.add(mo["n"])
                    found.append(mo)
        rec["mons"] = found[:24]
        # dropExp 的出沒欄若還沒掛上，補進搜尋用名單
        seen_n = {mo["n"] for mo in rec["mons"]}
        for f in rec.get("floors") or []:
            for name in re.split(r"[、,，]", f.get("m") or ""):
                name = name.strip()
                if not name or name in seen_n:
                    continue
                seen_n.add(name)
                rec["mons"].append({"n": name, "e": "", "lv": f.get("lv") or "", "d": []})

    # gather
    for rec in places:
        gfound, gseen = [], set()
        keys = [norm(x) for x in names_of(rec)]
        for gloc, arr in gather_by.items():
            if any(k and (k in gloc or gloc.startswith(k)) for k in keys):
                for g in arr:
                    sig = g["n"] + "|" + str(g.get("sk"))
                    if sig in gseen:
                        continue
                    gseen.add(sig)
                    gfound.append(g)
        rec["gather"] = gfound[:16]

    # validate links
    missing = []
    for rec in places:
        rec["links"] = [x for x in rec["links"] if x in by_id]
        for x in rec["links"]:
            if rec["id"] not in by_id[x]["links"]:
                by_id[x]["links"].append(rec["id"])

    def pet_rel(mo):
        img = (mo.get("img") or "").replace("\\", "/")
        if img.startswith("../"):
            img = img[3:]
        return img if file_ok(img) else ""

    def hq_of(stem):
        for rel in ("htm/huan/hq/%s.png" % stem, "htm/huan/hq/%s.jpg" % stem):
            if file_ok(rel):
                return rel
        return ""

    catalog_rows = []
    cat_path = ROOT / "catalog_names.json"
    if cat_path.is_file():
        catalog_rows = json.loads(cat_path.read_text(encoding="utf-8"))
    cat_by_name = {}
    cat_by_id = {}
    for row in catalog_rows:
        cid = int(row.get("id") or 0)
        n = (row.get("n") or "").strip()
        if not cid or not n or "無法封印" in n or len(n) > 20:
            continue
        rel = hq_of(str(cid)) or ("htm/huan/client/%d.png" % cid if file_ok("htm/huan/client/%d.png" % cid) else "")
        rec = {"id": cid, "n": n, "img": rel}
        cat_by_id[cid] = rec
        cat_by_name.setdefault(n, rec)

    # 玩家點名的官方 21 稀有寵（敗家一族／巴哈整理）。典藏 e=「稀」只有其中 10 隻。
    OFFICIAL_21 = [
        ("雷爵獸", "金", "1", ["哈啾島", "聽說島", "玫瑰島"]),
        ("木頭貝貝", "木", "11–15", ["尼克草原"]),
        ("小木魚", "木", "1", ["巴斯迷宮B3", "巴斯密洞"]),
        ("小木精靈", "木", "65", ["天鵝湖"]),
        ("青草企鵝", "木", "1", ["遺跡地下7F", "地下遺跡"]),
        ("綠草菇", "木", "1", ["拇指花園"]),
        ("瓦特寶寶", "水", "1", ["史蓋窩克海B1"]),
        ("福瑞龍", "水", "65", ["米夏島"]),
        ("水貝貝", "水", "21–25", ["史蓋窩克海"]),
        ("火雷獸", "火", "65", ["金銀湖"]),
        ("火精靈", "火", "1", ["鬱金香島"]),
        ("火燒摳拉", "火", "1", ["瓦尼島"]),
        ("超合金機器人", "火", "1", ["陽光森林"]),
        ("熔岩獨角仙", "火", "1", ["罐頭地道B2"]),
        ("卡拉龍", "光", "1", ["椰子島"]),
        ("饅頭象", "光", "1", ["巨岩島"]),
        ("光雷獸", "光", "45", ["秘密古墓B3"]),
        ("光美哆", "光", "1", ["遺跡地下4F", "地下遺跡"]),
        ("闇夜獸", "闇", "1", ["冥界洞窟B3"]),
        ("黑皮怕啃", "闇", "1", ["遺跡地下12F", "地下遺跡"]),
        ("壞壞司瓦諾", "闇", "1", ["荷花池塘"]),
    ]
    RARE_SPRITE = {
        "卡拉龍": "htm/huan/cala.gif",
        "水貝貝": "htm/huan/babe.gif",
        # 火精靈原頁 s82.htm 用 gif/rx.gif。gif/fire.gif 是火力蟲，禁止再對錯。
        "火精靈": "htm/huan/gif/rx.gif",
    }
    # 典藏沒圖、但 LPQ 檔名表編號可信（≥61461）的官方稀有。
    RARE_CLIENT = {
        "青草企鵝": 61472,
        "綠草菇": 61686,
        "火燒摳拉": 61492,
        "超合金機器人": 61598,
        "熔岩獨角仙": 61699,
        "光美哆": 61512,
        "黑皮怕啃": 61518,
        "壞壞司瓦諾": 61713,
    }

    def client_card(n):
        cid = RARE_CLIENT.get(n)
        if not cid or cid < 61461:
            return ""
        rel = "htm/huan/client/%d.png" % cid
        return rel if file_ok(rel) else ""

    def maps_from_locs(locs):
        maps, seenp = [], set()
        qcard = False
        for loc in locs:
            if "獎品" in loc or "未開放" in loc:
                qcard = True
                continue
            for rec in places:
                if rec["id"] in seenp:
                    continue
                if match_area_name(loc, rec):
                    seenp.add(rec["id"])
                    maps.append({"id": rec["id"], "n": rec["n"], "r": rec["r"]})
        return maps, qcard

    rares = []
    seen_rare = set()
    by_mon = {mo["n"]: mo for mo in mons}
    for n, elem, lv, locs in OFFICIAL_21:
        mo = by_mon.get(n) or {}
        maps, qcard = maps_from_locs(list(mo.get("m") or []) + list(locs))
        # 名字以典藏幻獸頁為準；客戶端卡只用檔名表可信編號（≥61461）。
        img = hq_of(n) or pet_rel(mo) or RARE_SPRITE.get(n) or client_card(n) or ""
        if img and not file_ok(img):
            img = ""
        note = mo.get("note") or ("官方 21 稀有寵。出沒：" + "、".join(locs) + "。黑暗儀式招不出來。")
        rares.append({
            "n": n,
            "e": elem,
            "lv": (mo.get("s") or {}).get("等級") or lv,
            "img": img,
            "tags": ["稀有種"],
            "catch": any("娃娃盒" in (d or "") for d in (mo.get("d") or [])),
            "qcard": qcard,
            "note": note[:220],
            "maps": maps[:8],
            "k": (mo.get("k") or [])[:6],
        })
        seen_rare.add(n)

    for mo in mons:
        if mo["n"] in seen_rare:
            continue
        note = mo.get("note") or ""
        tags = []
        # 官方稀有種只有 OFFICIAL_21 那 21 隻；敗家把屬性欄寫「稀」的
        # 其他寵（小天使、藍鳳凰等 11 隻）另立「稀屬性」，不冒充稀有種。
        if mo.get("e") == "稀":
            tags.append("稀屬性")
        if "五顆星" in note or "冠軍" in note:
            tags.append("推薦抓")
        catch = any("娃娃盒" in (d or "") for d in (mo.get("d") or []))
        if catch:
            tags.append("可封印")
        if not tags:
            continue
        maps, qcard = maps_from_locs(mo.get("m") or [])
        seen_rare.add(mo["n"])
        rares.append({
            "n": mo["n"],
            "e": mo.get("e") or "",
            "lv": (mo.get("s") or {}).get("等級") or "",
            "img": hq_of(mo["n"]) or pet_rel(mo),
            "tags": tags,
            "catch": catch,
            "qcard": qcard,
            "note": note[:180],
            "maps": maps[:8],
            "k": (mo.get("k") or [])[:6],
        })
    official_order = {row[0]: i for i, row in enumerate(OFFICIAL_21)}
    rares.sort(key=lambda x: (
        0 if x["n"] in official_order else 1 if "稀屬性" in x["tags"] else 2 if "推薦抓" in x["tags"] else 3,
        official_order.get(x["n"], 99),
        x["n"],
    ))

    book = []
    for mo in mons:
        n = mo["n"]
        img = hq_of(n) or pet_rel(mo)
        book.append({
            "n": n,
            "e": mo.get("e") or "",
            "lv": (mo.get("s") or {}).get("等級") or "",
            "img": img,
            "r": mo.get("r") or "",
            "m": (mo.get("m") or [])[:8],
            "k": (mo.get("k") or [])[:8],
            "note": (mo.get("note") or "")[:160],
        })
    cards = []
    # 只有從 LPQ 檔名表抽出的編號才掛中文名；61001–61460 是依檔序硬編的，會對錯名字。
    for rec in sorted(cat_by_id.values(), key=lambda x: x["id"]):
        if not rec.get("img"):
            continue
        if rec["id"] < 61461:
            cards.append({"id": rec["id"], "n": "", "img": rec["img"]})
        else:
            cards.append(rec)
    sprite = {}
    for b in book:
        if b.get("img") and b["n"] not in sprite:
            sprite[b["n"]] = b["img"]
    for r in rares:
        if r.get("img"):
            sprite[r["n"]] = r["img"]

    # 官方路牌：客戶端 text/p01.adf（已解出的表）
    p01_path = Path(r"C:\Users\user-66990\Desktop\tai-tong-tools\research\fairyland_unpack\exports\client_text_tables.json")
    if p01_path.is_file():
        try:
            p01_tab = json.loads(p01_path.read_text(encoding="utf-8"))["tables"]["p01.adf"]
            p01_lines = p01_tab.get("lines") or []
        except Exception:
            p01_lines = []
        parsed_signs = []
        for ln in p01_lines:
            cols = str(ln).split("\t")
            if len(cols) < 3:
                continue
            try:
                x, y = int(cols[0]), int(cols[1])
            except Exception:
                continue
            t = cols[2].strip()
            if t:
                parsed_signs.append((x, y, t))
        for rec in places:
            keys = [norm(x) for x in names_of(rec) if x]
            stem = rec["n"]
            for suf in ("村", "城", "島", "港", "山", "湖", "林", "窟", "洞"):
                if stem.endswith(suf) and len(stem) > len(suf) + 1:
                    stem = stem[: -len(suf)]
                    break
            if stem and stem != rec["n"]:
                keys.append(norm(stem))
            found = []
            for x, y, t in parsed_signs:
                nt = norm(t)
                if any(k and len(k) >= 2 and (k in nt or ("往" + k) in nt) for k in keys):
                    found.append({"x": x, "y": y, "t": t})
            rec["signs"] = found[:24]
        print("p01 signs attached", sum(1 for r in places if r["signs"]))
    else:
        print("p01 json missing, skip official signs")

    # 2026 客戶端 maps\NNNNN.adf：中文名、連線、出沒；彩圖在 minimap.lpq
    CLIENT_NAME_ALIAS = {
        "巴斯密洞": ["巴斯秘洞"],
        "艾司伍林地": ["艾斯伍林地"],
        "彩虹城迷宮": ["彩虹地下迷宮"],
        "青鳥城迷宮": ["青鳥地底迷宮"],
        "金銀城迷宮": ["金銀地底迷宮"],
        "黑森林之北": ["黑森林北面"],
        "黑森林之南": ["黑森林南面"],
        "碗豆湖": ["豌豆湖"],
        "葛雷夏村與郊外": ["葛雷夏村", "葛雷夏郊外"],
        "史萊姆迷宮": ["史萊姆迷宮", "史來姆迷宮"],
        "大野狼洞窟": ["大野狼的洞窟", "大野狼洞窟"],
        "趴趴迷宮": ["趴趴迷宮", "趴趴迷宮B2", "趴趴迷宮B3"],
        "試煉洞窟": ["試煉洞窟", "試煉洞窟B1"],
        "霧張之海": ["霧張之海", "霧張之海B1", "霧張之海B2"],
        "龍宮": ["龍宮", "龍宮3F"],
        "地下遺跡": ["地下遺跡", "遺跡地下"],
        "古堡地下迷宮": ["古堡地下", "古堡地下迷宮"],
        "門之迷宮": ["門之迷宮"],
        "夢奇地": ["夢奇地"],
        "罐頭地道": ["罐頭地道", "罐頭地道B1", "罐頭地道B2"],
        "市鎮地下室": ["市鎮地下室"],
        "不知名迷宮": ["不知名迷宮"],
        "威奇魔法陣": ["威奇魔法陣"],
        "莫名其妙花叢": ["莫名其妙花叢"],
        "羅比特草原": ["羅比特草原"],
        "西迷路森林": ["西迷路森林"],
        "東迷路森林": ["東迷路森林"],
        "北貓咪森林": ["北貓咪森林"],
        "南貓咪森林": ["南貓咪森林"],
        "史蓋窩克海": ["史蓋窩克海"],
        "轉生神殿": ["轉生神殿"],
        "普諾特古堡": ["普諾特古堡"],
        "霧張秘洞": ["霧張秘洞", "霧張祕洞"],
        "藍喵喵迷宮": ["藍喵喵的迷宮"],
        "秘密古墓": ["秘密古幕"],
        "地道入口": ["罐頭地道B1"],
        "貓迷宮": ["貓迷宮"],
        "坦拉娜迷宮": ["坦拉娜迷宮"],
        "藍喵島": ["藍喵島"],
        "糖果屋迷宮": ["糖果屋迷宮"],
        "冰原洞窟": ["冰原洞窟", "冰原洞窟B1"],
        "卡拉斯山區": ["卡拉斯山"],
        "木偶山山腳": ["木偶山腳"],
        "空中宮殿": ["空中宮殿", "空中宮殿1F"],
        "大盜巢穴": ["大盜巢穴", "大盜巢穴B1"],
        "冥界洞窟": ["冥界洞窟", "冥界洞窟B1"],
        "史萊姆迷宮": ["史萊姆迷宮", "史來姆迷宮", "史來姆迷宮B1"],
    }

    def map_rank(mid):
        pfx = mid // 1000
        if pfx in (10, 40, 70):
            return 0
        if pfx == 61:
            return 1
        if pfx == 60:
            return 2
        if 20 <= pfx <= 39:
            return 5
        return 3

    def fmt_clv(mb):
        if not isinstance(mb, dict):
            return ""
        a, b = mb.get("lv"), mb.get("lv2")
        if a is None:
            return ""
        if b is not None and b != a:
            return "%s–%s" % (a, b)
        return str(a)

    def cmap_band(mid):
        pfx = mid // 1000
        if 20 <= pfx <= 39:
            return "room"
        if pfx == 60:
            return "maze"
        if pfx in (61, 62):
            return "island"
        return "world"

    client_rows = []
    cmap_file = ROOT / "client_maps.json"
    if cmap_file.is_file():
        raw_client = json.loads(cmap_file.read_text(encoding="utf-8")).get("maps") or []
        by_mid = {m["id"]: m for m in raw_client if "id" in m}
        name_idx = collections.defaultdict(list)
        for m in raw_client:
            n = norm(m.get("n") or "")
            if n:
                name_idx[n].append(m)

        def match_cmaps(rec):
            keys = [norm(x) for x in names_of(rec) if x]
            for extra in CLIENT_NAME_ALIAS.get(rec["n"], []):
                k = norm(extra)
                if k and k not in keys:
                    keys.append(k)
            found, seen = [], set()
            for k in keys:
                for m in name_idx.get(k, []):
                    if m["id"] not in seen:
                        seen.add(m["id"])
                        found.append(m)
            if not found:
                for k in keys:
                    if len(k) < 2:
                        continue
                    for m in raw_client:
                        if m["id"] in seen:
                            continue
                        cn = norm(m.get("n") or "")
                        if not cn:
                            continue
                        if cn.startswith(k) and len(cn) > len(k):
                            seen.add(m["id"])
                            found.append(m)
            found.sort(key=lambda m: (map_rank(m["id"]), m["id"]))
            return found

        matched_n = 0
        for rec in places:
            cands = match_cmaps(rec)
            pick = None
            forced = rec.get("mid") or CLIENT_MAP_ID.get(rec["id"])
            if forced and forced in by_mid:
                pick = by_mid[forced]
            elif cands:
                pick = cands[0]
            if not pick:
                continue
            matched_n += 1
            rec["mid"] = pick["id"]
            rec["cimg"] = pick.get("img")
            if pick["id"] in CLIENT_VER_DIFF:
                rec["cver"] = CLIENT_VER_DIFF[pick["id"]]
            rec["cto"] = []
            for tid in pick.get("to") or []:
                dest = by_mid.get(tid)
                if dest:
                    rec["cto"].append({"id": tid, "n": dest.get("n") or str(tid)})
            rec["cnpcs"] = [x.get("n") for x in (pick.get("npcs") or []) if x.get("n")][:16]
            have = {m["n"]: m for m in rec["mons"]}
            for mb in pick.get("mobs") or []:
                if not isinstance(mb, dict) or not mb.get("n"):
                    continue
                n = mb["n"]
                lv = fmt_clv(mb)
                if n in have:
                    have[n]["cs"] = True
                    if lv and not have[n].get("lv"):
                        have[n]["lv"] = lv
                else:
                    rec["mons"].append({"n": n, "e": "", "lv": lv, "cs": True})
            if rec.get("cimg"):
                gal = list(rec.get("gallery") or [])
                rec["gallery"] = [{"n": "客戶端地圖", "img": rec["cimg"]}] + [
                    g for g in gal if g.get("img") != rec["cimg"]
                ]
                # Keep 詳圖 as the place cover. Only fall back to the client file
                # when the old site never had a labelled map.
                if not rec.get("img"):
                    rec["img"] = rec["cimg"]
                note = rec.get("note") or ""
                if note.startswith("補圖"):
                    rec["note"] = "2026 客戶端彩色地圖。原站沒有平面圖。"
            dungeonish = any(k in rec["n"] for k in ("迷宮", "洞窟", "遺跡", "地道", "夢奇地", "地下室"))
            if dungeonish and len(cands) > 1:
                seen_img = {rec["cimg"]}
                for m in cands[1:10]:
                    im = m.get("img")
                    if im and im not in seen_img:
                        seen_img.add(im)
                        rec["gallery"].append({"n": "%s %s" % (m.get("n") or "", m["id"]), "img": im})

        pid_by_mid = {r["mid"]: r["id"] for r in places if r.get("mid")}
        for m in raw_client:
            mobs = []
            for mb in m.get("mobs") or []:
                if isinstance(mb, dict) and mb.get("n"):
                    mobs.append({"n": mb["n"], "lv": mb.get("lv"), "lv2": mb.get("lv2")})
            client_rows.append({
                "id": m["id"],
                "n": m.get("n") or ("地圖 %s" % m["id"]),
                "w": m.get("w") or 0,
                "h": m.get("h") or 0,
                "img": m.get("img"),
                "to": m.get("to") or [],
                "npcs": [x.get("n") for x in (m.get("npcs") or []) if x.get("n")][:12],
                "mobs": mobs[:20],
                "pid": pid_by_mid.get(m["id"]),
                "b": cmap_band(m["id"]),
                "ver": CLIENT_VER_DIFF.get(m["id"]),
            })
        print("client maps", len(client_rows), "places with mid", matched_n)
        missing = [r["n"] for r in places if not r.get("mid")]
        print("places without client id", len(missing), missing[:30])
    else:
        print("client_maps.json missing, skip 2026 client attach")

    out = {
        "title": "童話世界地圖",
        "credit": "原地圖由「徐大少」製作（遊戲基地原文）。資料來源「敗家一族」「IRON WOLVES」「官方網站」「遊戲基地」「巴哈姆特」。修改整合 by ROSS。2026 客戶端彩色小地圖來自 maps\\minimap.lpq。",
        "source": "https://www.geocities.ws/fairyland/worldmap.html",
        "note": "本頁是獨立離線重製。地名對齊 xFairyland；彩色地圖與編號來自 2026 客戶端；出沒與稀有寵對照敗家一族／巴哈整理。",
        "regions": REGIONS,
        "places": places,
        "rares": rares,
        "client": client_rows,
        "book": book,
        "cards": cards,
        "sprite": sprite,
        "order": [r[0] for r in P],
    }
    dest = ROOT / "data.js"
    text = "window.ATLAS=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
    dest.write_bytes(text.encode("utf-8"))
    print("wrote", dest, "bytes", dest.stat().st_size, "places", len(places))
    # sanity
    no_mon = [p["n"] for p in places if not p["mons"] and p["k"] != "city"]
    print("no mons", len(no_mon), no_mon[:20])
    no_img = [p["n"] for p in places if not p.get("img")]
    print("no img", len(no_img), no_img)
    print("book", len(book), "cards", len(cards), "sprite", len(sprite))
    print("rares", len(rares),
          "稀有種", sum(1 for x in rares if "稀有種" in x["tags"]),
          "推薦抓", sum(1 for x in rares if "推薦抓" in x["tags"]),
          "可封印", sum(1 for x in rares if "可封印" in x["tags"]))

if __name__ == "__main__":
    main()
