import math, os
OUT="/tmp/art/svg"; os.makedirs(OUT,exist_ok=True)
LAGO_A="#1b2a22"; LAGO_B="#2c4536"; SAND="#f2f0eb"; CORAL="#cdae6c"; CORAL_D="#b89a54"

def star_pts(cx,cy,r1,r2,n=8,rot=0):
    pts=[]
    for i in range(n*2):
        r=r1 if i%2==0 else r2
        a=math.pi*i/n+rot
        pts.append((cx+r*math.sin(a),cy-r*math.cos(a)))
    return " ".join(f"{x:.1f},{y:.1f}" for x,y in pts)

def head(w,h,name):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
<stop offset="0" stop-color="{LAGO_B}"/><stop offset="1" stop-color="{LAGO_A}"/>
</linearGradient>
<radialGradient id="glow" cx="0.5" cy="0.42" r="1.05">
<stop offset="0" stop-color="{CORAL}" stop-opacity="0.09"/><stop offset="0.5" stop-color="{CORAL}" stop-opacity="0.02"/><stop offset="1" stop-color="#101a14" stop-opacity="0.4"/>
</radialGradient>
<pattern id="lat" width="140" height="140" patternUnits="userSpaceOnUse">
<g fill="none" stroke="{SAND}" stroke-opacity="0.06">
<polygon points="{star_pts(70,70,66,27)}"/><circle cx="70" cy="70" r="34"/>
</g>
</pattern>
</defs>
<rect width="{w}" height="{h}" fill="url(#bg)"/>
<rect width="{w}" height="{h}" fill="url(#lat)"/>
'''
FOOT='<rect width="{w}" height="{h}" fill="url(#glow)"/>\n</svg>'

def save(name,w,h,body):
    with open(f"{OUT}/{name}.svg","w") as f:
        f.write(head(w,h,name)+body+FOOT.format(w=w,h=h))

C=f'stroke="{CORAL}"'; S=f'stroke="{SAND}"'
def g(body,sw=2.5,extra=""): return f'<g fill="none" {C} stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" {extra}>{body}</g>'
def gs(body,sw=1.6,op=0.55): return f'<g fill="none" {S} stroke-opacity="{op}" stroke-width="{sw}" stroke-linecap="round">{body}</g>'

W,H=800,470; cx,cy=400,235

# 1 tawhid — radiant 8-point star
b=f'<polygon points="{star_pts(cx,cy,118,48)}"/><polygon points="{star_pts(cx,cy,74,30,8,math.pi/8)}"/><circle cx="{cx}" cy="{cy}" r="10"/>'
rays="".join(f'<line x1="{cx+150*math.sin(a):.0f}" y1="{cy-150*math.cos(a):.0f}" x2="{cx+178*math.sin(a):.0f}" y2="{cy-178*math.cos(a):.0f}"/>' for a in [math.pi*i/4 for i in range(8)])
save("art-tawhid",W,H,g(b)+gs(rays))

# 2 khushu — mihrab arch + hanging lamp
arch=f'M {cx-95} 400 V 205 Q {cx-95} 130 {cx-45} 105 Q {cx-14} 90 {cx} 62 Q {cx+14} 90 {cx+45} 105 Q {cx+95} 130 {cx+95} 205 V 400'
lamp=f'<line x1="{cx}" y1="95" x2="{cx}" y2="150"/><circle cx="{cx}" cy="158" r="7"/><path d="M {cx-22} 172 H {cx+22} L {cx+13} 224 Q {cx} 236 {cx-13} 224 Z"/><line x1="{cx}" y1="236" x2="{cx}" y2="252"/><circle cx="{cx}" cy="258" r="4"/>'
inner=f'<path d="M {cx-70} 400 V 215 Q {cx-70} 150 {cx-28} 122 Q {cx} 104 {cx} 88 Q {cx} 104 {cx+28} 122 Q {cx+70} 150 {cx+70} 215 V 400"/>'
save("art-khushu",W,H,g(f'<path d="{arch}"/>'+lamp)+gs(inner))

# 3 character — balance
beam=f'<line x1="{cx}" y1="120" x2="{cx}" y2="330"/><line x1="{cx-130}" y1="150" x2="{cx+130}" y2="150"/><circle cx="{cx}" cy="120" r="8"/><path d="M {cx-40} 330 H {cx+40}"/><path d="M {cx-58} 344 H {cx+58}"/>'
def pan(px):
    return f'<line x1="{px}" y1="150" x2="{px-42}" y2="228"/><line x1="{px}" y1="150" x2="{px+42}" y2="228"/><path d="M {px-52} 228 Q {px} 274 {px+52} 228"/>'
save("art-scale",W,H,g(beam+pan(cx-130)+pan(cx+130))+gs(f'<circle cx="{cx-130}" cy="150" r="5"/><circle cx="{cx+130}" cy="150" r="5"/>'))

# 4 fatihah — open mushaf on rehal
book=f'M {cx} 150 Q {cx-70} 122 {cx-140} 150 V 258 Q {cx-70} 230 {cx} 258 Q {cx+70} 230 {cx+140} 258 V 150 Q {cx+70} 122 {cx} 150 V 258'
lines="".join(f'<path d="M {cx-116} {166+i*24} Q {cx-64} {143+i*24} {cx-22} {166+i*24}"/><path d="M {cx+22} {166+i*24} Q {cx+64} {143+i*24} {cx+116} {166+i*24}"/>' for i in range(4))
rehal=f'<line x1="{cx-96}" y1="382" x2="{cx+52}" y2="270"/><line x1="{cx+96}" y1="382" x2="{cx-52}" y2="270"/>'
save("art-fatihah",W,H,g(f'<path d="{book}"/>'+rehal)+gs(lines,1.5))

# 5 taif/seerah — palm + horizon + low sun
trunk=f'M {cx-8} 372 Q {cx-2} 300 {cx-14} 236'
fronds="".join(f'<path d="M {cx-14} 236 Q {cx-14+dx} {236+dy1} {cx-14+dx*2.1:.0f} {236+dy2}"/>' for dx,dy1,dy2 in [(-52,-34,-6),(-38,-52,-44),(-12,-60,-72),(16,-56,-60),(42,-40,-22),(56,-18,8)])
ground=f'<path d="M 120 372 Q {cx} 340 680 372"/>'
sun=f'<circle cx="590" cy="180" r="38"/>'
dates=f'<circle cx="{cx-26}" cy="252" r="4"/><circle cx="{cx-36}" cy="260" r="4"/><circle cx="{cx-18}" cy="262" r="4"/>'
save("art-taif",W,H,g(f'<path d="{trunk}"/>'+fronds+ground)+gs(sun+dates,1.8))

# 6 gratitude — rain onto seedling
drops="".join(f'<path d="M {x} {y} q 6 10 0 16 q -6 -6 0 -16"/>' for x,y in [(330,120),(400,96),(470,124),(365,168),(435,172)])
seed=f'<path d="M {cx} 356 Q {cx-4} 300 {cx} 268"/><path d="M {cx} 288 Q {cx-52} 270 {cx-58} 226 Q {cx-8} 232 {cx} 288"/><path d="M {cx} 300 Q {cx+48} 284 {cx+54} 244 Q {cx+10} 248 {cx} 300"/>'
pot=f'<path d="M 320 356 H 480"/><path d="M 344 400 Q {cx} 416 456 400"/>'
save("art-gratitude",W,H,g(seed+pot)+gs(drops,2.0,0.65))

# 7 qadar — interlaced squares (8-point star of order)
r=100
b=f'<rect x="{cx-r}" y="{cy-r}" width="{2*r}" height="{2*r}" rx="2"/><rect x="{cx-r}" y="{cy-r}" width="{2*r}" height="{2*r}" rx="2" transform="rotate(45 {cx} {cy})"/>'
save("art-qadar",W,H,g(b,2.4)+gs(f'<circle cx="{cx}" cy="{cy}" r="56"/><circle cx="{cx}" cy="{cy}" r="7"/>',1.7))

# 8 tongue — qalam writing a measured line
shaft=f'<path d="M 300 306 L 470 176 L 484 186 L 314 316 Z"/><line x1="452" y1="190" x2="466" y2="200"/>'
nib=f'<path d="M 300 306 L 281 331 L 314 316 Z"/><line x1="281" y1="331" x2="297" y2="311"/>'
swash=f'<path d="M 262 372 Q 380 340 470 362 Q 556 382 606 352" stroke-dasharray="none"/>'
save("art-tongue",W,H,g(shaft+nib,2.4)+gs(swash+f'<circle cx="628" cy="344" r="5"/>',2.0,0.6))

# 9 light verse — the lamp within glass, radiating
glass=f'<path d="M {cx-58} 200 Q {cx-64} 300 {cx} 316 Q {cx+64} 300 {cx+58} 200 Q {cx+34} 168 {cx} 166 Q {cx-34} 168 {cx-58} 200 Z"/>'
lamp=f'<path d="M {cx-20} 232 H {cx+20} L {cx+13} 276 Q {cx} 288 {cx-13} 276 Z"/><path d="M {cx} 200 q 11 12 0 22 q -11 -10 0 -22"/><line x1="{cx}" y1="222" x2="{cx}" y2="232"/>'
hang=f'<line x1="{cx}" y1="96" x2="{cx}" y2="166"/><circle cx="{cx}" cy="90" r="5"/>'
rays="".join(f'<line x1="{cx+126*math.sin(a):.0f}" y1="{240-126*math.cos(a):.0f}" x2="{cx+156*math.sin(a):.0f}" y2="{240-156*math.cos(a):.0f}"/>' for a in [math.pi*i/6 for i in range(12) if i not in (0,)])
save("art-lightverse",W,H,g(glass+lamp+hang,2.4)+gs(rays,1.7,0.6))

W2,H2=800,500; cy2=250
# v1 creation — crescent, star, orbit
cres=f'<path d="M 430 120 A 132 132 0 1 0 430 380 A 132 132 0 0 1 430 120 Z" transform="rotate(24 400 250)"/>'
orb=f'<ellipse cx="{cx}" cy="{cy2}" rx="272" ry="98" transform="rotate(-16 {cx} {cy2})" stroke-dasharray="2 13"/>'
st=f'<polygon points="{star_pts(572,140,24,10,5)}"/><circle cx="252" cy="356" r="4"/>'
save("vid-creation",W2,H2,g(cres,2.4)+gs(orb+st,1.7,0.6))

# v2 prayer — prayer rug
rug=f'<rect x="250" y="70" width="300" height="360" rx="6"/><rect x="274" y="94" width="252" height="312" rx="4"/>'
mih=f'<path d="M 310 406 V 260 Q 310 196 400 150 Q 490 196 490 260 V 406"/>'
lamp2=f'<circle cx="400" cy="216" r="9"/><line x1="400" y1="150" x2="400" y2="207"/>'
tass="".join(f'<line x1="{x}" y1="430" x2="{x}" y2="452"/>' for x in range(272,540,24))
save("vid-prayer",W2,H2,g(rug+mih)+gs(lamp2+tass,1.6))

# v3 mercy — rosette of circles
rc=74
circles="".join(f'<circle cx="{cx+rc*math.cos(math.pi*i/3):.1f}" cy="{cy2+rc*math.sin(math.pi*i/3):.1f}" r="{rc}"/>' for i in range(6))
save("vid-mercy",W2,H2,g(f'<circle cx="{cx}" cy="{cy2}" r="{rc}"/>'+circles,2.2)+gs(f'<circle cx="{cx}" cy="{cy2}" r="{rc*2}"/>',1.6))

# v4 repentance — door ajar, light through
frame=f'<path d="M 306 428 V 224 Q 306 142 400 108 Q 494 142 494 224 V 428"/><line x1="282" y1="428" x2="518" y2="428"/>'
leaf=f'<path d="M 400 428 V 116"/><path d="M 400 428 L 330 398 V 208 Q 352 158 400 128 Z"/>'
handle=f'<circle cx="384" cy="290" r="5"/>'
light="".join(f'<line x1="{416+i*10}" y1="{400-i*58}" x2="{472+i*14}" y2="{384-i*62}"/>' for i in range(4))
save("vid-door",W2,H2,g(frame+leaf,2.4)+gs(handle+light,1.7,0.55))

# v5 children — big & small arches
big=f'M 236 420 V 226 Q 236 150 330 118 Q 424 150 424 226 V 420'
small=f'M 452 420 V 300 Q 452 250 514 228 Q 576 250 576 300 V 420'
star_=f'<polygon points="{star_pts(514,158,26,11)}"/>'
save("vid-children",W2,H2,g(f'<path d="{big}"/><path d="{small}"/>')+gs(star_+f'<line x1="236" y1="420" x2="576" y2="420"/>',1.7))

# v6 patience — dunes and dawn
dunes=f'<path d="M 60 400 Q 240 300 430 372 Q 610 436 740 368"/><path d="M 60 340 Q 300 240 520 320 Q 660 368 740 322"/>'
sun2=f'<circle cx="560" cy="176" r="44"/>'+"".join(f'<line x1="{560+62*math.cos(a):.0f}" y1="{176+62*math.sin(a):.0f}" x2="{560+80*math.cos(a):.0f}" y2="{176+80*math.sin(a):.0f}"/>' for a in [math.pi+i*math.pi/6 for i in range(0,7)])
save("vid-patience",W2,H2,g(dunes)+gs(sun2,1.7))

print("generated", len(os.listdir(OUT)), "svgs")
