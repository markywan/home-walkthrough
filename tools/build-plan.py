# coding: utf-8
from pathlib import Path
from html import escape
import sys

out=[]
def add(s):out.append(s)
def rect(x,z,w,d,fill='#dfc89e',stroke='#b49a74',sw=1,rx=0,dash=''):
 add(f'<rect x="{100+x*100}" y="{150+z*100}" width="{w*100}" height="{d*100}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"'+(f' stroke-dasharray="{dash}"' if dash else '')+'/>')
def txt(x,z,text,size=13,fill='#284f4a',rotate=0,weight='400'):
 xx=100+x*100; yy=150+z*100
 add(f'<text x="{xx}" y="{yy}" text-anchor="middle" dominant-baseline="middle" font-size="{size}" font-weight="{weight}" fill="{fill}"'+(f' transform="rotate({rotate} {xx} {yy})"' if rotate else '')+f'>{escape(text)}</text>')
def line(x1,z1,x2,z2,col='#34564d',width=2,dash=''):
 add(f'<path d="M{100+x1*100} {150+z1*100} L{100+x2*100} {150+z2*100}" fill="none" stroke="{col}" stroke-width="{width}"'+(f' stroke-dasharray="{dash}"' if dash else '')+'/>')
def ellipse(x,z,rx,rz,fill='#fafbf7',stroke='#93a79e'):
 add(f'<ellipse cx="{100+x*100}" cy="{150+z*100}" rx="{rx*100}" ry="{rz*100}" fill="{fill}" stroke="{stroke}"/>')
def wall(x,z,w,d):rect(x,z,w,d,'#5e6964','#5e6964',0)
def dim(x1,z1,x2,z2,label):
 line(x1,z1,x2,z2,'#367b82',1)
 if z1==z2:
  line(x1,z1-.05,x1,z1+.05,'#367b82',1);line(x2,z2-.05,x2,z2+.05,'#367b82',1);txt((x1+x2)/2,z1-.13,label,14,'#367b82')
 else:
  line(x1-.05,z1,x1+.05,z1,'#367b82',1);line(x2-.05,z2,x2+.05,z2,'#367b82',1);txt(x1-.17,(z1+z2)/2,label,14,'#367b82',-90)
def door(z,hingeNorth=False):
 hingeZ=z if hingeNorth else z+.8;closedZ=z+.8 if hingeNorth else z
 hx=490;hy=150+hingeZ*100;cy=150+closedZ*100;sweep=1 if hingeNorth else 0
 add(f'<path d="M{hx} {hy} L{hx} {cy} A80 80 0 0 {sweep} 410 {hy} Z" fill="#e6eee9" fill-opacity=".5" stroke="none"/>')
 add(f'<path d="M{hx} {cy} A80 80 0 0 {sweep} 410 {hy}" stroke="#94aa9c" stroke-width="1" fill="none" stroke-dasharray="4 3"/>')
 line(3.1,hingeZ,3.9,hingeZ,'#a88757',4)
def bed(x,z,headNorth=False):
 rect(x,z,1.9,2.1,'#cfbc9a','#a7906c',1,5);rect(x+.05,z+.05,1.8,2,'#fbfaf3','#ddd9cd',1,5)
 for px in [x+.14,x+1.00]:rect(px,z+(.14 if headNorth else 1.60),.68,.34,'#fffef9','#dcd7ca',1,5)
 rect(x+.06,z+(1.50 if headNorth else .45),1.78,.35,'#9cac8d','#9cac8d',0,2)
 txt(x+.95,z+1.04,'床垫 1800×2000',15)

add('<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1010" viewBox="0 0 1100 1010"><rect width="1100" height="1010" fill="#fcfcf7"/><g font-family="PingFang SC,Microsoft YaHei,Arial,sans-serif">')
add('<text x="60" y="48" font-size="30" font-weight="650" fill="#234c43">方案 A · 当前布局</text><text x="60" y="80" font-size="15" fill="#718173">厨房窗下炒菜 · 餐区柜体到顶 / 台面统一 · 客厅齐腰窗</text><text x="1010" y="103" text-anchor="end" font-size="18" fill="#234c43">北 ↑</text>')
rect(.55,0,3.35,3.23,'#f3eddf','#c5cabc',1);rect(0,3.38,3.9,3.33,'#f3eddf','#c5cabc',1);rect(4.05,0,4.5,6.71,'#f8f4e9','#c5cabc',1)
rect(6.33,0,2.22,1.22,'#e6eeeb','#bccac6');rect(6.33,1.37,2.22,1.56,'#e6eeeb','#bccac6')
wall(.35,-.2,8.4,.2);wall(.35,0,.2,.75);wall(.35,2.45,.2,.78);wall(0,3.23,3.9,.15)
wall(-.2,6.71,4.8,.2);wall(5.5,6.71,3.25,.2);wall(3.9,0,.15,2.43);wall(3.9,3.23,.15,.25);wall(3.9,4.28,.15,2.43)
wall(6.18,0,.15,.55);wall(6.18,1.22,.15,.90);wall(6.33,1.22,2.22,.15);wall(6.18,2.93,2.37,.15)
wall(8.55,0,.2,6.71)
for x,z,length in [(.45,.75,1.70),(-.10,3.38,3.33),(8.65,.18,.87),(8.65,1.81,.83),(8.65,3.54,2.33)]:
 line(x,z,x,z+length,'#91c7d4',8);line(x,z,x,z+length,'#eaffff',2)
