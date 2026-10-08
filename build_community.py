"""Procedural, editable Thai canal-side community. Run phases inside Blender."""
import bpy
import math
import random
import json
from pathlib import Path
from mathutils import Vector

OUT = Path(r'C:\Users\User\Pictures\for-blender\Thai_Community')
random.seed(27)
COL = {}
MAT = {}
CACHE = {}

def collection(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent.children if parent else bpy.context.scene.collection.children).link(c)
    COL[name] = c
    return c

def material(name, color, rough=.75, metal=0):
    # Palette is authored in sRGB; use moderately enriched linear tones for the illustration.
    color = tuple(v ** 1.6 for v in color)
    m = bpy.data.materials.new('MAT_' + name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Roughness'].default_value = rough
    bs.inputs['Metallic'].default_value = metal
    MAT[name] = m
    return m

def mesh_obj(name, verts, faces, mat, coll, loc=(0,0,0), parent=None, key=None, smooth=False):
    cache_key = (key, mat) if key else None
    if cache_key and cache_key in CACHE:
        me = CACHE[cache_key]
    else:
        me = bpy.data.meshes.new('MESH_' + (str(key)[:90] if key else name))
        me.from_pydata(verts, [], faces)
        me.materials.append(MAT[mat])
        me.update()
        if smooth:
            for p in me.polygons:
                p.use_smooth = len(p.vertices) == 4
        if cache_key:
            CACHE[cache_key] = me
    ob = bpy.data.objects.new(name, me)
    COL[coll].objects.link(ob)
    ob.location = loc
    if parent:
        ob.parent = parent
    return ob

def empty(name, coll, loc=(0,0,0), angle=0, kind=None):
    ob = bpy.data.objects.new(name, None)
    COL[coll].objects.link(ob)
    ob.location = loc
    ob.rotation_euler.z = math.radians(angle)
    ob.empty_display_type = 'PLAIN_AXES'
    ob.empty_display_size = .6
    if kind:
        ob['asset_type'] = kind
    return ob

def box(name, loc, size, mat, coll, parent=None, angle=0):
    x,y,z = [v/2 for v in size]
    v = [(-x,-y,-z),(-x,-y,z),(-x,y,-z),(-x,y,z),(x,-y,-z),(x,-y,z),(x,y,-z),(x,y,z)]
    f = [(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)]
    ob = mesh_obj(name,v,f,mat,coll,loc,parent,('BOX',tuple(size)))
    ob.rotation_euler.z = math.radians(angle)
    return ob

def cylinder(name, loc, radius, depth, mat, coll, parent=None, n=12, rtop=None):
    rtop = radius if rtop is None else rtop
    verts = [(r*math.cos(i*math.tau/n),r*math.sin(i*math.tau/n),z) for r,z in [(radius,-depth/2),(rtop,depth/2)] for i in range(n)]
    faces = [tuple(reversed(range(n))), tuple(range(n,2*n))] + [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh_obj(name,verts,faces,mat,coll,loc,parent,('CYL',radius,rtop,depth,n),True)

def beam(name, a, b, r, mat, coll, parent=None, n=8):
    a,b = Vector(a),Vector(b)
    ob = cylinder(name,(a+b)/2,r,(b-a).length,mat,coll,parent,n)
    ob.rotation_euler = (b-a).to_track_quat('Z','Y').to_euler()
    return ob

def ellipsoid(name, loc, size, mat, coll, parent=None, rings=6, sectors=10):
    verts = [(0,0,-size[2])]
    for j in range(1,rings):
        phi = -math.pi/2 + math.pi*j/rings
        for i in range(sectors):
            th = math.tau*i/sectors
            verts.append((size[0]*math.cos(phi)*math.cos(th), size[1]*math.cos(phi)*math.sin(th), size[2]*math.sin(phi)))
    verts.append((0,0,size[2]))
    top = len(verts)-1
    faces = [(0,1+(i+1)%sectors,1+i) for i in range(sectors)]
    for j in range(rings-2):
        for i in range(sectors):
            a=1+j*sectors+i; b=1+j*sectors+(i+1)%sectors
            faces.append((a,b,b+sectors,a+sectors))
    faces.extend((top,1+(rings-2)*sectors+i,1+(rings-2)*sectors+(i+1)%sectors) for i in range(sectors))
    return mesh_obj(name,verts,faces,mat,coll,loc,parent,('ELL',tuple(size),rings,sectors))

def ribbon(name, points, width, z, mat, coll):
    pts=[Vector((x,y)) for x,y in points]
    verts=[]
    for i,p in enumerate(pts):
        t=(pts[min(i+1,len(pts)-1)]-pts[max(0,i-1)]).normalized()
        normal=Vector((-t.y,t.x))
        verts.extend([(p.x+normal.x*width/2,p.y+normal.y*width/2,z),(p.x-normal.x*width/2,p.y-normal.y*width/2,z)])
        if abs(abs(p.y)-95)<1e-6:
            verts[-2]=(verts[-2][0],p.y,z)
            verts[-1]=(verts[-1][0],p.y,z)
    return mesh_obj(name,verts,[(2*i,2*i+1,2*i+3,2*i+2) for i in range(len(pts)-1)],mat,coll)

def setup():
    # Create a separate scene so any pre-existing work remains recoverable.
    scene = bpy.data.scenes.new('Thai_Community_Base')
    bpy.context.window.scene = scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1
    scene.render.engine = 'BLENDER_EEVEE'
    root = collection('Thai_Community')
    hierarchy = {
        'ENVIRONMENT':['Ground','Terrain','Grass','Open_Areas','Street_Furniture'],
        'ROADS':['Main_Road','Secondary_Roads','Alleys','Intersections','Sidewalks','Bridge'],
        'RESIDENTIAL':['Houses','Fences','Gates','Carports'],
        'PUBLIC_BUILDINGS':['Community_Center','Health_Center'],
        'VEGETATION':['Trees','Bushes','Plants'],
        'WATER':['Canal','Canal_Banks','Water'],
        'VEHICLES':['Cars','Motorcycles'],
        'PEOPLE':['Adults','Elderly','Children'],
        'LIGHTING':[], 'CAMERAS':[]}
    for name, children in hierarchy.items():
        par=collection(name,root)
        for child in children: collection(child,par)
    palette = {
      'Ground':(.40,.49,.29),'Grass':(.34,.48,.22),'Grass_Light':(.46,.57,.30),
      'Earth':(.37,.28,.18),'Canal_Bank':(.58,.53,.39),'Road_Asphalt':(.18,.215,.23),
      'Concrete':(.66,.68,.63),'Paving':(.76,.73,.63),'Road_Paint':(.89,.87,.74),
      'Center_Line':(.73,.59,.30),'Wall_White':(.86,.86,.78),'Wall_Cream':(.78,.70,.53),
      'Wall_Sage':(.50,.63,.55),'Wall_Blue':(.50,.65,.69),'Wall_Peach':(.77,.57,.43),
      'Timber':(.34,.19,.10),'Timber_Light':(.54,.34,.19),'Roof_Red':(.47,.19,.115),
      'Roof_Green':(.19,.34,.29),'Roof_Slate':(.235,.31,.34),'Roof_Terracotta':(.62,.30,.16),
      'Trim':(.88,.85,.73),'Metal':(.21,.25,.24),'Glass':(.19,.38,.42),
      'Tree_Trunk':(.31,.215,.12),'Tree_Leaves':(.18,.36,.17),'Leaves_Light':(.30,.46,.20),
      'Leaves_Deep':(.115,.285,.16),'Palm_Leaves':(.25,.40,.16),'Water':(.15,.40,.39),
      'Tire':(.045,.053,.056),'Car_White':(.81,.83,.79),'Car_Silver':(.47,.55,.56),
      'Car_Blue':(.15,.32,.44),'Car_Red':(.48,.19,.135),'Car_Sand':(.58,.49,.34),
      'Light_Lens':(.94,.87,.60),'Tail_Lens':(.43,.08,.05),
      'Skin_Warm':(.56,.34,.20),'Skin_Light':(.73,.49,.31),'Skin_Deep':(.39,.23,.135),
      'Hair':(.065,.055,.045),'Hair_Grey':(.48,.48,.42),'Shirt_Teal':(.11,.43,.42),
      'Shirt_Coral':(.67,.29,.20),'Shirt_Cream':(.83,.77,.58),'Shirt_Blue':(.22,.37,.55),
      'Shirt_Lilac':(.49,.39,.54),'Trousers':(.15,.20,.25),'Flowers':(.77,.47,.52)}
    for n,c in palette.items():
        material(n,c,.3 if n in ['Glass','Water'] else .72,.25 if n=='Metal' else 0)
    scene['description']='Static Thai canal-side community. 1 unit = 1 metre. No prototype overlays.'
    scene['site_size_m']='200 x 190'
    scene['generator_seed']=27
    print('SETUP complete')

MAIN=[(-100,-32),(-57,-32),(-18,-27),(25,-27),(56,-22),(100,-22)]
WEST=[(-50,-31),(-50,7),(-47,32),(-50,61)]
EAST=[(12,-27),(12,7),(17,29),(20,62)]
NORTH=[(-50,58),(-21,61),(20,58)]

def cx(y): return 71+2.8*math.sin((y+20)/42)

def ground_roads():
    ys=list(range(-95,96,5))
    # Separate land slabs leave a real channel, not a water plane on the terrain.
    for side in ['West','East']:
        edge=[(cx(y)+(-8 if side=='West' else 8),y) for y in ys]
        poly=([(-100,-95)]+edge+[(-100,95)]) if side=='West' else ([edge[0]]+[(100,-95),(100,95)]+list(reversed(edge[1:])))
        # Ensure top winding is positive.
        area=sum(poly[i][0]*poly[(i+1)%len(poly)][1]-poly[(i+1)%len(poly)][0]*poly[i][1] for i in range(len(poly)))
        if area<0: poly.reverse()
        n=len(poly); verts=[(x,y,z) for z in [-2.5,0] for x,y in poly]
        faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        ob=mesh_obj('TERRAIN_'+side,verts,faces,'Ground','Ground')
        # Distinct soil sides on the cut-away site base.
        ob.data.materials.append(MAT['Earth'])
        for p in ob.data.polygons:
            if p.index!=1:p.material_index=1
    ribbon('CANAL_BED',[(cx(y),y) for y in ys],16,-1.5,'Earth','Canal')
    ribbon('WATER_CANAL',[(cx(y),y) for y in ys],11.2,-.66,'Water','Water')
    for s in [-1,1]:
        verts=[]
        for y in ys:
            verts.extend([(cx(y)+s*5.5,y,-.74),(cx(y)+s*8,y,.02)])
        mesh_obj('CANAL_BANK_'+('West' if s<0 else 'East'),verts,[(2*i,2*i+1,2*i+3,2*i+2) for i in range(len(ys)-1)],'Canal_Bank','Canal_Banks')
        ribbon('CANAL_GRASS_VERGE_'+str(s),[(cx(y)+s*9.5,y) for y in ys],3,.025,'Grass','Grass')
    ribbon('CANAL_EAST_FOOTPATH',[(cx(y)+12,y) for y in ys],2,.065,'Paving','Sidewalks')
    for name,pts,w,co in [('ROAD_MAIN_001',MAIN,8,'Main_Road'),('ROAD_SECONDARY_001',WEST,5.5,'Secondary_Roads'),('ROAD_SECONDARY_002',EAST,5.5,'Secondary_Roads'),('ROAD_SECONDARY_003',NORTH,5,'Secondary_Roads')]:
        # Road widths exclude the walkable shoulders.
        ribbon(name+'_Shoulders',pts,w+2.8,.06,'Concrete','Sidewalks')
        ribbon(name,pts,w,.12 if co=='Main_Road' else .125,'Road_Asphalt',co)
    for i,(pts,w) in enumerate([([(-96,12),(-75,12),(-50,12)],3),([(-94,64),(-73,63),(-50,58)],3),([(-35,-29),(-35,-48),(-12,-49)],3),([(34,-25),(34,-41)],3.5)],1):
        ribbon('ROAD_ALLEY_%03d'%i,pts,w,.135,'Concrete','Alleys')
    for i,(x,y) in enumerate([(-50,-31),(12,-27),(-50,58),(20,58),(-50,12)],1):
        obj=empty('INTERSECTION_%03d'%i,'Intersections',(x,y,.14),kind='junction')
        obj['junction_type']='T-junction'
    # Segmented center paint, excluding junction mouths.
    k=0
    for a,b in zip(MAIN[:-1],MAIN[1:]):
        a,b=Vector(a),Vector(b); length=(b-a).length; t=(b-a).normalized()
        for d in range(3,int(length)-2,7):
            p=a+t*d
            if any(abs(p.x-x)<7 for x in [-50,12,-35,34,71]):continue
            k+=1
            ob=box('ROAD_MAIN_Dash_%03d'%k,(p.x,p.y,.143),(2.8,.12,.012),'Center_Line','Main_Road')
            ob.rotation_euler.z=math.atan2(t.y,t.x)
    # The bridge follows the main road over the actual open canal.
    b=empty('BRIDGE_001','Bridge',(71,-22,0),kind='bridge')
    box('BRIDGE_001_Deck',(0,0,-.02),(21,10,.45),'Concrete','Bridge',b)
    box('BRIDGE_001_Surface',(0,0,.145),(21,8,.05),'Road_Asphalt','Bridge',b)
    for y in [-4.55,4.55]:
        box('BRIDGE_001_Walkway',(0,y,.27),(21,1,.25),'Paving','Bridge',b)
        for x in range(-10,11,2):
            box('BRIDGE_001_Railing_Post',(x,y,.92),(.13,.13,1.15),'Trim','Bridge',b)
        for z in [.67,1.40]:box('BRIDGE_001_Rail',(0,y,z),(21,.12,.12),'Trim','Bridge',b)
    for x in [-6.5,6.5]:box('BRIDGE_001_Pier',(x,0,-.9),(.8,8.4,1.5),'Concrete','Bridge',b)
    # Main open areas are deliberately clear and accessible.
    box('OPEN_Community_Green',(40,49,.035),(27,25,.05),'Grass_Light','Open_Areas')
    box('OPEN_Future_Lot',(-1,-78,.025),(29,24,.04),'Grass_Light','Open_Areas')
    box('PLAZA_Community_Forecourt',(37,-1,.07),(27,12,.12),'Paving','Open_Areas')
    ribbon('PATH_Green_Access',[(55,-17),(55,16),(55,62),(28,62)],2,.085,'Paving','Sidewalks')
    ribbon('PATH_Green_Entry',[(17,48),(26,48)],2,.085,'Paving','Sidewalks')
    print('GROUND / ROADS / CANAL complete')

def roof(prefix,w,d,z,h,mat,co,pa,hip=False):
    x=w/2;y=d/2
    if hip:
        verts=[(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z),(-x+w*.23,0,z+h),(x-w*.23,0,z+h)]
        faces=[(0,1,5,4),(1,2,5),(2,3,4,5),(3,0,4),(3,2,1,0)]
    else:
        verts=[(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z),(-x,0,z+h),(x,0,z+h)]
        faces=[(0,1,5,4),(2,3,4,5),(3,0,4),(1,2,5),(3,2,1,0)]
    mesh_obj(prefix+'_Roof',verts,faces,mat,co,parent=pa,key=('ROOF',w,d,z,h,hip))
    for yy in [-y,y]:box(prefix+'_Fascia',(0,yy,z-.04),(w,.14,.20),'Trim',co,pa)
    rx=x-w*.23 if hip else x
    beam(prefix+'_Ridge',(-rx,0,z+h+.04),(rx,0,z+h+.04),.11,mat,co,pa)
    # Lightweight roof seams follow the actual roof slope.
    count=int(w/.8)
    for i in range(1,count):
        xx=-x+i*w/count
        zz=h if not hip else h*min(1,(x-abs(xx))/(w*.23))
        yy=y*(1-zz/h)
        for s in [-1,1]:
            beam(prefix+'_Roof_Seam', (xx,s*y,z+.025),(xx,s*yy,z+zz+.025),.023,mat,co,pa,n=5)

def window(prefix,x,y,z,w,h,co,pa,side=False):
    if not side:
        box(prefix+'_Frame',(x,y,z),(w+.18,.14,h+.18),'Trim',co,pa)
        box(prefix+'_Glass',(x,y-.085,z),(w,.045,h),'Glass',co,pa)
        box(prefix+'_Mullion',(x,y-.12,z),(.065,.055,h),'Trim',co,pa)
        box(prefix+'_Sill',(x,y-.16,z-h/2),(w+.3,.30,.10),'Concrete',co,pa)
    else:
        box(prefix+'_Frame',(x,y,z),(.14,w+.18,h+.18),'Trim',co,pa)
        sign=1 if x>0 else -1
        box(prefix+'_Glass',(x+sign*.085,y,z),(.045,w,h),'Glass',co,pa)
        box(prefix+'_Mullion',(x+sign*.12,y,z),(.055,.065,h),'Trim',co,pa)

def fence(prefix,w,d,pa,style):
    co='Fences'
    for x in [-w/2,w/2]:
        box(prefix+'_Side_Base',(x,0,.29),(.22,d,.48),'Concrete',co,pa)
        for y in [-d/2,0,d/2]:box(prefix+'_Fence_Post',(x,y,.77),(.25,.25,1.45),'Concrete',co,pa)
        for z in [.75,1.25]:box(prefix+'_Side_Rail',(x,0,z),(.085,d,.085),'Timber' if style else 'Metal',co,pa)
    # Wide entrance aligned with driveway, kept open.
    for start,end in [(-w/2,-2.6),(2.6,w/2)]:
        mid=(start+end)/2; length=end-start
        box(prefix+'_Front_Base',(mid,-d/2,.30),(length,.22,.48),'Concrete',co,pa)
        for z in [.7,1.2]:box(prefix+'_Front_Rail',(mid,-d/2,z),(length,.08,.08),'Timber' if style else 'Metal',co,pa)
        for i in range(int(length/.7)+1):
            x=start+i*length/max(1,int(length/.7))
            box(prefix+'_Picket',(x,-d/2,.86),(.07,.09,.80),'Timber_Light' if style else 'Metal',co,pa)
    for x in [-2.65,2.65]:
        box(prefix+'_Gate_Pier',(x,-d/2,.75),(.38,.38,1.4),'Concrete','Gates',pa)
        box(prefix+'_Gate_Cap',(x,-d/2,1.5),(.47,.47,.12),'Trim','Gates',pa)

def pot(prefix,loc,pa,co='Plants'):
    x,y,z=loc
    cylinder(prefix+'_Pot',(x,y,z+.29),.29,.54,'Roof_Terracotta',co,pa,n=10,rtop=.38)
    ellipsoid(prefix+'_Plant',(x,y,z+.72),(.45,.43,.50),'Leaves_Light',co,pa,rings=5,sectors=8)

def house(i,x,y,angle,typ):
    name='HOUSE_%03d'%i
    pa=empty(name,'Houses',(x,y,0),angle,'residential_house')
    pa['house_type']=['House_Type_A_Gable','House_Type_B_Hip','House_Type_C_Two_Storey','House_Type_D_Raised_Timber'][typ]
    w=[10,10.8,9.2,10][typ];d=[8.8,9.2,8.6,8.8][typ]
    floor=1.65 if typ==3 else .55
    wallh=5.9 if typ==2 else 3.05
    wall=['Wall_Cream','Wall_Sage','Wall_White','Timber'][typ]
    if i%3==0 and typ!=3:wall=['Wall_Peach','Wall_Blue','Wall_Cream'][i%3]
    roofmat=['Roof_Red','Roof_Green','Roof_Slate','Roof_Terracotta'][i%4]
    box(name+'_Yard',(0,-.6,.025),(17,18,.04),'Grass_Light' if i%2 else 'Grass','Grass',pa)
    box(name+'_Driveway',(0,-6.8,.075),(4.9,5.0,.10),'Concrete','Houses',pa)
    if typ==3:
        for px in [-4,0,4]:
            for py in [-3.5,3.5]:box(name+'_Stilt',(px,py,.88),(.40,.40,1.75),'Concrete','Houses',pa)
    else:box(name+'_Foundation',(0,0,.26),(w+.4,d+.4,.52),'Concrete','Houses',pa)
    box(name+'_Walls',(0,0,floor+wallh/2),(w,d,wallh),wall,'Houses',pa)
    box(name+'_Floor_Edge',(0,0,floor),(w+.28,d+.28,.18),'Trim','Houses',pa)
    if typ==2:box(name+'_Storey_Band',(0,0,3.5),(w+.15,d+.15,.16),'Concrete','Houses',pa)
    roof(name,w+1.3,d+1.5,floor+wallh,.29*d,roofmat,'Houses',pa,typ==1)
    for zz in ([2.0,4.85] if typ==2 else [floor+1.5]):
        for xx in [-w*.29,w*.29]: window(name,xx,-d/2-.055,zz,1.65,1.40,'Houses',pa)
        for xx in [-w/2-.055,w/2+.055]:
            for yy in [-2,1.9]:window(name,xx,yy,zz,1.4,1.3,'Houses',pa,True)
    box(name+'_Door_Frame',(0,-d/2-.09,floor+1.12),(1.32,.18,2.24),'Trim','Houses',pa)
    box(name+'_Door',(0,-d/2-.2,floor+1.08),(1.10,.07,2.12),'Timber_Light','Houses',pa)
    cylinder(name+'_Door_Handle',(.36,-d/2-.26,floor+1.04),.055,.08,'Metal','Houses',pa,n=8).rotation_euler.x=math.pi/2
    porchdepth=2.2
    box(name+'_Veranda',(0,-d/2-.9,floor-.10),(w*.65,porchdepth,.20),'Paving','Houses',pa)
    roof(name+'_Porch',w*.69,2.7,floor+2.6,.55,roofmat,'Houses',pa)
    # Move the porch roof geometry as one editable component group.
    for ob in list(pa.children):
        if ob.name.startswith(name+'_Porch'):ob.location.y-=d/2+.8
    for xx in [-w*.29,w*.29]:box(name+'_Porch_Column',(xx,-d/2-1.6,floor+1.23),(.16,.16,2.5),'Timber_Light' if typ==3 else 'Trim','Houses',pa)
    steps=max(2,round(floor/.22))
    for k in range(steps):
        h=floor*(k+1)/steps
        box(name+'_Entry_Step',(0,-d/2-2.8+(k*.26),h/2),(2.2,.30,h),'Concrete','Houses',pa)
    if typ==3:
        for xx in [-w*.29,w*.29]:
            box(name+'_Veranda_Rail',(xx,-d/2-.9,floor+.85),(.08,1.8,.10),'Timber_Light','Houses',pa)
        for j in range(12):
            box(name+'_Weatherboard',(0,d/2+.015,floor+j*.245),(w,.035,.025),'Timber_Light','Houses',pa)
    if i%3==1:
        cp=empty(name+'_Carport','Carports')
        cp.parent=pa;cp.location=(-6.8,-2,0)
        box(name+'_Carport_Pad',(0,0,.07),(3.5,5.5,.12),'Concrete','Carports',cp)
        box(name+'_Carport_Roof',(0,0,2.8),(3.8,5.8,.13),'Roof_Slate','Carports',cp)
        for xx in [-1.55,1.55]:
            for yy in [-2.35,2.35]:box(name+'_Carport_Post',(xx,yy,1.4),(.10,.10,2.8),'Metal','Carports',cp)
    if i%4!=0:fence(name,17,18,pa,typ==3)
    pot(name+'_Planter',(-2.2,-d/2-1.4,floor),pa)
    if i%2:
        # Domestic clay water jar beside the wall, a quiet regional detail.
        ellipsoid(name+'_Water_Jar',(w/2+1,2,.64),(.51,.51,.61),'Timber_Light','Houses',pa)
        cylinder(name+'_Jar_Lid',(w/2+1,2,1.24),.29,.08,'Roof_Terracotta','Houses',pa)
    return pa

def public_buildings():
    co='Community_Center'; pa=empty('BUILDING_COMMUNITY_CENTER',co,(37,18,0),kind='community_center')
    box('COMMUNITY_Platform',(0,0,.36),(25,19,.70),'Concrete',co,pa)
    box('COMMUNITY_Hall',(0,2,3.0),(21,12,4.7),'Wall_Cream',co,pa)
    roof('COMMUNITY_Main',25,19,5.65,4.0,'Roof_Red',co,pa,True)
    # A second modest roof tier over the ridge gives the hall a Thai civic silhouette.
    roof('COMMUNITY_Upper',17,7.2,9.25,1.95,'Roof_Red',co,pa,True)
    for xx in [-10,-5,0,5,10]:box('COMMUNITY_Veranda_Column',(xx,-7.2,3.15),(.32,.32,5.0),'Trim',co,pa)
    for xx in [-7.4,-3.7,3.7,7.4]:window('COMMUNITY',xx,-4.07,2.9,2.3,2.6,co,pa)
    box('COMMUNITY_Entrance_Frame',(0,-4.1,2.25),(2.6,.20,3.1),'Trim',co,pa)
    box('COMMUNITY_Entrance_Glass',(0,-4.23,2.2),(2.35,.045,2.85),'Glass',co,pa)
    box('COMMUNITY_Entrance_Mullion',(0,-4.28,2.2),(.09,.06,2.85),'Trim',co,pa)
    for k in range(3):box('COMMUNITY_Entry_Step',(0,-10.6+k*.42,(k+1)*.12),(8,.48,(k+1)*.24),'Concrete',co,pa)
    # Accessible sloped side approach.
    mesh_obj('COMMUNITY_Access_Ramp',[(9,-14,.1),(11,-14,.1),(11,-9,.72),(9,-9,.72)],[(0,1,2,3)],'Concrete',co,parent=pa)
    for yy in [0,4.5]:
        for xx in [-10.6,10.6]:window('COMMUNITY',xx,yy,2.95,2.1,2.4,co,pa,True)
    for xx in [-10,10]:pot('COMMUNITY_Planter',(xx,-6.5,.72),pa)
    # Parking along the road-facing edge, with a separate pedestrian forecourt.
    box('COMMUNITY_Parking',(36,-15,.10),(24,7,.18),'Road_Asphalt',co)
    for i in range(8):box('COMMUNITY_Parking_Line',(25.5+i*3,-15,.20),(.09,5.2,.012),'Road_Paint',co)
    co='Health_Center'; pa=empty('BUILDING_HEALTH_CENTER',co,(28,-55,0),180,'health_center')
    box('CLINIC_Foundation',(0,0,.3),(23,14,.58),'Concrete',co,pa)
    box('CLINIC_Main',(0,0,2.45),(21,12,4.3),'Wall_White',co,pa)
    box('CLINIC_Sage_Band',(0,-6.02,1.03),(21,.08,.72),'Wall_Sage',co,pa)
    roof('CLINIC',22.5,13.5,4.6,2.0,'Roof_Green',co,pa,True)
    box('CLINIC_Entrance_Canopy',(0,-8.5,3.5),(9,5.5,.25),'Wall_Sage',co,pa)
    for xx in [-4,4]:box('CLINIC_Canopy_Post',(xx,-10.4,1.8),(.18,.18,3.6),'Trim',co,pa)
    for xx in [-7.6,-4.5,4.5,7.6]:window('CLINIC',xx,-6.08,2.65,2,1.7,co,pa)
    box('CLINIC_Double_Door',(0,-6.13,1.88),(2.6,.12,2.7),'Glass',co,pa)
    box('CLINIC_Door_Mullion',(0,-6.22,1.88),(.08,.08,2.7),'Trim',co,pa)
    box('CLINIC_Porch',(0,-8.5,.29),(10,5,.56),'Paving',co,pa)
    mesh_obj('CLINIC_Access_Ramp',[(-5,-14,.08),(-3,-14,.08),(-3,-10,.57),(-5,-10,.57)],[(0,1,2,3)],'Concrete',co,parent=pa)
    for xx in [-9.5,9.5]:pot('CLINIC_Planter',(xx,-7,0),pa)
    box('CLINIC_Parking',(47,-44,.10),(12,15,.18),'Road_Asphalt',co)
    ribbon('CLINIC_Drive',[(48,-25),(48,-37)],4,.15,'Concrete',co)
    for i in range(5):box('CLINIC_Parking_Line',(48,-50+i*3,.20),(8,.09,.012),'Road_Paint',co)

def buildings():
    public_buildings()
    sites=[(-77,-3,90,0),(-77,32,90,3),(-77,52,90,1),(-77,78,90,2),
           (-29,-4,-90,1),(-28,23,-90,2),(-27,44,-90,3),
           (-5,-3,90,0),(-5,23,90,3),(-4,44,90,1),
           (-32,79,0,0),(-7,80,0,2),(22,80,0,1),
           (-77,-58,180,3),(-53,-58,180,0),(-26,-60,180,2)]
    for i,s in enumerate(sites,1):house(i,*s)
    driveways=[
      [(-68,-3),(-51,-3)],[(-68,32),(-48,32)],[(-68,52),(-51,52)],
      [(-68,78),(-58,78),(-58,62)],
      [(-38,-4),(-49,-4)],[(-37,23),(-47,23)],[(-36,44),(-49,44)],
      [(4,-3),(12,-3)],[(4,23),(16,23)],[(5,44),(19,44)],
      [(-32,70),(-32,60)],[(-7,71),(-7,60)],[(22,71),(20,59)],
      [(-77,-49),(-77,-34)],[(-53,-49),(-53,-34)],[(-26,-51),(-26,-30)]]
    for i,points in enumerate(driveways,1):
        points=trim_driveway(i,points)
        ribbon('HOUSE_%03d_Road_Access'%i,points,3.4,.15,'Concrete','Alleys')
    print('BUILDINGS complete: 16 homes, 2 public buildings')

def trim_driveway(i,points):
    road,width=(WEST,5.5) if i<=7 else ((EAST,5.5) if i<=10 else ((NORTH,5) if i<=13 else (MAIN,8)))
    if i==4:road,width=[(-94,64),(-73,63),(-50,58)],3
    end=Vector(points[-1]);choices=[]
    for a,b in zip(road[:-1],road[1:]):
        a,b=Vector(a),Vector(b);t=max(0,min(1,(end-a).dot(b-a)/(b-a).length_squared))
        q=a+t*(b-a);choices.append(((q-end).length,q))
    q=min(choices,key=lambda x:x[0])[1]
    final=q+(Vector(points[-2])-q).normalized()*(width/2-.03)
    return points[:-1]+[tuple(final)]

def tree(i,x,y,kind=0,h=7):
    pa=empty('TREE_%03d'%i,'Trees',(x,y,0),random.uniform(0,360),'tree')
    pa['tree_variant']=['Broadleaf','Tropical_Spreading','Palm','Small_Fruit'][kind]
    if kind==2:
        beam(pa.name+'_Trunk',(0,0,0),(.35,0,h),.20,'Tree_Trunk','Trees',pa,n=10)
        for j in range(8):
            a=j*math.tau/8
            v=[]
            for k in range(5):
                t=k/4; r=.15+t*3.4; z=h+.7*math.sin(t*math.pi)-t*.8
                wide=.48*math.sin(t*math.pi)+.02
                for s in [-1,1]:v.append((.35+r*math.cos(a)-s*wide*math.sin(a),r*math.sin(a)+s*wide*math.cos(a),z))
            mesh_obj(pa.name+'_Frond',v,[(k*2,k*2+1,k*2+3,k*2+2) for k in range(4)],'Palm_Leaves','Trees',parent=pa,key=('FROND',j,h))
        for j in range(3):ellipsoid(pa.name+'_Coconut',(.4+j*.15,.1,h-.2),(.18,.18,.22),'Timber','Trees',pa,rings=4,sectors=6)
    else:
        crown=h*.67
        beam(pa.name+'_Trunk',(0,0,0),(0,0,crown),.28 if h>6 else .19,'Tree_Trunk','Trees',pa)
        for j in range(3):
            a=j*math.tau/3
            beam(pa.name+'_Branch',(0,0,h*.40),(math.cos(a)*1.4,math.sin(a)*1.4,h*.68),.13,'Tree_Trunk','Trees',pa)
        if kind==1:
            clusters=[(-1.55,0,crown,2.25),(1.5,.4,crown+.25,2.2),(0,-1.3,crown+.6,2.4),(0,.6,crown+1.7,1.9)]
        else:clusters=[(-1,0,crown,1.8),(1,.4,crown+.5,1.95),(0,-.6,crown+1.65,1.8)]
        factor=h/7
        for j,(xx,yy,zz,r) in enumerate(clusters):
            ellipsoid(pa.name+'_Crown_%02d'%j,(xx*factor,yy*factor,zz),(r*factor,r*factor,r*(.8 if kind==1 else 1.05)*factor),['Tree_Leaves','Leaves_Light','Leaves_Deep'][(i+j)%3],'Trees',pa,rings=7,sectors=12)
    cylinder(pa.name+'_Soil',(0,0,.035),.65,.06,'Earth','Plants',pa,n=12)

def bench(name,x,y,angle=0):
    pa=empty(name,'Street_Furniture',(x,y,.05),angle,'bench')
    for yy in [-.23,0,.23]:box(name+'_Seat',(0,yy,.48),(1.9,.19,.10),'Timber_Light','Street_Furniture',pa)
    for z in [.83,1.08]:box(name+'_Back',(0,.33,z),(1.9,.09,.18),'Timber_Light','Street_Furniture',pa)
    for xx in [-.68,.68]:
        box(name+'_Leg',(xx,0,.23),(.09,.52,.46),'Metal','Street_Furniture',pa)
        box(name+'_Back_Post',(xx,.34,.76),(.07,.07,.72),'Metal','Street_Furniture',pa)

def vegetation():
    sites=[(-92,-79,1,7),(-91,-45,0,7),(-94,-5,1,8),(-94,34,0,7),(-94,83,2,9),
       (-61,82,0,7),(-60,43,3,5),(-62,-5,2,7),(-63,-76,1,7),(-41,-77,3,5),
       (-40,15,0,6),(-38,36,3,5),(-43,76,2,8),(7,82,2,8),(37,81,0,7),
       (47,71,1,8),(57,81,2,9),(59,53,0,6),(59,32,2,8),(59,6,0,6),
       (58,-7,3,5),(56,-60,1,7),(44,-76,2,8),(25,-83,0,6),(18,-71,3,5),
       (-11,-43,3,5),(-88,-70,2,8),(-15,64,3,5),(30,61,1,7),(30,36,3,5),
       (86,-79,2,8),(94,-57,1,7),(87,-40,3,5),(94,2,1,8),(90,27,2,9),
       (92,54,0,7),(87,78,2,8),(-14,12,3,5),(-39,-12,3,5),(48,34,3,5),
       (-90,18,2,8),(94,89,0,7)]
    for i,(x,y,k,h) in enumerate(sites,1):tree(i,x,y,k,h)
    for i,(x,y) in enumerate([(-87,-13),(-87,-16),(-65,25),(-65,28),(-38,51),(-35,51),(7,34),(7,37),
        (27,31),(30,31),(46,31),(49,31),(19,-64),(22,-64),(25,-64),(40,-64),(42,-64),
        (31,59),(34,59),(45,59),(48,59),(-16,-86),(-16,-83),(87,11),(88,15),(85,-65)],1):
        ellipsoid('BUSH_%03d'%i,(x,y,.58),(1.15,.8,.65),'Leaves_Light' if i%2 else 'Tree_Leaves','Bushes',rings=5,sectors=9)
    # Small reed patches on the banks; water and open green remain unobstructed.
    for i,y in enumerate([-86,-69,-48,-5,17,39,64,87]):
        x=cx(y)-6.8
        for j in range(5):
            xx=x+random.uniform(-.4,.4); yy=y+random.uniform(-.6,.6)
            beam('PLANT_Reed_%02d_%02d'%(i,j),(xx,yy,-.3),(xx+.18,yy,.4+random.random()*.4),.035,'Palm_Leaves','Plants',n=5)
    for i,(x,y,a) in enumerate([(29,52,90),(49,53,-90),(34,3,0),(41,3,0),(87,41,-90),(89,-5,-90)],1):bench('BENCH_%03d'%i,x,y,a)
    for i,(x,y) in enumerate([(-87,-38),(-62,-38),(-34,-35),(-5,-33),(26,-33),(53,-28),(88,-28),(-55,22),(22,40)],1):
        pa=empty('STREETLIGHT_%03d'%i,'Street_Furniture',(x,y,0),kind='streetlight')
        cylinder(pa.name+'_Foot',(0,0,.14),.28,.28,'Concrete','Street_Furniture',pa)
        cylinder(pa.name+'_Pole',(0,0,3.35),.075,6.4,'Metal','Street_Furniture',pa)
        beam(pa.name+'_Arm',(0,0,6.4),(0,1.1,6.65),.06,'Metal','Street_Furniture',pa)
        box(pa.name+'_Lamp',(0,1.2,6.62),(.36,.74,.13),'Metal','Street_Furniture',pa)
        box(pa.name+'_Lens',(0,1.2,6.54),(.29,.60,.035),'Light_Lens','Street_Furniture',pa)
    for i,(x,y) in enumerate([(47,4),(31,-40),(27,55)],1):
        cylinder('BIN_%03d'%i,(x,y,.5),.28,.95,'Wall_Sage','Street_Furniture',n=12)
        cylinder('BIN_%03d_Lid'%i,(x,y,1.01),.31,.09,'Metal','Street_Furniture',n=12)
    print('VEGETATION complete: 42 trees, planted areas, furniture')

def car(i,x,y,angle,color,kind='hatchback'):
    name='CAR_%03d'%i; pa=empty(name,'Cars',(x,y,.17),angle,'car')
    pa['vehicle_type']=kind
    box(name+'_Chassis',(0,0,.58),(1.78,4.2,.68),color,'Cars',pa)
    box(name+'_Lower_Trim',(0,0,.36),(1.81,4.15,.17),'Metal','Cars',pa)
    # Sloped cabin with individual glass panels, front at -Y.
    yy=.18 if kind=='pickup' else .25
    front=-1.38 if kind!='pickup' else -1.6; back=1.20 if kind!='pickup' else .45
    verts=[(-.80,front,.90),(.80,front,.90),(.80,back,.90),(-.80,back,.90),(-.69,front+.48,1.64),(.69,front+.48,1.64),(.69,back-.18,1.64),(-.69,back-.18,1.64)]
    mesh_obj(name+'_Cabin',verts,[(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)],color,'Cars',parent=pa,key=('CAR_CAB',kind))
    mesh_obj(name+'_Windshield',[(-.70,front-.012,1.02),(.70,front-.012,1.02),(.61,front+.43,1.56),(-.61,front+.43,1.56)],[(0,1,2,3)],'Glass','Cars',parent=pa,key=('CAR_WIN',kind))
    for s in [-1,1]:
        mesh_obj(name+'_Side_Glass',[(s*.812,front+.16,1.02),(s*.812,back-.12,1.02),(s*.702,back-.22,1.55),(s*.702,front+.54,1.55)],[(0,1,2,3)],'Glass','Cars',parent=pa,key=('CAR_SIDE',kind,s))
        box(name+'_Door_Pillar',(s*.80,.05,1.29),(.045,.1,.53),color,'Cars',pa)
        box(name+'_Mirror',(s*.99,-.93,1.02),(.20,.28,.15),color,'Cars',pa)
        for wy in [-1.30,1.35]:
            ob=cylinder(name+'_Tire',(s*.88,wy,.40),.36,.22,'Tire','Cars',pa,n=16);ob.rotation_euler.y=math.pi/2
            ob=cylinder(name+'_Wheel',(s*1.003,wy,.40),.20,.015,'Car_Silver','Cars',pa,n=12);ob.rotation_euler.y=math.pi/2
    for xx in [-.57,.57]:
        box(name+'_Headlamp',(xx,-2.11,.69),(.47,.04,.22),'Light_Lens','Cars',pa)
        box(name+'_Taillamp',(xx,2.11,.72),(.28,.04,.22),'Tail_Lens','Cars',pa)
    box(name+'_Grille',(0,-2.12,.46),(.69,.045,.17),'Metal','Cars',pa)
    if kind=='pickup':box(name+'_Pickup_Bed',(0,1.23,.95),(1.50,1.48,.08),'Metal','Cars',pa)

def scooter(i,x,y,angle,color):
    name='MOTORCYCLE_%03d'%i; pa=empty(name,'Motorcycles',(x,y,.13),angle,'motorcycle')
    for yy in [-.64,.64]:
        wheel=cylinder(name+'_Tire',(0,yy,.29),.28,.14,'Tire','Motorcycles',pa,n=14);wheel.rotation_euler.y=math.pi/2
        wheel=cylinder(name+'_Hub',(.078,yy,.29),.14,.02,'Car_Silver','Motorcycles',pa,n=10);wheel.rotation_euler.y=math.pi/2
    box(name+'_Floorboard',(0,-.10,.35),(.44,.90,.10),'Metal','Motorcycles',pa)
    ellipsoid(name+'_Body',(0,.40,.58),(.28,.47,.29),color,'Motorcycles',pa,rings=6,sectors=10)
    box(name+'_Seat',(0,.32,.89),(.44,.70,.13),'Tire','Motorcycles',pa)
    beam(name+'_Fork',(0,-.65,.28),(0,-.46,.91),.055,'Metal','Motorcycles',pa)
    body=box(name+'_Front_Shield',(0,-.48,.74),(.40,.18,.65),color,'Motorcycles',pa);body.rotation_euler.x=-.18
    beam(name+'_Steering',(0,-.49,.68),(0,-.54,1.16),.048,'Metal','Motorcycles',pa)
    beam(name+'_Handlebars',(-.34,-.54,1.14),(.34,-.54,1.14),.045,'Tire','Motorcycles',pa)
    ellipsoid(name+'_Headlamp',(0,-.65,1.08),(.15,.065,.105),'Light_Lens','Motorcycles',pa,rings=4,sectors=8)
    for s in [-1,1]:
        beam(name+'_Mirror_Stem',(s*.27,-.54,1.15),(s*.36,-.53,1.41),.014,'Metal','Motorcycles',pa,n=6)
        ellipsoid(name+'_Mirror',(s*.36,-.53,1.43),(.075,.04,.06),'Glass','Motorcycles',pa,rings=4,sectors=6)
    beam(name+'_Stand',(.12,.22,.48),(.32,.28,0),.025,'Metal','Motorcycles',pa,n=6)

def person(i,x,y,angle,category='Adults',pose='standing'):
    short={'Adults':'ADULT','Elderly':'ELDERLY','Children':'CHILD'}[category]
    name='PERSON_%s_%03d'%(short,i);pa=empty(name,category,(x,y,.14),angle,'person')
    pa['age_group']=category;pa['pose']=pose
    sc=.72 if category=='Children' else (.95 if category=='Elderly' else 1)
    skin=['Skin_Warm','Skin_Light','Skin_Deep'][i%3];shirt=['Shirt_Teal','Shirt_Coral','Shirt_Cream','Shirt_Blue','Shirt_Lilac'][i%5]
    def point(p):return tuple(v*sc for v in p)
    def limb(s,a,b,r,mat):return beam(name+s,point(a),point(b),r*sc,mat,category,pa,n=8)
    # Normal adult proportions with distinct torso, arms, hands and shoes.
    seated=pose=='seated'
    hip=.64 if seated else .89
    box(name+'_Pelvis',point((0,0,hip)),point((.32,.23,.22)),'Trousers',category,pa)
    verts=[(-.16,-.12,hip+.07),(.16,-.12,hip+.07),(.16,.12,hip+.07),(-.16,.12,hip+.07),(-.23,-.13,hip+.49),(.23,-.13,hip+.49),(.23,.13,hip+.49),(-.23,.13,hip+.49)]
    mesh_obj(name+'_Shirt',[point(v) for v in verts],[(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7),(3,2,1,0)],shirt,category,parent=pa,key=('TORSO',sc,hip))
    limb('_Neck',(0,0,hip+.48),(0,0,hip+.58),.065,skin)
    ellipsoid(name+'_Head',point((0,-.014,hip+.72)),point((.13,.13,.18)),skin,category,pa,rings=6,sectors=10)
    ellipsoid(name+'_Hair',point((0,.006,hip+.81)),point((.136,.133,.107)),'Hair_Grey' if category=='Elderly' else 'Hair',category,pa,rings=5,sectors=10)
    for s in [-1,1]:
        stride=.13*s if pose=='walking' else 0
        knee=(s*.11,-.38 if seated else stride,.40)
        ankle=(s*.11,-.39 if seated else -stride,.10)
        limb('_Thigh',(s*.10,0,hip),knee,.088,'Trousers')
        limb('_Shin',knee,ankle,.067,'Trousers')
        ellipsoid(name+'_Shoe',point((ankle[0],ankle[1]-.045,.065)),point((.085,.15,.065)),'Tire',category,pa,rings=4,sectors=8)
        elbow=(s*.29,-.17 if (pose in ['talking','seated']) else stride,hip+.24)
        hand=(s*.27,-.36 if pose in ['talking','seated'] else stride,hip+.28 if pose=='talking' else hip+.06)
        limb('_Sleeve',(s*.20,0,hip+.43),elbow,.076,shirt)
        limb('_Forearm',elbow,hand,.05,skin)
        ellipsoid(name+'_Hand',point(hand),point((.054,.055,.065)),skin,category,pa,rings=4,sectors=6)
    if category=='Elderly' and pose!='seated':
        limb('_Cane',(.34,-.10,.02),(.34,-.10,.92),.018,'Timber')
        limb('_Cane_Grip',(.34,-.10,.92),(.26,-.10,.92),.02,'Timber')

def population():
    cars=[(-70,-30,90,'Car_White','pickup'),(-15,-29,-82,'Car_Silver','hatchback'),(27,-15,0,'Car_Blue','hatchback'),
          (39,-15,0,'Car_White','hatchback'),(48,-47,90,'Car_Sand','pickup'),(-52,-51,180,'Car_Red','hatchback')]
    for i,args in enumerate(cars,1):car(i,*args)
    bikes=[(44,0,20,'Car_Blue'),(46,0,20,'Car_Red'),(26,-39,180,'Car_White'),(28,-39,180,'Car_Silver'),
           (-66,-3,0,'Car_Red'),(-39,22,-10,'Car_Blue'),(5,43,15,'Car_White'),(-76,-48,85,'Car_Sand')]
    for i,args in enumerate(bikes,1):scooter(i,*args)
    persons=[(31,1,20,'Adults','talking'),(32,0,195,'Adults','talking'),(43,1,80,'Adults','standing'),
      (38,6,0,'Adults','walking'),(25,-39,60,'Adults','standing'),(31,-41,170,'Adults','walking'),
      (21,-42,90,'Elderly','standing'),(-42,-29,90,'Adults','walking'),(-53,0,0,'Adults','walking'),
      (-67,-4,45,'Adults','standing'),(-39,23,90,'Adults','standing'),(9,39,0,'Adults','walking'),
      (37,48,20,'Children','standing'),(39,47,200,'Children','talking'),(41,49,-40,'Children','walking'),
      (29,52,90,'Elderly','seated'),(49,53,-90,'Adults','seated'),(36,3,0,'Elderly','standing'),
      (-74,-48,90,'Adults','standing'),(-56,-46,30,'Children','standing'),(-57,-45,210,'Adults','talking'),
      (87,41,-90,'Elderly','seated'),(88,36,180,'Adults','walking'),(-17,61,90,'Adults','walking')]
    counts={'Adults':0,'Elderly':0,'Children':0}
    for x,y,a,c,p in persons:
        counts[c]+=1;person(counts[c],x,y,a,c,p)
    print('POPULATION complete: 6 cars, 8 scooters, 24 residents',counts)

def aim(ob,target):ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()

def presentation():
    scene=bpy.context.scene
    world=bpy.data.worlds.new('WORLD_Soft_Daylight');world.use_nodes=True
    world.node_tree.nodes['Background'].inputs[0].default_value=(.70,.80,.88,1)
    world.node_tree.nodes['Background'].inputs[1].default_value=.45
    scene.world=world
    ld=bpy.data.lights.new('SUN_Late_Morning','SUN');ld.energy=3;ld.angle=math.radians(12)
    sun=bpy.data.objects.new('SUN_Late_Morning',ld);COL['LIGHTING'].objects.link(sun)
    sun.rotation_euler=(math.radians(27),math.radians(-22),math.radians(-25))
    for name,loc,target,scale in [
      ('CAM_Main_Isometric',(245,-310,295),(0,0,0),286),
      ('CAM_BirdEye',(0,0,300),(0,0,0),220),
      ('CAM_Street_View',(-40,-48,14),(12,-10,3),None),
      ('CAM_Community_Detail',(100,-77,82),(34,18,1),80)]:
        d=bpy.data.cameras.new(name);ob=bpy.data.objects.new(name,d);COL['CAMERAS'].objects.link(ob)
        ob.location=loc;aim(ob,target);d.clip_end=1500;d.clip_start=.1
        if scale:d.type='ORTHO';d.ortho_scale=scale
        else:d.lens=40
    scene.camera=bpy.data.objects['CAM_Main_Isometric']
    scene.render.resolution_x=1800;scene.render.resolution_y=1600;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene.render.film_transparent=False
    scene.render.filepath=str(OUT/'thai_community_preview.png')
    scene.view_settings.view_transform='AgX'
    scene.view_settings.look='AgX - Medium High Contrast'
    scene.view_settings.exposure=0
    eevee=scene.eevee
    for key,val in [('taa_render_samples',64),('use_gtao',True),('gtao_distance',3),('use_raytracing',True)]:
        if hasattr(eevee,key):setattr(eevee,key,val)
    if hasattr(eevee,'ray_tracing_options'):
        opts=eevee.ray_tracing_options
        if hasattr(opts,'resolution_scale'):opts.resolution_scale='2'
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=='VIEW_3D':
                area.spaces.active.region_3d.view_perspective='CAMERA'
                area.spaces.active.clip_end=1500
                area.spaces.active.overlay.show_overlays=False
                area.spaces.active.shading.type='MATERIAL'
    bpy.ops.object.select_all(action='DESELECT')
    print('PRESENTATION complete')

def consolidate_details():
    """Batch repeated small pieces per asset, keeping each semantic part editable."""
    import re
    bpy.context.view_layer.update()
    groups={}
    for ob in bpy.context.scene.objects:
        if ob.type!='MESH' or len(ob.data.materials)!=1:continue
        base=re.sub(r'\.\d+$','',ob.name)
        key=(base,ob.parent,ob.users_collection[0],ob.data.materials[0])
        groups.setdefault(key,[]).append(ob)
    before=len(bpy.context.scene.objects)
    for (base,pa,co,mat),obs in groups.items():
        if len(obs)<2:continue
        verts=[];faces=[];smooth=[]
        for ob in obs:
            offset=len(verts)
            verts.extend(tuple(ob.matrix_local @ v.co) for v in ob.data.vertices)
            faces.extend(tuple(offset+i for i in p.vertices) for p in ob.data.polygons)
            smooth.extend(p.use_smooth for p in ob.data.polygons)
        me=bpy.data.meshes.new('MESH_'+base+'_Assembly')
        me.from_pydata(verts,[],faces);me.materials.append(mat);me.update()
        for p,s in zip(me.polygons,smooth):p.use_smooth=s
        for ob in obs:bpy.data.objects.remove(ob,do_unlink=True)
        ob=bpy.data.objects.new(base,me);co.objects.link(ob);ob.parent=pa
    # Exact repeated assemblies share their geometry again after batching.
    import hashlib
    shared={}
    for ob in bpy.context.scene.objects:
        if ob.type!='MESH':continue
        me=ob.data
        sig=hashlib.sha256(repr(([(tuple(round(v,5) for v in ve.co)) for ve in me.vertices],
            [tuple(p.vertices) for p in me.polygons],[m.name for m in me.materials])).encode()).hexdigest()
        if sig in shared:ob.data=shared[sig]
        else:shared[sig]=me
    print('Detail batching: %d -> %d objects'%(before,len(bpy.context.scene.objects)))

def save_export():
    scene=bpy.context.scene
    # Remove the untouched original default scene from the deliverable only.
    # Its original village.blend remains on disk.
    for old in list(bpy.data.scenes):
        if old!=scene and old.name=='Scene' and set(o.name for o in old.objects)=={'Cube','Camera','Light'}:
            old_objects=list(old.objects);bpy.data.scenes.remove(old)
            for ob in old_objects:
                if ob.users==0:bpy.data.objects.remove(ob)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'thai_community_base.blend'))
    bpy.ops.export_scene.gltf(filepath=str(OUT/'thai_community_base.glb'),export_format='GLB',use_active_scene=True,
        export_yup=True,export_apply=True,export_texcoords=False,export_normals=True,
        export_materials='EXPORT',export_cameras=True,export_lights=True,export_extras=True,
        export_animations=False,export_skins=False,export_morph=False)
    stats={'scene':scene.name,'units':'meters','site_dimensions_m':[200,190],
        'objects':len(scene.objects),'mesh_objects':sum(o.type=='MESH' for o in scene.objects),
        'unique_meshes':len({o.data for o in scene.objects if o.type=='MESH'}),
        'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in scene.objects if o.type=='MESH'),
        'materials':len({m for o in scene.objects if o.type=='MESH' for m in o.data.materials}),
        'houses':sum(o.get('asset_type')=='residential_house' for o in scene.objects),
        'public_buildings':sum(o.get('asset_type') in ['community_center','health_center'] for o in scene.objects),
        'trees':sum(o.get('asset_type')=='tree' for o in scene.objects),
        'cars':sum(o.get('asset_type')=='car' for o in scene.objects),
        'motorcycles':sum(o.get('asset_type')=='motorcycle' for o in scene.objects),
        'people':sum(o.get('asset_type')=='person' for o in scene.objects),
        'non_unit_scales':[o.name for o in scene.objects if any(abs(v-1)>1e-5 for v in o.scale)],
        'modifiers':sum(len(o.modifiers) for o in scene.objects),
        'animations':sum(o.animation_data is not None for o in scene.objects),
        'blend_bytes':(OUT/'thai_community_base.blend').stat().st_size,
        'glb_bytes':(OUT/'thai_community_base.glb').stat().st_size}
    (OUT/'scene_validation.json').write_text(json.dumps(stats,indent=2))
    print(json.dumps(stats))

if __name__=='__main__':
    setup();ground_roads();buildings();vegetation();population();presentation();consolidate_details();save_export()
