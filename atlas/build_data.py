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
    ["north_green", "west_green", "lettuce", "smile"], "copy/map2.htm#4", None,
    "人類首都。西綠野、萵苣村、微笑森林在四周，國庫與多數公會在此。")
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
    ["lettuce", "bluemeow", "blueisle"], "htm/map/fo.htm", "htm/map/map/fon.jpg",
    "萵苣村西南的山區，藍喵喵迷宮與藍喵島在這一帶。")
add("bluemeow", "藍喵喵迷宮", [], "mainland", "dungeon", 10.6, 47.2,
    ["pineapple", "blueisle"], None, None,
    "鳳梨山附近的迷宮。")
add("blueisle", "藍喵島", [], "mainland", "island", 8.4, 54.6,
    ["pineapple", "bluemeow"], None, None,
    "鳳梨山外海的小島。")
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
    ["rose_lake", "darkcave", "snow", "pea"], "copy/map2.htm#5", None,
    "精靈首都。木材、皮甲與修士工會多在此。")
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
    ["fear"], "htm/map/mg.htm", None,
    "害怕峽谷裡的多層鼠洞。")
add("puppet", "木偶山", [], "mainland", "mountain", 58.3, 61.3,
    ["fear", "northcave", "goldcity"], "htm/map/mu.htm", "htm/map/map/mu.jpg",
    "害怕峽谷東側，北方洞窟在山中；資料片拇指姑娘由此山腳進入。")
add("northcave", "北方洞窟", [], "mainland", "dungeon", 60.6, 56.8,
    ["puppet"], "htm/map/north.htm", "htm/map/north.jpg",
    "木偶山內的洞窟。")
add("goldcity", "金銀城", ["矮人首都"], "mainland", "city", 40.7, 76.2,
    ["ili", "goldlake", "lamp"], "copy/map2.htm#6", None,
    "矮人首都，打鐵與寶石公會在此。南金銀湖、東神燈沙漠。")
add("goldlake", "金銀湖", [], "mainland", "lake", 57.0, 82.4,
    ["goldcity", "gulu", "crystal"], "htm/map/hu.htm", "htm/map/map/gh.jpg",
    "金銀城東南的湖，湖外是咕嚕島。")
add("gulu", "咕嚕島", [], "mainland", "island", 62.7, 93.2,
    ["goldlake"], "htm/map/gu.htm", None,
    "金銀湖外海。")
add("lamp", "神燈沙漠", ["神祕沙漠"], "mainland", "desert", 66.5, 72.5,
    ["goldcity", "frog", "dragon"], "htm/map/shen.htm", "htm/map/map/shen.jpg",
    "金銀城東、青蛙沼澤南的沙漠，龍窟藏在沙裡。")
add("dragon", "龍窟", [], "mainland", "dungeon", 70.4, 76.8,
    ["lamp"], None, None,
    "神燈沙漠中的龍窟。")
add("crystal", "水晶山", [], "mainland", "mountain", 41.5, 88.5,
    ["goldlake", "nameless", "moon"], "htm/map/gi.htm", "htm/map/map/sg.jpg",
    "金銀湖南邊的山，不知名迷宮在山中。")
add("nameless", "不知名迷宮", [], "mainland", "dungeon", 38.2, 92.4,
    ["crystal"], None, None,
    "水晶山裡連名字都懶得取的迷宮。")
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
    ["dreamland", "can_tunnel"], None, None,
    "罐頭地道的入口。")
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
    "路線盡頭的古堡。")

# ----- 桃太郎 -----
add("peach", "桃花村", [], "momo", "village", 12, 48,
    ["greenhill"], None, None,
    "桃太郎資料片的村子。")
add("greenhill", "青葉丘", [], "momo", "field", 26, 36,
    ["peach", "tiger"], None, None,
    "村外丘陵。")
add("tiger", "虎之原", [], "momo", "field", 40, 48,
    ["greenhill", "oni_isle", "kirihari"], None, None,
    "往鬼島與霧張島的分岔原。")
add("oni_isle", "鬼島", [], "momo", "island", 58, 28,
    ["tiger", "oni_hall"], None, None,
    "海上鬼島。")
add("oni_hall", "鬼之殿", [], "momo", "dungeon", 74, 22,
    ["oni_isle"], None, None,
    "三層鬼殿。")
add("kirihari", "霧張島", [], "momo", "island", 58, 64,
    ["tiger", "kiri_cave", "kiri_sea"], None, None,
    "另一條出海線。")
add("kiri_cave", "霧張秘洞", [], "momo", "dungeon", 70, 78,
    ["kirihari"], None, None,
    "島上秘洞。")
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
    "往糖果屋迷宮的森林。")
add("candy_mz", "糖果屋迷宮", [], "candy", "dungeon", 88, 80,
    ["candy_ft"], None, None,
    "資料片同名迷宮。")


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
    "wani": "htm/map/wn.htm",
    "ruins": "htm/map/wani/4.htm",
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
    "wani": "htm/map/mg.jpg",
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
    "ryugu": "htm/map/new/lg1.gif",
    "tanlana": "htm/map/tan.jpg",
    "rose_isle": "htm/map/rose.jpg",
    "dragon": "htm/map/lon.jpg",
    "rainbow": "htm/map/rainbow2.jpg",
    "goldcity": "htm/map/gold2.jpg",
    "bluebird": "htm/map/bird2.jpg",
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

def resolve_img(pid, page, img):
    extra = EXTRA_IMG.get(pid)
    if extra and file_ok(extra):
        return extra
    if file_ok(img):
        return img
    if page:
        stem = Path(page.split("#")[0])
        for ext in (".jpg", ".gif", ".JPG", ".GIF"):
            cand = str(stem.with_suffix(ext)).replace("\\", "/")
            if file_ok(cand):
                return cand
    return img

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
        }
        if pid in EXTRA_PAGE:
            rec["page"] = EXTRA_PAGE[pid]
        if pid in LAYOUT:
            rec["x"], rec["y"] = LAYOUT[pid]
        rec["img"] = resolve_img(pid, rec["page"], rec["img"])
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

    out = {
        "title": "童話世界地圖",
        "credit": "原地圖由「徐大少」製作（遊戲基地原文）。資料來源「敗家一族」「IRON WOLVES」「官方網站」「遊戲基地」「巴哈姆特」。修改整合 by ROSS。",
        "source": "https://www.geocities.ws/fairyland/worldmap.html",
        "note": "本頁是獨立離線重製，不是原頁鏡像。名單與分區對齊 ROSS 的 xFairyland 世界地圖；等級、掉寶、幻獸來自敗家一族典藏數據。",
        "regions": REGIONS,
        "places": places,
        "order": [r[0] for r in P],
    }
    dest = ROOT / "data.js"
    text = "window.ATLAS=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
    dest.write_bytes(text.encode("utf-8"))
    print("wrote", dest, "bytes", dest.stat().st_size, "places", len(places))
    # sanity
    no_mon = [p["n"] for p in places if not p["mons"] and p["k"] != "city"]
    print("no mons", len(no_mon), no_mon[:20])

if __name__ == "__main__":
    main()