door(2.43);door(3.48,True)
bed(.55,0,True);rect(3.3,0,.6,2.2);txt(3.6,1.1,'移门衣柜 2200×600',14,rotate=90)
rect(.55,2.68,1.2,.55);txt(1.15,2.96,'书桌1200×550',11)
rect(.55,2.93,1.1,.30,'none','#6c937c',1,0,'4 2');ellipse(1.34,2.50,.20,.20,'#eef1e8')
txt(1.15,2.44,'上方浅吊柜',11,'#668473');txt(2.86,2.77,'入口留空',15,weight='600')
dim(2.45,1.38,3.3,1.38,'850');txt(1.50,.67,'次卧',18,weight='600')
bed(.6,4.61);rect(3.3,4.38,.6,2.33);txt(3.6,5.52,'移门衣柜 2330×600',14,rotate=90)
rect(.05,6.26,.5,.45);txt(.30,6.485,'床头柜',10);rect(2.5,6.31,.4,.4);txt(2.70,6.51,'床头',10)
txt(1.32,4.05,'主卧 · 北侧通道',18,weight='600')
line(.48,4.25,2.87,4.25,'#6f9884',2,'7 5')
rect(4.09,.035,.62,.65,'#edf1e9');txt(4.40,.36,'冰箱',13)
rect(4.75,0,.68,.7);txt(5.09,.35,'下柜',12);rect(5.43,0,.7,.7,'#eef1ed');ellipse(5.78,.38,.22,.22,'#d6e2df');txt(5.78,.88,'洗衣机',11)
rect(4.05,0,2.08,.3,'none','#648273',1,0,'4 3');txt(5.09,-.43,'通长顶柜 · H2650',14,weight='600')
rect(4.05,1.45,1.2,.7);txt(4.65,1.80,'餐桌1200×700',11);forChair=[4.44,4.98]
for x in forChair:rect(x-.2,2.07,.4,.4,'#e8ebe2','#acb69d',1,5)
txt(5.52,3.1,'餐区',19,weight='600')
rect(6.45,.06,.6,.42);ellipse(6.75,.28,.22,.14);ellipse(7.36,.55,.20,.29);rect(7.18,.06,.36,.20,'#fafbf7');txt(7.30,1.05,'坐便',10)
rect(7.68,.01,.86,1.19,'#e2ebe4','#bdcac2');line(7.65,0,7.65,.62,'#83bcc6',3)
rect(7.875,.25,.45,.60,'#fffef5','#96aaa1',1,4);ellipse(8.1,.55,.105,.225,'#b6c9c0')
for x in [7.90,8.24]:
 for k in range(7):line(x,.35+k*.053,x+.055,.35+k*.053,'#b3c1b6',1)
txt(8.1,1.07,'淋浴＋蹲便',11);txt(7.42,-.44,'卫生间（进深待核）',16,weight='600')
rect(6.33,1.37,2.22,.6,'#e1d6be');rect(7.95,1.97,.6,.96,'#e1d6be');rect(8.035,2.01,.43,.62,'#344540','#344540',1,4)
ellipse(8.25,2.18,.094,.094,'#344540','#d5dfd8');ellipse(8.25,2.48,.094,.094,'#344540','#d5dfd8');rect(6.54,1.46,.64,.46,'#c4d1cb','#8da399',1,5)
rect(7.35,1.37,1.2,.32,'none','#698c72',1,0,'4 3');txt(7.1,2.56,'厨房',19,weight='600');txt(8.25,2.78,'窗下灶',10)
rect(6.195,3.08,2.34,.55);line(6.795,3.08,6.795,3.63,'#b49a74',1);txt(6.495,3.35,'茶台',12);txt(7.68,3.35,'电视书柜',14)
rect(4.05,4.38,.3,2.07,'#dedfcf');txt(4.20,5.42,'玄关鞋柜',12,rotate=90)
rect(6,5.86,2.4,.85,'#e1e3d6','#aab2a4',1,10);rect(6.12,6.48,2.15,.15,'#d0d5c6','#aab2a4',1,5);txt(7.20,6.20,'沙发2400×850',15)
rect(6.75,5.01,.9,.45,'#dbc79d','#b49a74',1,17);txt(7.20,5.24,'茶几',12);rect(5.55,6.01,.45,.7)
txt(7.18,4.32,'客厅',23,weight='600');txt(5.05,6.91,'入户',15);line(5.15,5.7,5.15,3.9,'#8cab96',2,'7 5')
txt(8.99,4.69,'齐腰窗 · 窗台暂按900',13,rotate=90)
dim(.55,-.26,3.9,-.26,'3350');dim(0,7.15,3.9,7.15,'3900（墙内面）');dim(-.49,3.38,-.49,6.71,'3330');dim(.05,0,.05,3.23,'3230')
add('<text x="65" y="912" font-size="16" fill="#234c43">双卧移门衣柜 · 餐区电器台面H900 / 餐桌H760 · 厨房吊柜下沿H1520</text>')
add('<text x="65" y="944" font-size="14" fill="#8a7153">蹲便与地面齐平示意，排水须深化。冰箱型号、窗扇与烟机排烟待核。虚线为上柜。</text>')
add('<text x="65" y="974" font-size="14" fill="#7a8274">单位：毫米。房间与家具同一比例；右侧尺寸链未闭合，墙窗及净高仍以量房为准。</text></g></svg>')
Path(sys.argv[1]).write_text('\n'.join(out),encoding='utf-8')
