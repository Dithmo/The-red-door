   20  POKE 23500,r: RANDOMIZE USR PRMS: RETURN 
   30  POKE 23500,r: RANDOMIZE USR ss: RANDOMIZE USR PRMS: GO TO VAL "195"
   45  LET r$(j)="Apologies from authors!"
   50  FOR x=j TO c
   53  IF r$(x,j)="*" THEN  LET in=i: LET x=e: GO TO VAL "195"
   54  RANDOMIZE USR ss: PRINT  INK in;r$(x): LET r$(x)="*"
   56  NEXT x
   57  LET in=i: GO TO VAL "195"
  100  BORDER n: PAPER n: INK n: BRIGHT j: RANDOMIZE USR VAL "65435": PRINT AT n,n
  102  GO SUB 7000+PEEK f*q
  105  POKE (PRHY+ac),g: POKE (PRHY+ad),n: POKE (PRHY+t),VAL "120"
  110  RANDOMIZE USR PRHY
  115  POKE (PRHY+ac),hx: POKE (PRHY+ad),hy: POKE (PRHY+t),hz
  122  IF PEEK PBS=n THEN  GO TO VAL "195"
  124  PRINT  INK i;t$
  126  PRINT  INK i;"{INK 6}{INK 7}*{INK 7} Here you can see:            {INK 6}{INK 7}*{INK 7}"
  130  RANDOMIZE USR pro: PRINT  INK i;t$
  195  RANDOMIZE USR VAL "65368": BEEP .1,t: RANDOMIZE USR SYS
  202  LET vb=PEEK VAL "64114": LET no=PEEK VAL "64115"
  206  IF vb=VAL "49" THEN  GO TO VAL "235"
  228  IF vb=VAL "200" OR no=VAL "201" THEN  GO TO VAL "45"
  235  GO TO 1000+vb*h
 1000  IF (no<(MOB+j) OR no>(MOB+g)) THEN  GO TO VAL "45"
 1002  LET no=no-MOB: POKE VAL "64115",no
 1004  IF PEEK f=j AND no=c AND PEEK (f+l)+PEEK (f+p)<>a THEN  LET r$(j)="Both N and S before W!": GO TO d
 1006  IF PEEK f=t AND no=c THEN  LET r$(j)="The ANUBIS blocks your way.": GO TO d
 1090  RANDOMIZE USR VAL "65005"
 1092  IF PEEK VAL "64115"=n THEN  LET r$(j)="You can't go THAT way!": GO TO d
 1093  POKE f,PEEK VAL "64115": GO TO h
 1100  IF no>VAL "35" THEN  GO TO 8000+q*PEEK f
 1102  IF PEEK (o+no)=m THEN  LET r=w: GO TO k
 1104  IF PEEK (o+no)=PEEK f THEN  GO TO VAL "1180"
 1106  IF PEEK f=p AND no=ac AND PEEK (f+u)=n AND PEEK (f+w)=n THEN  GO SUB pi: POKE (f+w),j: POKE (o+ac),m: POKE (o+a),p: POKE (f+u),j: LET r$(j)="OK. You take a handful of HAY": LET r$(a)="and the haystack collapses with": LET r$(b)="something falling at your feet": GO TO d
 1108  IF PEEK f=p AND no=ac AND PEEK (f+u)=j AND PEEK (f+w)=n THEN  GO SUB pi: POKE (f+w),j: POKE (o+ac),m: LET r$(j)="You collect a handful of HAY.": GO TO d
 1110  IF PEEK f=p AND no=ac AND PEEK (f+w)=j THEN  LET r$(j)="You've had your rations!": GO TO d
 1112  IF no=VAL "26" AND PEEK f=z AND PEEK (f+ab)=n THEN  LET r$(j)="You can't quite reach them.": GO TO d
 1114  IF no=VAL "26" AND (PEEK (o+af)=m OR PEEK (o+af)=PEEK f) THEN  LET r$(j)="Let's leave it in the basket!": GO TO d
 1116  IF no=VAL "26" AND PEEK f=z THEN  LET r$(j)="You've managed to catch one.": LET r$(a)="Lets not tempt fate!": GO TO d
 1120  IF PEEK f=VAL "21" AND no=aa AND PEEK (f+VAL "25")=n THEN  LET r$(j)="As you reach out it flits about": LET r$(a)="but returns to the nose position": GO TO d
 1179  LET r=ac: GO TO k
 1180  IF PEEK f=z AND no=VAL "26" AND PEEK (o+j)<>m THEN  LET r=ad: GO SUB t: GO SUB pr: GO TO VAL "1602"
 1182  IF PEEK f=z AND no=VAL "26" THEN  POKE (f+j),j: POKE (o+j),n: POKE (o+af),m: POKE (o+l),z: POKE (o+VAL "26"),n: LET r$(j)="As you catch the snake in the": LET r$(a)="basket, you notice it had a": LET r$(b)="CHARM which drops at your feet.": GO TO d
 1190  POKE (o+no),m: GO SUB pi: LET r=u: GO TO k
 1200  IF no>VAL "35" THEN  GO TO de
 1202  IF PEEK (o+no)<>m THEN  LET r=w: GO TO k
 1204  IF ((PEEK f=a AND PEEK (f+g)<c) OR (PEEK f=b AND PEEK (f+i)<c)) THEN  LET r$(j)="The MUMMY shouts ""That is not": LET r$(a)="allowed in my presence!""": GO TO d
 1290  POKE (o+no),PEEK f: GO SUB dr: LET r=u: GO TO k
 1300  IF no>VAL "35" THEN  GO TO VAL "8400"+q*PEEK f
 1302  IF ((PEEK (o+no)=PEEK f) OR (PEEK (o+no)=m)) THEN  GO TO VAL "1350"
 1310  IF no=ac AND PEEK f=p THEN  GO TO VAL "1350"
 1312  IF no=VAL "26" AND PEEK f=z AND PEEK (f+ab)=n AND PEEK (f+j)=n THEN  LET r$(j)="They appear somewhat dangerous!": GO TO d
 1313  IF no=VAL "26" AND PEEK (f+j)=j AND (PEEK (o+af)=m OR PEEK (o+af)=PEEK f) THEN  LET r$(j)="It's in the basket.": GO TO d
 1314  IF no=VAL "26" AND PEEK f=z THEN  LET r$(j)="Still dangerous!": GO TO d
 1316  IF PEEK f=VAL "21" AND no=aa AND PEEK (f+VAL "25")=n THEN  LET r$(j)="Looks like a FLY-BY-NIGHT!": GO TO d
 1349  LET r=ac: GO TO k
 1350  IF no=ac THEN  LET r$(j)="Good quality animal feedstuff.": GO TO d
 1351  IF no=VAL "26" THEN  LET r$(j)="Looks rather unfriendly!": GO TO d
 1352  IF no=j THEN  LET r$(j)="Like that used by Snakecharmers.": GO TO d
 1353  IF no=a THEN  LET r$(j)="It is smaller than the one on": LET r$(a)="the Embankment!  SEW what!": GO TO d
 1354  IF no=b THEN  LET r$(j)="It is NEARLY fit for a GOD!": GO TO d
 1355  IF no=c  THEN  LET r$(j)="It looks just like a TOKEN! I": LET r$(a)="don't see any CATCH in that!": GO TO d
 1356  IF no=e THEN  LET r$(j)="You filled it!": GO TO d
 1357  IF no=g THEN  LET r$(j)="Don't think there is a pop group": LET r$(a)="called BAND AGES!": LET in=5: GO TO d
 1358  IF no=i THEN  LET r$(j)="Doesn't look very appetising.": GO TO d
 1359  IF no=l THEN  LET r$(j)="It's charming!": GO TO d
 1360  IF (no>l AND no<v) THEN  LET r$(j)="It makes a lovely adornment.": LET in=4: GO TO d
 1361  IF no=v THEN  LET r$(j)="Looks as though it may have": LET r$(a)="magic powers! There's the RUB!": GO TO d
 1362  IF no=aa THEN  LET r$(j)="It would grace any parlour.": GO TO d
 1363  IF no=w THEN  LET r=u: GO SUB t: LET r$(j)="But you can't understand them!": GO TO d
 1364  IF no=t AND PEEK (f+VAL "28")=n THEN  POKE (f+VAL "28"),j: POKE (o+VAL "27"),PEEK f: LET r$(j)="A navel-shaped RUBY falls out!": GO TO d
 1365  IF no=t THEN  LET r$(j)="Just fluffy FLUFF!": GO TO d
 1366  IF no=VAL "21" AND PEEK (f+ab)=n THEN  LET r$(j)="Perhaps a good {INK 6}BLOW{INK 7} in the": LET r$(a)="right place may help.": GO TO d
 1367  IF no=VAL "22" THEN  LET r$(j)="It's shrouded in mystery!": GO TO d
 1368  IF no=VAL "23" THEN  LET r$(j)="Fit for a GOD.": GO TO d
 1369  IF no=VAL "24" THEN  LET r$(j)="It's not for your ears!": LET in=e: GO TO d
 1370  IF no=VAL "27" THEN  LET r$(j)="What navel did that fall out of?": GO TO d
 1371  IF no=af THEN  LET r$(j)="There's a SNAKE in it!": GO TO d
 1372  IF no=VAL "33" THEN  LET r$(j)="Those could be made into": LET r$(a)="something quite interesting!": GO TO d
 1373  IF no=VAL "35" THEN  LET r$(j)="It's very elegant and would not": LET r$(a)="be used for anything as common-": LET r$(b)="place as water.": GO TO d
 1374  IF no=VAL "34" THEN  LET r$(j)="I think the CATCH is now over": GO TO d
 1398  LET r$(j)="Just what you would expect!": GO TO d
 1399  GO TO de
 1400  GO TO h
 1500  CLS : PRINT  INK i;AT a,n;t$
 1502  PRINT  INK i;"*";TAB af;"*"
 1504  RANDOMIZE USR PRCAR
 1505  PRINT  INK i;"*";TAB af;"*";t$''
 1514  GO SUB pr: GO TO h
 1602  BORDER n: PAPER n: CLS : PRINT  INK g;AT u,a;"Press a key to start again.": PAUSE n: GO TO VAL "9980"
 1700  RANDOMIZE USR SA
 1800  RANDOMIZE USR LO
 1900  IF PEEK (f+VAL "29")=n AND PEEK (f+v)<>n THEN  LET r$(j)="THOTH would like a GOLD garment!": GO TO d
 1902  LET r$(j)="Not behind the {PAPER 2}{INK 7}RED DOOR{INK 7}{PAPER 0}": GO TO d
 2000  IF (no=VAL "65" OR no=VAL "66") THEN  GO TO VAL "1300"
 2002  IF no=ac AND PEEK f=p THEN  LET no=VAL "65": GO TO VAL "1300"
 2020  GO TO de
 2100  IF PEEK f=u AND no=VAL "70" AND PEEK (f+VAL "21")=n THEN  CLS : PRINT AT i,b;"": LET r=t: GO SUB t: PAUSE d: PRINT '': LET r=VAL "21": GO SUB t: POKE (f+VAL "21"),j: PRINT ''': GO SUB pr: POKE f,k: GO TO h
 2102  IF PEEK f=u AND no=VAL "70" THEN  LET r$(j)="It now appears to be firmly shut": GO TO d
 2104  IF PEEK f=q AND no=VAL "69" THEN  GO TO VAL "3400"
 2106  IF PEEK f=k THEN  LET r$(j)="It's not as easy as that!": GO TO d
 2108  IF PEEK f=t AND no=VAL "92" THEN  LET r$(j)="The ANUBIS won't permit that!": GO TO d
 2110  IF no=j AND (PEEK (o+j)=PEEK f OR PEEK (o+j)=m) THEN  LET r$(j)="It's open.": GO TO d
 2112  IF no=af AND (PEEK (o+no)=PEEK f OR PEEK (o+no)=m) THEN  LET r$(j)="Now, now ! Don't be silly! There": LET r$(a)="is a snake in it!": GO TO d
 2150  GO TO de
 2200  IF no>VAL "35" THEN  GO TO de
 2202  IF PEEK (o+no)<>m THEN  LET r=w: GO TO k
 2204  IF PEEK (o+z)<>m THEN  LET r$(j)="Even you will need some SCISSORS": LET r$(a)="to be able to do that!": GO TO d
 2206  IF no=VAL "22" THEN  POKE (o+VAL "22"),n: POKE (o+g),m: RANDOMIZE USR ss: PRINT  INK i;"OK..You now have some bandages!": GO SUB pr: GO TO h
 2210  IF no=b THEN  POKE (o+b),n: POKE (f+b),j: POKE (o+33),m: LET r$(j)="OK. That seamed like a good idea": GO TO d
 2250  GO TO de
 2300  IF no>VAL "35" THEN  GO TO de
 2302  IF PEEK (o+no)<>m THEN  LET r=w: GO TO k
 2304  IF ((PEEK f=a AND PEEK (f+g)=n) OR (PEEK f=b AND PEEK (f+i)=n)) THEN  LET r$(j)="The MUMMY says ""Don't GIVE me": LET r$(a)="anything! When you have ALL that": LET r$(b)="I require I'll reward you well.""": GO TO d
 2306  IF ((PEEK f=a AND PEEK (f+g)=c) OR (PEEK f=b AND PEEK (f+i)=c)) THEN  LET r$(j)="There's nobody here!": GO TO d
 2310  IF PEEK f=g AND no=w THEN  POKE (o+w),n: POKE (o+ab),m: LET r$(j)="The soothsayer is overwhelmed by": LET r$(a)="your generosity and gives you a": LET r$(b)="{INK 4}KEY{INK 7}, chuckles and splutters": LET r$(c)="""{INK 6}TICKLE ANUBIS{INK 7}-he hates it!""": POKE (f+ad),j: GO TO d
 2312  IF PEEK f=g THEN  LET r=z: GO TO k
 2320  IF PEEK f=l AND no=ac THEN  GO SUB dr: POKE (f+s),j: POKE (o+ac),n: POKE (o+ad),PEEK f: LET r$(j)="The cow rises to eat the HAY and": LET r$(a)="you see a {INK 6}COIN {INK 7}on the carpet.": GO TO d
 2322  IF PEEK f=l AND no=i THEN  LET no=VAL "62": GO TO VAL "5400"
 2330  IF PEEK f=ad AND PEEK (f+aa)=j AND no=ad THEN  POKE (o+ad),n: POKE (o+u),m: POKE (f+z),PEEK (f+z)+j: LET r$(j)="THAT coin gets you some KOHL": LET r$(a)="from the grateful Concubine!": GO TO d
 2332  IF PEEK f=ad AND PEEK (f+aa)=j AND no=VAL "27" THEN  POKE (o+VAL "27"),n: POKE (o+s),m: POKE (f+z),PEEK (f+z)+j: LET r$(j)="The Concubine smiles at you and": LET r$(a)="rewards you with some PERFUME.": GO TO d
 2334  IF PEEK f=ad AND PEEK (f+aa)=n THEN  LET r$(j)="But there's no-one here!": GO TO d
 2340  IF PEEK f=e AND no=aa THEN  GO SUB dr: POKE (f+ac),j: POKE (o+aa),n: POKE (o+VAL "35"),e: LET r$(j)="The spider takes the fly, and": LET r$(a)="beetles off to enjoy the treat!": LET r$(b)="When he has gone you notice a": LET r$(c)="JUG in a dark corner.": GO TO d
 2390  GO TO de
 2400  IF no<>VAL "33" THEN  GO TO VAL "2450"
 2402  IF PEEK (o+no)<>m THEN  LET r=w: GO TO k
 2404  IF PEEK (o+a)=m THEN  LET r$(j)="How about threading the needle?": GO TO d
 2406  IF PEEK (o+32)<>m THEN  LET r$(j)="Even you are not able to do that": LET r$(a)="without a threaded needle!": GO TO d
 2408  POKE (o+VAL "33"),n: POKE (o+VAL "23"),m: POKE (f+VAL "29"),j: LET r$(j)="Well done! you have now made a": LET r$(a)="raiment fit for a {INK 6}GOD{INK 7}.": GO TO d 
 2450  IF (no=b AND PEEK (o+b)=m) THEN  LET r$(j)="That cloth is not ready for": LET r$(a)="sewing yet!": GO TO d
 2452  IF no=b THEN  LET r=w: GO TO k
 2490  GO TO de
 2500  IF no<>a THEN  GO TO VAL "2550"
 2502  IF PEEK (o+a)<>m THEN  LET r=w: GO TO k
 2504  IF PEEK (o+VAL "25")<>m THEN  LET r$(j)="But you have NO thread!": GO TO d
 2506  POKE (f+a),j: POKE (o+a),n: POKE (o+VAL "32"),m: POKE (o+VAL "25"),n: GO SUB dr: LET r$(j)="It wasn't easy! But it's done.": GO TO d
 2550  IF no=VAL "32" THEN  LET r=VAL "22": GO TO k
 2590  GO TO de
 2600  IF (PEEK f=v OR PEEK (o+e)=m) AND no=VAL "110" THEN  CLS : PRINT AT i,b;"": LET r=VAL "23": GO SUB t: PAUSE d: PRINT '''': LET r=VAL "24": GO SUB t: PRINT ''': GO SUB pr: GO TO VAL "1602"
 2610  LET r=z: GO TO k
 2700  IF ((PEEK f=v OR PEEK (o+e=m)) AND no=VAL "110") THEN  GO TO VAL "2600"
 2710  GO TO de
 2800  IF (PEEK f<>v OR no<>VAL "35") THEN  GO TO VAL "2850"
 2802  IF PEEK (o+VAL "35")<>m THEN  LET r=w: GO TO k
 2805  POKE (f+e),n: POKE (o+e),m: POKE (o+VAL "35"),n: LET r$(j)="OK. That could be useful as the": LET r$(a)="liquid is {INK 4}embalming fluid!{INK 7}": GO TO d
 2850  IF no>VAL "35" THEN  GO TO de
 2852  IF PEEK (o+no)<>m THEN  LET r=VAL "25": GO TO k
 2855  IF no=e THEN  LET r=VAL "22": GO TO k
 2860  GO TO de
 2900  IF no<>i THEN  GO TO de
 2901  IF PEEK (f+af)=j THEN  LET r=VAL "22": GO TO k
 2902  IF PEEK (o+no)<>m THEN  LET r=w: GO TO k
 2904  POKE (o+i),n: GO SUB dr: POKE (f+af),j: LET r=u: GO SUB t: PAUSE d: LET r$(j)="Do you think that was wise?": GO TO d
 2910  GO TO de
 3000  IF no=VAL "23" AND PEEK (f+VAL "29")=n THEN  LET no=VAL "33": GO TO VAL "2400"
 3010  GO TO de
 3100  IF ((no=VAL "23" OR no=q OR no=s OR no=VAL "22") AND PEEK (o+no)=m) THEN  LET r$(j)="That's not for you!": GO TO d
 3110  GO TO de
 3200  IF no<>s THEN  GO TO de
 3202  IF PEEK (o+no)<>m THEN  LET r=w: GO TO k
 3204  LET r$(j)="Heady but nice!": GO TO d
 3300  IF no=w THEN  GO TO VAL "1300"
 3302  IF no=VAL "81" AND PEEK f=ab THEN  GO TO VAL "1300"
 3304  GO TO de
 3400  IF PEEK f=q AND no=VAL "69" AND PEEK (f+t)=n AND PEEK (o+ab)=m THEN  POKE (f+t),j: POKE (o+p),m: POKE (o+ab),q: LET r$(j)="The BOX unlocks. Inside you see": LET r$(a)="a BRACELET. As you hastily scoop": LET r$(b)="it up you drop the KEY.": GO TO d
 3402  IF PEEK f=q AND no=VAL "69" AND PEEK (f+t)=n AND PEEK (o+ab)<>m THEN  LET r$(j)="You have no KEY!": GO TO d
 3404  IF PEEK f=q AND no=VAL "69" THEN  LET r$(j)="It's open!": GO TO d
 3406  IF PEEK f=t AND no=VAL "92" THEN  LET r$(j)="They are not locked.": GO TO d
 3490  GO TO de
 3500  IF no<>VAL "21" THEN  GO TO de
 3502  IF PEEK (o+no)<>m THEN  LET r$(j)="You have no PIPE!": GO TO d
 3504  IF PEEK f=z AND PEEK (f+ab)=n THEN  GO SUB VAL "3510": POKE (f+ab),j: POKE (o+VAL "26"),z: LET r$(j)="One of the snakes slithers up": LET r$(a)="the ramp to be at your feet!": GO TO d
 3506  GO SUB VAL "3510": LET r=u: GO TO k
 3510  FOR x=j TO q: BEEP .05,x: NEXT x
 3512  FOR x=p TO n STEP -j: BEEP .05,x: NEXT x
 3514  RETURN 
 3600  IF no=VAL "21" THEN  GO TO VAL "3500"
 3604  LET r=ab: GO TO k
 3700  IF no<>VAL "24" THEN  GO TO de
 3701  IF PEEK f<>VAL "21" THEN  GO TO VAL "3710"
 3702  IF PEEK (o+VAL "24")=m THEN  GO SUB dr: POKE (o+VAL "24"),n: POKE (f+VAL "25"),j: LET r$(j)="The SPHINX smiles an inscrutable": LET r$(a)="smile but the joke KILLS the fly":: POKE (o+aa),VAL "21": GO TO d
 3703  IF PEEK (f+VAL "25")=j THEN  LET r$(j)="""I've heard that one"" says": LET r$(a)="says the SPHINX.": GO TO d
 3704  LET r$(j)="You try your best stories but": LET r$(a)="you can't raise a smile.": GO TO d
 3710  IF PEEK f=g THEN  LET r$(j)="Not even the glimmer of a smile!": GO TO d
 3712  IF PEEK f=ad AND PEEK (f+aa)=j THEN  LET r$(j)="""WE are not amused!"" is the": LET r$(a)="response to that idea!": GO TO d
 3714  IF PEEK f=ad THEN  LET r$(j)="Talking to yourself is the first": LET r$(a)="signs of something.............": GO TO d
 3716  IF ((PEEK f=a AND PEEK (f+g)<>c) OR (PEEK f=b AND PEEK (f+i)<>c) OR (PEEK f=u)) THEN  LET r$(j)="That could seriously damage a": LET r$(a)="MUMMY'S health! (only joking!)": GO TO d
 3718  IF PEEK f=L THEN  LET r$(j)="That's really milking it!": GO TO d
 3750  GO TO de
 3800  LET r$(j)="You have no weapon!": GO TO d
 3900  IF no=VAL "26" THEN  GO TO VAL "1100"
 3902  GO TO de
 4000  IF PEEK f=l AND no=VAL "62" THEN  LET r$(j)="Try an udder idea!": GO TO d
 4020  GO TO de
 4100  LET r=v: GO TO k
 4200  IF no=VAL "184" THEN  LET r=u: GO SUB t: PAUSE d: LET r$(j)="Hasn't done much good!": GO TO d
 4202  IF PEEK f=v AND (no=VAL "79" OR no=VAL "73") THEN  GO TO VAL "4300"
 4210  GO TO de
 4300  IF PEEK f=v AND (no=VAL "79" OR no=VAL "73") THEN  LET no=VAL "180": GO TO VAL "4400"
 4310  GO TO de
 4400  IF PEEK f=v AND (no=VAL "180" OR no=VAL "73") THEN  CLS : BORDER n: PAPER e: INK n: CLS : PRINT AT l,j;"That pool is full of embalming  fluid! You are now in no state  to carry on with your quest.": PAUSE d: PRINT '''': GO SUB pr: GO TO VAL "1602"
 4410  GO TO de
 4500  IF PEEK f=w AND no=VAL "78" THEN  POKE f,aa: GO TO h
 4502  IF PEEK f=aa AND no=VAL "78" THEN  LET r$(j)="They don't go up from here!": GO TO d
 4504  IF no=VAL "78" THEN  LET r$(j)="There are no stairs here!": GO TO d
 4510  GO TO de
 4600  IF PEEK f=aa AND no=VAL "78" THEN  POKE f,w: GO TO h
 4602  IF PEEK f=w AND no=VAL "78" THEN  LET r$(j)="They don't go down from here!": GO TO d
 4604  IF no=VAL "78" THEN  LET r$(j)="There are no stairs here!": GO TO d
 4610  GO TO de
 4800  IF PEEK f=t AND no=VAL "92" THEN  GO TO VAL "2100"
 4810  LET r=z: GO TO k
 4900  IF ((PEEK f=g AND no=VAL "57") OR (PEEK f=t AND no=VAL "90") OR (PEEK f=ad AND no=VAL "87" AND PEEK (f+aa)=j)) THEN  LET r$(j)="Your advances are rebuffed!": GO TO d
 4910  GO TO de
 5000  IF PEEK f=k AND no=h THEN  LET r$(j)="You feel the outline of a slot!": GO TO d
 5010  GO TO de
 5100  IF ((no<>c AND no<>VAL "34") OR (PEEK f<>k)) THEN  GO TO VAL "5120"
 5102  IF PEEK (o+no)<>m THEN  LET r=w: GO TO k
 5104  IF no=c THEN  LET r$(j)="Bronze is NOT good enough!": GO TO d
 5106  IF no=VAL "34" THEN  POKE (o+no),n: GO SUB dr: BORDER j: PAPER j: INK i: CLS : PRINT AT l,q;"WELL DONE!";AT q,n;"The case opens and you fall out ............................... ......to find you are WHERE?": PRINT ''''': GO SUB pr: POKE f,s: GO TO h
 5120  IF no=ad AND PEEK (o+ad)=m THEN  POKE (o+no),n: GO SUB dr: LET r=u: GO SUB t: PAUSE d: LET r=ab: GO TO k
 5190  GO TO de
 5200  LET r$(j)="That's too general GENERAL!": GO TO d
 5300  IF PEEK f=t AND no=VAL "90" AND PEEK (f+ad)=j THEN  CLS : PRINT  INK g;AT l,n;" The ANUBIS rolls about on the  floor and you are able to dodge    through the silver doors!": PRINT '': GO SUB pr: POKE f,VAL "29": GO TO h
 5302  IF PEEK f=t AND no=VAL "90" THEN  LET r$(j)="The Anubis manages to avoid you!": GO TO d
 5304  IF no=VAL "90" AND PEEK f<>t THEN  LET r=ac: GO TO k
 5310  GO TO de
 5400  IF (PEEK f<>l OR no<>VAL "62") THEN  GO TO VAL "5410"
 5402  IF PEEK (o+ac)=m THEN  LET no=ac: GO TO VAL "2300"
 5406  IF PEEK (f+s)=j THEN  LET r$(j)="She's already been fed!": GO TO d
 5408  IF PEEK (o+i)=m THEN  LET r$(j)="She doesn't fancy THAT food!": GO TO d
 5409  IF PEEK f=l AND PEEK (o+ac)<>m THEN  LET r$(j)="With what?": GO TO d
 5410  IF PEEK f=e AND no=VAL "53" AND PEEK (o+aa)=m THEN  LET no=aa: GO TO 2300
 5420  LET r=v: GO TO k
 5500  GO TO VAL "1100"
 5600  LET r=u: GO SUB t: PAUSE h: LET r$(j)="Hasn't done much good!": GO TO d
 5602  GO TO de
 5700  LET r$(j)="NO violence please!": GO TO d
 5800  IF PEEK f=g AND PEEK (f+ad)=n THEN  LET r$(j)="You hear the chanting of the": LET r$(a)="soothsayer.": GO TO d
 5804  IF PEEK f=g THEN  LET r$(j)="The chanting is cheerful now!": GO TO d
 5806  IF PEEK f=VAL "22" THEN  LET r$(j)="Waken up! Faint solemn music.": GO TO d
 5808  IF PEEK f=p AND PEEK (o+s)=j THEN  LET r$(j)="Munch, munch , munch!": GO TO d
 5810  LET r$(j)="Nothing special can be heard.": GO TO d
 5900  IF no=VAL "106" AND PEEK (f+k)=j THEN  POKE (f+k),a: LET r=u: GO SUB t: LET r=ab: GO SUB t: PAUSE d: LET r$(j)="But what prompted that?": GO TO d
 5901  IF no=VAL "106" THEN  LET r=ab: GO TO k
 5902  IF (PEEK f=g OR PEEK f=t OR PEEK f=VAL "21" OR (PEEK f=ad AND PEEK (f+aa)=j)) AND no=VAL "111" THEN  LET r$(j)="Hello to you!": GO TO d
 5904  IF (PEEK f=a AND PEEK (f+g)=n) OR (PEEK f=b AND PEEK (f+i)=n) THEN  LET r$(j)="You must not waste time talking.": LET r$(a)="I would much prefer some action!": GO TO d
 5906  IF PEEK f=e AND no=VAL "112" AND PEEK (f+ac)=n THEN  LET r$(j)="""That's me!"" says the spider!": GO TO d
 5908  IF no=VAL "112" THEN  LET r$(j)="No-one here by that name!": GO TO d
 5910  LET r$(j)="Talking to yourself is a sure": LET r$(a)="sign of something..............": GO TO d
 6000  IF ((no<>c AND no<>VAL "34") OR (PEEK f<>k)) THEN  GO TO VAL "6010"
 6002  IF PEEK (o+no)<>m THEN  LET r=w: GO TO k
 6004  IF PEEK (o+v)<>m AND PEEK (f+c)=n THEN  LET r$(j)="You're just making a ROD for": LET r$(a)="your own back!": GO TO d
 6006  IF no=c THEN  LET no=v: GO TO VAL "6105"
 6008  IF no=VAL "34" THEN  LET r$(j)="Surely not!": GO TO d
 6010  IF no=ad AND PEEK (o+ad)=m THEN  LET r=u: GO SUB t: PAUSE d: LET r=ab: GO TO k
 6090  LET r=v: GO TO k
 6100  IF no<>v THEN  LET r=v: GO TO k
 6102  IF PEEK (o+v)<>m THEN  LET r$(j)="Pass............you have no ROD!": GO TO d
 6104  IF (PEEK (f+c)=j OR PEEK f<>k) THEN  LET r=ab: GO TO k
 6105  POKE (o+VAL "34"),(PEEK (o+c)): POKE (o+c),n: POKE (f+c),j: LET r$(j)="There is a flash of {INK 6}GOLD{INK 7} as": LET r$(a)="the bronze TOKEN vibrates!": GO TO d
 6190  GO TO de
 7010  PRINT  INK j;t$;"{INK 1}*{INK 7}{INK 7} You are in an EGYPTIAN TOMB. {INK 1}**{INK 7}{INK 7} It is the burial place of    {INK 1}**{INK 7}{INK 7} some bygone ruler or GOD.    {INK 1}**{INK 7}{INK 7} There is a long dark corridor{INK 1}**{INK 7}{INK 7} stretching to the west as far{INK 1}**{INK 7}{INK 7} as the eye can see. You can  {INK 1}**{INK 7}{INK 7} see two dimly lit alcoves to {INK 1}**{INK 7} {INK 7}the north and south..........{INK 1}**{INK 7}{INK 7}      {INK 6}THERE IS NO WAY OUT{INK 1}     *{INK 7}{INK 7}": POKE bl,j: RETURN 
 7020  IF PEEK (f+g)=c THEN  PRINT  INK b;t$;"{INK 6}{INK 3}*{INK 7}{INK 7}      This burial chamber     {INK 6}{INK 3}**{INK 7} {INK 7}        is now EMPTY         {INK 6}{INK 3}*{INK 7}{INK 7}": POKE bl,b: RETURN 
 7021  PRINT  INK b;t$;"{INK 6}{INK 3}*{INK 7}{INK 7}{INK 6}{INK 7} In this burial chamber there {INK 6}{INK 4}{INK 6}{INK 3}**{INK 7}{INK 7} is a male MUMMY--he is lying {INK 4}{INK 6}{INK 3}**{INK 7}{INK 7}{INK 7} on a marble slab, and he is  {INK 4}{INK 6}{INK 3}**{INK 7}{INK 7}{INK 7}{INK 7}    {INK 6}  {INK 6}COMPLETELY NAKED {INK 7}       {INK 4}{INK 6}{INK 6}{INK 3}*{INK 7}{INK 7}{INK 7}" 
 7022  IF PEEK (f+l)=n THEN {INK 0}{INK 7}{PAPER 0} POKE (f+l),j: PRINT "{INK 6}{INK 3}*{INK 4} {INK 7}{INK 7}He says, ""Vandals desecrated {INK 6}{INK 6}{INK 3}**{INK 4}{INK 4} {INK 7}my tomb and left me like this{INK 6}{INK 3}**{INK 5}{INK 4}{INK 4} {INK 7}Could you please help me by  {INK 6}{INK 3}**{INK 4}{INK 4} {INK 7}replacing my lost {INK 3}{INK 7}{INK 7}{INK 5}garment{INK 4}    {INK 6}{INK 3}**{INK 4} {INK 4}{INK 7}and {INK 5}possessions {04}{INK 7}""         {INK 6}  {INK 3}*{INK 7}"{PAPER 7}{PAPER 0}
 7024  LET y=n
 7025  FOR x=e TO l: IF PEEK (o+x)=m THEN  LET y=y+j
 7026  NEXT x
 7027  IF y=c THEN  POKE (f+m),PEEK (f+m)-c: PRINT  INK b;t$: PRINT ': PRINT  INK i;"The MUMMY takes from you:"''"the JUG of embalming fluid"'"the funeral FOOD"'"the snake-shaped CHARM"'"and the BANDAGES."''"He thanks you profusely and runsoff. You now notice the CLOTH ofgold which falls off the slab ashe disappears.": POKE (o+b),a: FOR x=e TO l: POKE (o+x),n: NEXT x: POKE (f+g),c: PRINT ': GO SUB pr: GO TO h
 7029  POKE bl,b: RETURN 
 7030  IF PEEK (f+i)=c THEN  PRINT  INK i;t$;"{INK 6}{INK 7}*{INK 4}{INK 7}      {INK 4}This burial chamber   {INK 7}  {INK 6}{INK 7}**{INK 6}{INK 4}    {INK 4}is now COMPLETELY EMPTY   {INK 6}{INK 7}*{PAPER 7}{INK 7}{INK 0}{INK 6}{INK 0}{INK 6}{INK 0}{PAPER 0}{INK 7}": POKE bl,i: RETURN 
 7031  PRINT  INK i;t$;"{INK 6}{INK 7}*{INK 5} {INK 7}{INK 5}In this burial chamber there {INK 6}{INK 7}**{INK 5} is a female MUMMY--she is    {INK 7}{INK 6}{INK 7}**{INK 5}{INK 5} lying on a marble slab, and  {INK 6}{INK 7}**{INK 5}{INK 5} she is {INK 4}COMPLETELY NAKED! {INK 7}    {INK 6}{INK 7}*{INK 5}"{INK 7}{INK 7}
 7032  IF PEEK (f+p)=n THEN  POKE (f+p),j: PRINT "{INK 6}{INK 7}*{INK 4}{INK 4}{INK 7} {INK 7}She says, ""Vandals desecrated{INK 6}{INK 7}**{INK 7} my tomb and left me like this{INK 6}{INK 7}**{INK 7} Could you please help me by  {INK 6}{INK 7}**{INK 7} replacing my {INK 4}adornments.{INK 7}""    {INK 6}{INK 7}*{INK 7}"
 7034  LET y=n
 7035  FOR x=p TO u: IF PEEK (o+x)=m THEN  LET y=y+j
 7036  NEXT x
 7037  IF y=c THEN  POKE (f+m),PEEK (f+m)-b: PRINT  INK i;t$: PRINT  INK i;'';"The MUMMY takes from you:"''"the BRACELET of red gold"'"the ornate NECKLACE"'"the exotic PERFUME"'"and the adorning KOHL."''"She thanks you profusely and    before she runs off she tells   you a rather funny JOKE!": POKE (o+24),m: FOR x=p TO u: POKE (o+x),n: NEXT x: POKE (f+i),c: PRINT ': GO SUB pr: GO TO h
 7039  POKE bl,i: RETURN 
 7040  PRINT  INK b;t$;"{INK 3}*{INK 7} This is the east end of a    {INK 3}**{INK 7} long corridor with flickering{INK 3}**{INK 7} lights from unseen torches.  {INK 3}*":{INK 7} POKE bl,b: RETURN 
 7050  PRINT  INK a;t$;"{INK 2}*{INK 6} You are in a dusky alcove. A {INK 2}**{INK 6} bat is hovering about{INK 7}";
 7051  IF PEEK (f+ac)=n THEN  PRINT " {INK 6}and{INK 7}    {INK 2}**{INK 6} there is a spider busily     {INK 2}**{INK 6} spinning a web in a corner.  {INK 2}*{INK 6}"{INK 7}{INK 0}{PAPER 7}{INK 0}{INK 0}{PAPER 0}{INK 7}
 7052  IF PEEK (f+ac)=j THEN  PRINT " {INK 6}and{INK 7}    {INK 2}**{INK 6} there is a part finished web {INK 2}**{INK 6} in one corner.               {INK 2}*{INK 7}"
 7059  POKE bl,a: RETURN 
 7060  PRINT  INK j;t$;"{INK 1}*{INK 5} You enter a five-sided room. {INK 1}**{INK 5} There is a mysterious fire   {INK 1}**{INK 5} burning inside a pentacle of {INK 1}**{INK 5} stones. The signs of the     {INK 1}**{INK 5} Zodiac adorn the walls.      {INK 1}**{INK 5} There is a distinct air of   {INK 1}**{INK 5} magic about this place.      {INK 1}*{INK 5}": IF PEEK (f+Q)=n THEN  PRINT ; INK j;t$
 7061  IF PEEK (f+q)=n THEN  PAUSE d: PRINT ''' INK g;" As your eyes become accustomed  to the fire light, you see a    Soothsayer sitting at the far   end of the room. He is swaying  gently from side to side as he  chants strange words and music.": PRINT '': GO SUB pr: POKE (f+q),j: CLS : GO TO VAL "7060"
 7062  PRINT AT l,n;"{INK 1}*{INK 5} There is a soothsayer sitting{INK 1}*{INK 5}{INK 1}*{INK 5} at the far end of the room.  {INK 1}*{INK 5}"
 7069  POKE bl,j: RETURN 
 7070  PRINT  INK b;t$;"{INK 3}*{INK 7} You are part-way along a dark{INK 3}** {INK 7}narrow corridor, towards the {INK 3}**{INK 7} east end. It is quiet here!  {INK 3}*{INK 7}": POKE bl,b: RETURN 
 7080  PRINT  INK j;t$;"{INK 1}*{INK 7}  You have entered a TEMPLE.  {INK 1}*{INK 7}"
 7081  IF PEEK (f+s)=n THEN  PRINT "{INK 1}*{INK 7} A sacred cow is sitting on a {INK 1}**{INK 7} Persian carpet looking at    {INK 1}**{INK 7} you with brown lanquid eyes. {INK 1}*{INK 7}"
 7082  IF PEEK (f+s)=j THEN  PRINT "{INK 1}*{INK 7} The sacred cow gazes at you  {INK 1}**{INK 7} as she happily chews the cud.{INK 1}*{INK 7}"{INK 7}
 7089  POKE bl,j: RETURN 
 7090  PRINT  INK g;t$;"{INK 6}* {INK 7}{INK 7}You have entered the byre.   {INK 6}**{INK 7} This is obviously where the  {INK 6}**{INK 7} sacred cow sleeps. There is  {INK 6}**{INK 7} a scent of sweet hay in here {INK 6}*{PAPER 7}{INK 7}{PAPER 0}"
 7091  IF PEEK (f+u)=n THEN  PRINT "{INK 6}* {INK 7}coming from a small haystack {INK 6}*{INK 7}"
 7092  IF PEEK (f+u)=j THEN  PRINT "{INK 6}* {INK 7}coming from a pile of hay.   {INK 6}*{INK 7}"
 7099  POKE bl,g: RETURN 
 7100  PRINT  INK a;t$;"{INK 2}* {INK 7}This is the {INK 2}{INK 7}SCARLET ROOM{INK 7} It  {INK 2}**{INK 7} is completely painted in {INK 2}{INK 7}RED {INK 2}**{INK 7}{INK 7} On a plinth in the middle of {INK 2}**{INK 7} the room stands a carved box {INK 2}*{INK 7}": POKE bl,a: RETURN 
 7110  PRINT  INK b;t$;"{INK 3}*{INK 7} You are part-way along a dark{INK 3}** {INK 7}corridor, near the west end. {INK 3}**{INK 7} The silence here is deafening{INK 3}*{INK 7}": POKE bl,b: RETURN 
 7120  PRINT  INK j;t$;"{INK 1}*{INK 5} You are in a small, extremely{INK 1}**{INK 5} plain burial chamber. Lying  {INK 1}**{INK 5} on the floor is an apparently{INK 1}**{INK 5} forgotten MUMMY CASE.        {INK 1}*{INK 5}{INK 7}": POKE bl,j: RETURN 
 7130  PRINT  INK a;t$;"{INK 2}{INK 7}{INK 1}{INK 2}*{INK 7} You are on the patio outside {INK 2}**{INK 7} the Concubine's Apartments.  {INK 2}**{INK 7} Here there is an ornamental  {INK 1}{INK 2}**{INK 7} pool which is gleaming with  {INK 2}**{INK 7} a{INK 7} strange {INK 4}green glow{INK 7}. To the {INK 2}**{INK 7} north lies an exotic garden. {INK 1}{INK 2}*{INK 7}": POKE bl,a: RETURN 
 7140  PRINT  INK c;t$;"{INK 7}{INK 7}{INK 4}* {INK 7}You are standing above the   {INK 4}**{INK 7} snake-pit. Below, snakes of  {INK 4}**{INK 7} all shapes and sizes writhe  {INK 4}** {INK 7}and intertwine. A winding,   {INK 4}** {INK 7}slimy ramp leads up from the {INK 4}**{INK 7} pit to your feet. Several    {INK 4}**{INK 7} snakes are slithering up it. {INK 4}*{INK 7}": POKE bl,c: RETURN 
 7150  PRINT  INK b;t$;"{INK 3}*{INK 7}   This is the west end of    {INK 3}**{INK 7}    a long dark corridor.     {INK 3}*{INK 3}{INK 3}*{INK 7} {INK 6}  A flight of stairs leads   {INK 3}**{INK 6}       down from here{INK 7}.        {INK 3}*"{INK 7}: POKE bl,b: RETURN 
 7160  PRINT  INK i;t$;"*   You have come down, down,  **   down, into a room full of  **           DOWN!              *": POKE bl,i: RETURN 
 7170  PRINT  INK j;t$;"{INK 1}* {INK 6}You are now in the {INK 7}BLACK {INK 6}room{INK 1}**{INK 6} where the walls are hung with{INK 1}** {INK 6}{INK 7}black {INK 6}velvet, and magical    {INK 1}**{INK 6} symbols have been etched out {INK 1}** {INK 6}in gold on the ceiling. The  {INK 1}**{INK 6} whole room is illuminated    {INK 1}**{INK 6} with an {INK 4}EERIE, EERIE GLOW.   {INK 1}*{INK 7}": POKE bl,j: RETURN 
 7180  PRINT  INK a;t$;"{INK 4}{INK 2}*{INK 4} This is the Treasure Room. In{INK 2}** {INK 4}glass cases there is on show {INK 2}**{INK 4} the most wonderful jewellery.{INK 2}**{INK 4} One case is open and seems   {INK 2}** {INK 4}to be empty--it does look as {INK 2}**{INK 4} though it was the work of    {INK 2}**{INK 4} vandals. Also, there is a    {INK 2}** {INK 7}{INK 4}{INK 7}skeleton{INK 7}{INK 4} lying on the floor. {INK 2}*"{INK 7}: POKE bl,a: RETURN 
 7190  PRINT  INK e;t$;"{INK 5}*{INK 6} You are in the Concubine's  {INK 5} **{INK 7} {INK 6}Apartments. The decorations{INK 7}  {INK 5}**{INK 6} consist of rich hangings in  {INK 5}** peacock blue {INK 6}and {INK 7}acid yellow.{INK 5}** {INK 6}A faint smell of perfume is  {INK 5}**{INK 7}{INK 6} in the air. There is a patio {INK 5}**{INK 6} to the east.";
 7191  RANDOMIZE : IF PEEK (f+14)<a AND RND<.5 THEN  POKE (f+15),j: PRINT " {INK 7}{INK 7}A beautiful    {INK 5} **{INK 7} Egyptian Concubine is sitting{INK 5}** {INK 7}at her dressing table.       {INK 5}*{INK 7}": POKE bl,e: RETURN 
 7199  POKE (f+aa),n: PRINT "                 {INK 5}*"{INK 7}: POKE bl,e: RETURN 
 7200  PRINT  INK j;t$;"{INK 1}*{INK 7} A tall anubis stands in the  {INK 1}**{INK 7} entrance hall in front of a  {INK 1}** {INK 7}pair of closed, silver doors.{INK 1}*{INK 7}": POKE bl,j: RETURN 
 7210  PRINT  INK b;t$;"{INK 3}* {INK 5}This is much more like a     {INK 3}** {INK 5}cave than a room. The most   {INK 3}** {INK 5}prominent feature here is a  {INK 3}**{INK 5} {INK 6}SPHINX{INK 5}, carved from sandstone{INK 3}*{INK 7}"
 7211  IF PEEK (f+VAL "25")=n THEN  PRINT "{INK 3}*{INK 7} {INK 5}with what looks like a {INK 6}FLY {INK 5}  {INK 3}**{INK 5} on his nose!                 {INK 3}*{INK 7}"
 7219  POKE bl,b: RETURN 
 7220  PRINT  INK j;t$;"{INK 1}* {INK 7}This is the very depressing  {INK 1}**{INK 7} Funeral Parlour. The faint   {INK 1}** {INK 7}strains of solemn music can  {INK 1}**{INK 7} be heard in here.            {INK 1}*{INK 7}": POKE bl,j: RETURN 
 7230  PRINT  INK a;t$;"{INK 2}* {INK 7}This appears to be an Ante-  {INK 2}**{INK 7} Chamber attached to the      {INK 2}** {INK 7}Funeral Parlour. It has the  {INK 2}**{INK 7} uncared-for appearance of    {INK 2}**{INK 7} not having been used for a   {INK 2}**{INK 7} very long time.              {INK 2}*{INK 7}": POKE bl,a: RETURN 
 7280  PRINT  INK c;t$;"*"; INK (PEEK f)-VAL "21";"    You are in the exotic     "; INK c;"**"; INK (PEEK f)-VAL "21";"     ornamental garden.       "; INK c;"*": POKE bl,c: RETURN 
 7290  PRINT  INK g;t$;"{INK 6}*{INK 7} You are in a high chamber,   {INK 6}**{INK 7} decorated with beautiful     {INK 6}**{INK 7} paintings of Egyptian figures{INK 6}**{INK 7} At the far end of the room,  {INK 6}** {INK 7}on a {INK 6}{INK 7}large {INK 6}golden Throne {INK 7}sits{INK 7}{INK 6}** {INK 7}THOTH THE EGYPTIAN SUN GOD.  {INK 6}*{INK 7}" 
 7291  IF PEEK (f+v)=n THEN  POKE (f+v),j: GO SUB pi: PRINT "{INK 6}*{INK 7}";TAB af;"{INK 6}*{INK 7}{INK 6}* {INK 7}""Welcome to my tomb"", says   {INK 6}**{INK 7} THOTH, ""I suppose you'd like {INK 6}**{INK 7} to go home! Well if you bring{INK 6}**{INK 7} me a gift worthy of a GOD, I {INK 6}** {INK 7}may let you escape. To show  {INK 6}**{INK 7} you that I am not completely {INK 6}** {INK 7}heartless, here is a pair of {INK 6}** {INK 7}{INK 6}golden SCISSORS{INK 7} which you may{INK 6}** {INK 7}find useful. NOW GO! This    {INK 6}**{INK 7} audience is at an end.""     {INK 6} *{INK 7}{INK 7}": POKE (o+z),m: GO TO VAL "7298"
 7292  IF PEEK (f+v)=j AND PEEK (o+VAL "23")<>m THEN  POKE (f+v),a: PRINT "{INK 6}*{INK 7}";TAB af;"{INK 6}** {INK 7}""Now, where's my gift"" shouts{INK 6}** {INK 7}THOTH. ""I'm getting rather   {INK 6}**{INK 7} impatient!     Do not return {INK 6}**{INK 7} again without my gift or you {INK 6}**{INK 7} may regret it!""              {INK 6}*{INK 7}{FLASH 0}": GO TO VAL "7298"
 7293  IF PEEK (f+v)=a AND PEEK (o+VAL "23")<>m THEN  PRINT "{INK 6}*{INK 7}";TAB af;"{INK 6}**{INK 7}  ""YOU AGAIN! And no gift!""   {INK 6}**{INK 7} thunders THOTH. ""Well that's {INK 6}**{INK 7} your last chance. There's no {INK 6}**{INK 7} escape now. I banish you to  {INK 6}**{INK 7} wander these corridors for   {INK 6}**{INK 7} ever and a day and longer!""  {INK 6}*{INK 7}"; INK g;t$: GO SUB pr: GO TO VAL "1602"
 7294  IF PEEK (o+VAL "23")=m THEN  PRINT  INK g;t$: PRINT : PRINT  INK i;"THOTH takes the GIFT and smiles!": PAUSE d: PRINT  INK g;'"  Your head is spinning around  ": PAUSE h: PRINT '; INK g;" You find yourself on the floor        in your own home!        ": PAUSE h: PRINT ''; INK g;" You turn off the computer and             go to bed": PAUSE h: PRINT ';TAB p; PAPER e; INK j;" HAPPY DREAMS ": PAUSE n: GO TO VAL "1602"
 7298  PRINT  INK g;t$: GO SUB pr: POKE f,VAL "22": GO TO h
 7300  PRINT  INK i;t$;"{INK 7}* You are now inside the MUMMY ** CASE with the MUMMY! It is   ** quite dim in here but you    ** can just see a CATCH with a  ** gold slot in it. You can also** feel the MUMMY'S breath on   ** your cheek!                  *": POKE bl,i: RETURN 
 7310  PRINT AT b,n; INK i;t$;"* You're in the SNAKE PIT with ** these poisonous snakes.....  *";t$
 7311  PRINT AT q,n; INK g;t$;"{INK 6}*{INK 7}";TAB af;"{INK 6}**{INK 7}  {INK 5}I'm afraid this is asp time {INK 6}**{INK 5}                              {INK 6}**{INK 5}            BYEEee!           {INK 6}*{INK 7}"; INK g;t$: PRINT ''': GO SUB pr: GO TO VAL "1602"
 7802  RANDOMIZE USR ss: PRINT "": RANDOMIZE USR ss: PRINT "   "; PAPER a; INK i;" Press a key to continue ": PAUSE n: RETURN 
 8019  GO TO de
 8020  IF (no=VAL "45" OR no=VAL "46") AND PEEK (f+g)<c THEN  LET r$(j)="He's much too heavy for you!": GO TO d
 8021  IF (no=VAL "45" OR no=VAL "46") AND PEEK (f+g)=c THEN  LET r$(j)="He's not here now!": GO TO d
 8022  IF (no=VAL "48" OR no=VAL "51") THEN  GO TO VAL "8032"
 8029  GO TO de
 8030  IF (no=VAL "45" OR no=VAL "47") AND PEEK (f+i)<c THEN  LET r$(j)="She's much too heavy for you!": GO TO d
 8031  IF (no=VAL "45" OR no=VAL "47") AND PEEK (f+i)=c THEN  LET r$(j)="She's not here now!": GO TO d
 8032  IF (no=VAL "48" OR no=VAL "51") THEN  LET r$(j)="It's quite, quite too heavy!!": GO TO d
 8049  GO TO de
 8050  IF (no=VAL "52" OR no=VAL "53") THEN  LET r$(j)="It is too quick for you.": GO TO d
 8051  IF no=VAL "54" THEN  LET r$(j)="You can't reach it!": GO TO d
 8060  IF no=VAL "56" THEN  LET r$(j)="The Soothsayer frowns at you so": LET r$(a)="you decide to drop that idea!": GO TO d
 8061  IF no=VAL "57" THEN  LET r$(j)="He's not too keen on that idea!": GO TO d
 8079  GO TO de
 8080  IF no=VAL "62" THEN  LET r$(j)="She is not for getting!": GO TO d
 8081  IF no=VAL "63" THEN  LET r$(j)="The cow won't let you!": GO TO d
 8089  GO TO de
 8090  IF no=VAL "65" AND PEEK (f+u)=n THEN  LET r$(j)="It's quite small as haystacks go": LET r$(a)="but you still can't lift it!": GO TO d
 8091  IF no=VAL "65" AND PEEK (f+u)=j THEN  LET r$(j)="That pile could hardly be called": LET r$(a)="a {INK 6}{INK 7}{INK 5}HAYSTACK!{INK 7}{INK 7}": GO TO d
 8092  IF no=VAL "66" AND PEEK (f+u)=j THEN  LET r$(j)="You couldn't carry ALL that!": GO TO d
 8093  IF no=VAL "66" AND PEEK (f+u)=n THEN  LET r$(j)="That haystack is NOT a pile!": GO TO d
 8099  GO TO de
 8100  IF no=VAL "68" THEN  LET r$(j)="It's firmly fixed to the floor.": GO TO d
 8101  IF no=VAL "69" THEN  LET r$(j)="It's firmly fixed to the plinth.": GO TO d
 8119  GO TO de
 8120  IF no=VAL "70" THEN  LET r$(j)="It's too heavy for you.": GO TO d
 8129  GO TO de
 8130  IF (no=VAL "73" OR no=VAL "72") THEN  LET r$(j)="You must do better than that!": GO TO d
 8159  GO TO de
 8160  IF no=(MOB+g) THEN  LET r$(j)="It's too FLUFFY to collect.": GO TO d
 8179  GO TO de
 8180  IF (no=VAL "70" OR no=VAL "71") THEN  LET r$(j)="That doesn't SUIT you!": GO TO d
 8181  IF no=VAL "84" THEN  LET r$(j)="It is all in secured cases.": GO TO d
 8182  IF no=VAL "85" THEN  LET r$(j)="Old BONEY will not comply!": GO TO d
 8189  GO TO de
 8190  IF no=VAL "86" THEN  LET r$(j)="Peacock blue and acid yellow!": GO TO d
 8191  IF no=VAL "87" AND PEEK (f+aa)=n THEN  LET r$(j)="But she is not here!": GO TO d
 8192  IF no=VAL "87" THEN  LET r$(j)="But she does'nt like that idea!": GO TO d
 8193  IF no=VAL "89" THEN  LET r$(j)="That would be stealing!": GO TO d
 8199  GO TO de
 8200  IF no=VAL "90" THEN  LET r$(j)="Surely not!": GO TO d
 8209  GO TO de
 8210  IF no=VAL "93" THEN  LET r$(j)="Surely not!": GO TO d
 8239  GO TO de
 8270  IF (no=VAL "97" OR no=VAL "101" OR no=VAL "102") THEN  LET r=z: GO TO k
 8271  IF no=VAL "96" THEN  LET r=ac: GO TO k
 8279  GO TO de
 8280  IF (no=VAL "96" OR no=VAL "97" OR no=VAL "98" OR no=VAL "101" OR no=VAL "102") THEN  LET r=z: GO TO k
 8289  GO TO de
 8300  IF no=VAL "45" THEN  LET r$(j)="He's too heavy for you!": GO TO d
 8301  IF no=VAL "70" THEN  LET r$(j)="But you are IN it!": GO TO d
 8309  RANDOMIZE : LET x=INT (RND*b)+v: LET r=x: GO TO k
 8410  IF no=VAL "43" THEN  LET r$(j)="It doesn't look very special.": GO TO d
 8411  IF no<>VAL "44" THEN  GO TO VAL "8416"
 8412  IF PEEK (f+l)+PEEK (f+p)=a THEN  LET r$(j)="You've already visited both!": GO TO d
 8413  IF PEEK (f+l)=j THEN  LET r$(j)="As you've been north already": LET r$(a)="why not go south now?": GO TO d
 8414  IF PEEK (f+p)=j THEN  LET r$(j)="As you've been south already": LET r$(a)="why not go north now?": GO TO d
 8415  LET r$(j)="North or south to find out!": GO TO d
 8416  IF no=VAL "49" THEN  BEEP .3,k: PAUSE k: GO TO h
 8419  GO TO de
 8420  IF no=d THEN  BEEP .3,k: PAUSE k: GO TO h
 8421  IF (no=VAL "45" OR no=VAL "46") AND PEEK (f+g)<c THEN  LET r=VAL "26": GO TO k
 8422  IF (no=VAL "45" OR no=VAL "46") THEN  LET r=ac: GO TO k
 8423  IF no=VAL "48" AND PEEK (f+g)<c THEN  LET r=VAL "27": GO TO k
 8424  IF (no=VAL "48" OR no=VAL "51") THEN  LET r=VAL "28": GO TO k
 8429  GO TO de
 8430  IF no=d THEN  BEEP .3,k: PAUSE k: GO TO h
 8431  IF (no=VAL "45" OR no=VAL "47") AND PEEK (f+i)<c THEN  LET r=VAL "26": GO TO k
 8432  IF (no=VAL "45" OR no=VAL "47") THEN  LET r=ac: GO TO k
 8433  IF no=VAL "48" AND PEEK (f+i)<c THEN  LET r=VAL "27": GO TO k
 8434  IF (no=VAL "48" OR no=VAL "51") THEN  LET r=VAL "28": GO TO k
 8439  GO TO de
 8440  IF no=VAL "43" THEN  GO TO VAL "8410"
 8449  GO TO de
 8450  IF no=VAL "52" THEN  LET r$(j)="It's BATTY BAT from GREEN DOOR": LET r$(a)="an adventure on SIX-in-ONE.": GO TO d
 8451  IF no=VAL "54" THEN  LET r$(j)="It's not yet completed and NO": LET r$(a)="flies have been caught in it.": GO TO d
 8452  IF no=VAL "53" AND PEEK (f+ac)=n THEN  LET r$(j)="Looks rather anxious as the web": LET r$(a)="is not finished. Has short,fat,": LET r$(b)="hairy legs and answers to Ernie!": GO TO d
 8453  IF no=VAL "53" THEN  LET r=ac: GO TO k
 8454  IF no=VAL "55" THEN  LET r$(j)="There's a spider's web there.": GO TO d
 8455  IF no=VAL "44" THEN  BEEP .3,k: GO TO h
 8459  GO TO de
 8460  IF no=VAL "57" AND PEEK (f+ad)=n THEN  LET r$(j)="He is a very strange figure, but": LET r$(a)="he could be of some assistance": LET r$(b)="given some {INK 6}sure n{INK 7}ews..........": GO TO d
 8461  IF no=VAL "56" THEN  LET r$(j)="The heat from the fire gives": LET r$(a)="the stones a strange magic glow.": GO TO d
 8462  IF no=VAL "59" THEN  LET r$(j)="The light from the fire only": LET r$(a)="helps to convey the magic aura.": GO TO d
 8463  IF no=VAL "60" THEN  LET r$(j)="Aries, Pisces, Capricorn etc!": GO TO d
 8464  IF no=VAL "61" THEN  LET r$(j)="The zodiac signs are all over...": LET r$(a)="": LET r$(b)="Well, it's a change from KILROY!": GO TO d
 8465  IF no=VAL "58" THEN  BEEP .3,k: GO TO h
 8466  IF no=VAL "57" THEN  LET r=VAL "29": GO TO k
 8470  IF no=VAL "43" THEN  GO TO VAL "8410"
 8479  GO TO de
 8480  IF no=VAL "62" AND PEEK (f+s)=n THEN  LET r$(j)="Looks as though it could do": LET r$(a)="with a big feed!": GO TO d
 8481  IF no=VAL "62" THEN  LET r=VAL "29": GO TO k
 8482  IF no=VAL "63" THEN  LET r$(j)="Persian design with a cow on it.": LET r$(a)="The carpet not the design!": GO TO d
 8483  IF no=VAL "64" THEN  BEEP .3,k: GO TO h
 8484  IF no=VAL "104" AND PEEK (f+s)=n THEN  LET r$(j)="They look rather sad!": GO TO d
 8485  IF no=VAL "104" THEN  LET r$(j)="They look quite bright!": GO TO d
 8489  GO TO de
 8490  IF (no=VAL "65" AND PEEK (f+u)=n) THEN  POKE (f+u),j: POKE (o+a),p: LET r$(j)="You disturb the haystack and a": LET r$(a)="needle falls out as the haystack": LET r$(b)="collapses into an untidy pile.": GO TO d
 8491  IF no=VAL "65" THEN  LET r$(j)="It's just an untidy pile now!": GO TO d
 8492  IF (no=VAL "66" AND PEEK (f+u)=j) THEN  LET r$(j)="It's an untidy pile of hay.": GO TO d
 8499  GO TO de
 8500  IF no=VAL "69" AND PEEK (f+t)=n THEN  LET r$(j)="It's beautifully carved and it": LET r$(a)="is securely locked!": GO TO d
 8501  IF no=VAL "69" THEN  LET r$(j)="Although it is empty it is still": LET r$(a)="quite beautiful.": GO TO d
 8502  IF no=VAL "68" AND PEEK (f+t)=n THEN  LET r$(j)="Elegant, tall, grooved and slim": LET r$(a)="with an ornate BOX on it.": GO TO d
 8503  IF no=VAL "68" THEN  LET r$(j)="There's an empty BOX on it.": GO TO d
 8504  IF no=VAL "58" THEN  BEEP .3,k: GO TO h
 8509  GO TO de
 8510  IF no=VAL "43" THEN  GO TO VAL "8410"
 8519  GO TO de
 8520  IF no=VAL "70" AND PEEK (f+VAL "21")=n THEN  LET r$(j)="Looks interesting. How about": LET r$(a)="opening it?": GO TO d
 8521  IF no=VAL "70" THEN  LET r$(j)="It now appears to be firmly shut": GO TO d
 8522  IF no=d THEN  BEEP .3,k: GO TO h
 8529  GO TO de
 8530  IF no=VAL "73" THEN  LET r$(j)="On reflection, it's probably to": LET r$(a)="your advantage to know that the": LET r$(b)="pool contains embalming flluid!": LET r$(c)="Or even FLUID if you prefer!": GO TO d
 8531  IF no=VAL "72" AND PEEK (f+e)=j THEN  LET r$(j)="It's not very special, but on": LET r$(a)="reflection, the pool might be!!": GO TO d
 8532  IF no=VAL "74" THEN  LET r$(j)="Can't see very much from here.": GO TO d
 8533  IF no=VAL "75" THEN  LET r$(j)="Green and eerie!": GO TO d
 8534  IF no=VAL "72" THEN  LET r$(j)="It's not very special.": GO TO d
 8539  GO TO de
 8540  IF no=VAL "76" THEN  LET r$(j)="It's the pits! (Thanks John Mac)": GO TO d
 8541  IF no=VAL "77" THEN  LET r$(j)="Slimy snakes are all over it.": GO TO d
 8549  GO TO de
 8550  IF no=VAL "43" THEN  GO TO VAL "8410"
 8551  IF no=VAL "78" THEN  LET r$(j)="Note this.....""They lead DOWN!""": GO TO d
 8559  GO TO de
 8560  IF no=VAL "78" THEN  LET r$(j)="They lead UP and no more DOWN!": GO TO d
 8561  IF no=VAL "58" THEN  BEEP .3,k: GO TO h
 8562  IF no=(MOB+g) AND PEEK (f+VAL "22")=n THEN  POKE (f+VAL "22"),j: POKE (o+t),w: LET r$(j)="You find some navel FLUFF!": GO TO d
 8563  IF no=(MOB+g) THEN  LET r$(j)="Down! It's just DOWN! Try UP now": GO TO d
 8564  IF no=MOB+e THEN  LET r$(j)="What a strange request! You must": LET r$(a)="have been put UP to it!": GO TO d
 8569  GO TO de
 8570  IF no=VAL "61" THEN  LET r$(j)="Covered in black velvet.": GO TO d
 8571  IF no=VAL "80" THEN  LET r$(j)="Pay attention! It's BLACK!": GO TO d
 8572  IF (no=VAL "81" OR no=VAL "109") THEN  POKE (f+k),j: LET r$(j)="Magical but not necessarily": LET r$(a)="the ABRACADABRA type!": GO TO d
 8573  IF no=VAL "82" THEN  LET r$(j)="24 on the rabbit scale!": GO TO d
 8574  IF no=VAL "83" THEN  LET r$(j)="Unusual etchings here.": GO TO d
 8575  IF no=VAL "75" THEN  LET r$(j)="Green and eerie!": GO TO d
 8576  IF no=VAL "58" THEN  BEEP .3,k: GO TO h
 8579  GO TO de
 8580  IF no=VAL "70" AND PEEK (f+VAL "23")=n THEN  POKE (f+VAL "23"),j: POKE (o+q),PEEK f: LET r=q: GO SUB t: PAUSE d: LET r=s: GO TO k
 8581  IF no=VAL "70" THEN  LET r$(j)="Empty, plain empty!": GO TO d
 8582  IF no=VAL "71" THEN  LET r$(j)="They display some beautifully": LET r$(a)="impressive jewellery.": GO TO d
 8583  IF no=VAL "84" THEN  LET r$(j)="You are quite dazzled by it's": LET r$(a)="reflective beauty, but it's not": LET r$(b)="destined for you!": GO TO d
 8584  IF no=VAL "85" AND PEEK (f+VAL "24")=n THEN  POKE (f+VAL "24"),j: LET r$(j)="It jumps up to sing: {INK 6}DEM BONES{INK 7}": LET r$(a)="{INK 6}DEM BONES, DEM DRY BONES{INK 6}!{INK 7}": LET r$(b)="then lies down again {INK 6}EXHAUSTED!{INK 7}": GO TO d
 8585  IF no=VAL "85" THEN  LET r$(j)="He's lying there {INK 6}EXHAUSTED!{INK 7}": GO TO d
 8586  IF no=VAL "58" THEN  BEEP .3,k: GO TO h
 8589  GO TO de
 8590  IF no=VAL "87" AND PEEK (f+aa)=j THEN  LET r$(j)="""I like being examined!""she says": GO TO d
 8591  IF (no=VAL "88" OR no=VAL "58") THEN  LET r$(j)="No expense was spared to furnish": LET r$(a)="and decorate in here.": GO TO d
 8592  IF no=VAL "89" THEN  LET r$(j)="On it are the weaponss of a": LET r$(a)="lady's beautifying armoury!": GO TO d
 8593  IF no=VAL "86" THEN  LET r$(j)="They are in striking colours.": GO TO d
 8595  IF no=VAL "87" THEN  LET r$(j)="She's not here at the moment!": GO TO d
 8599  GO TO de
 8600  IF no=VAL "90" THEN  LET r$(j)="It stares at you and pricks up": LET r$(a)="its ears.": GO TO d
 8601  IF no=VAL "92" THEN  LET r$(j)="Apparently made of silver, but": LET r$(a)="perhaps more important is the": LET r$(b)="fact that they are unlocked.": GO TO d
 8602  IF no=VAL "91" THEN  BEEP .3,k: GO TO h
 8609  GO TO de
 8610  IF no=VAL "93" AND PEEK (f+VAL "25")=n THEN  LET r$(j)="It's not smiling! Perhaps it": LET r$(a)="doesn't like that fly there!": GO TO d
 8611  IF no=VAL "93" THEN  LET r$(j)="Still a trace of a smile there!": GO TO d
 8612  IF (no=VAL "58" OR no=VAL "94") THEN  BEEP .3,k: GO TO h
 8613  IF no=VAL "108" AND PEEK (f+VAL "25")=n THEN  LET r$(j)="There's a fly on it!": GO TO d
 8614  IF no=VAL "108" THEN  LET r$(j)="Don't be nosey anymore!": GO TO d
 8619  GO TO de
 8620  IF (no=VAL "95" OR no=VAL "58") THEN  BEEP .3,k: GO TO h
 8629  GO TO de
 8630  IF (no=VAL "58" OR no=d) THEN  BEEP .3,k: GO TO h
 8639  GO TO de
 8670  IF no=VAL "74" THEN  LET r$(j)="You see plants and flowers.": GO TO d
 8671  IF no=VAL "102" THEN  LET r$(j)="Just common or garden varieties!": GO TO d
 8672  IF no=VAL "101" THEN  LET r$(j)="Colourful but quite ordinary!": GO TO d
 8673  IF no=VAL "97" THEN  LET r$(j)="{INK 4}Green{INK 7} in the main!": GO TO d
 8674  IF no=VAL "96" THEN  LET r$(j)="None of that variety here.": GO TO d
 8679  GO TO de
 8680  IF no=VAL "74" THEN  POKE (f+VAL "27"),j: LET r$(j)="There are plants, flowers and": LET r$(a)="bushes here. You notice that one": LET r$(b)="of the bushes is a MULBERRY bush": GO TO d
 8681  IF ((no=VAL "98" AND PEEK (f+VAL "26")=n) OR (no=VAL "96" AND PEEK (f+VAL "27")=n)) THEN  LET r$(j)="You're a bit previous!": GO TO d
 8682  IF (no=VAL "97" OR no=VAL "113") THEN  POKE (f+VAL "27"),j: LET r$(j)="In this part of the garden some": LET r$(a)="are of the MULBERRY variety!": GO TO d
 8683  IF (no=VAL "96" OR no=VAL "113") AND PEEK (f+VAL "26")=n THEN  POKE (f+VAL "26"),j: POKE (o+VAL "25"),PEEK f: LET r$(j)="You see some silkworms eating": LET r$(a)="leaves and making very fine": LET r$(b)="THREAD.................(Think!)": GO TO d
 8686  IF (no=VAL "113" OR no=VAL "96" OR no=VAL "97" OR no=VAL "98") THEN  LET r$(j)="You see some silkworms eating": LET r$(a)="leaves and having a party!!": GO TO d
 8687  IF (no=VAL "101" OR no=VAL "102") THEN  GO TO VAL "8670"
 8699  GO TO de
 8700  IF no=VAL "70" THEN  BEEP .3,k: GO TO h
 8701  IF no=h THEN  LET r$(j)="There's a gold slot in it! Ah,": LET r$(a)="there's the RUB!": GO TO d
 8702  IF no=VAL "45" THEN  RANDOMIZE : LET x=INT (RND*b)+j: GO TO VAL "8704"+x
 8703  IF no=VAL "103" THEN  LET r$(j)="Looks a bit special!": GO TO d
 8704  GO TO de
 8705  LET r$(j)="The MUMMY is singing CHEEK TO": LET r$(a)="CHEEK!...........cheeky!": GO TO d
 8706  LET r$(j)="The MUMMY asks ""Do I look like": LET r$(a)="Boris Karloff!!!""": LET r$(b)="Don't answer THAT!": GO TO d
 8707  LET r$(j)="The MUMMY nods his bandages in": LET r$(a)="a chummy way!": GO TO d
 8709  GO TO de
 8800  POKE (f+m),PEEK (f+m)-j: RETURN 
 8805  POKE (f+m),PEEK (f+m)+j: RETURN 
 9900  RANDOMIZE USR VAL "65368": BORDER n: PAPER n: INK i: BRIGHT j: CLS : PRINT AT ab,g;"Press a key to start": PAUSE n
 9912  CLS : PRINT AT c,a;"In front of you there is a";''': PAUSE h: PRINT TAB q; PAPER i; INK a;" RED DOOR "
 9914  PAUSE h: PRINT ''';"   You opened it didn't you!"
 9918  PAUSE d: PRINT '''''': GO SUB pr
 9920  BORDER n: PAPER n: INK g: BRIGHT j: CLS 
 9925  PRINT AT n,n;"You enter what appears to be an EGYPTIAN tomb. Light comes from flickering torches affixed to   the walls. Ancient carvings     adorn a long...."
 9935  PAUSE h: PRINT '';"      What's that noise?"
 9945  PAUSE h: PRINT '';"You look up to see several largeboulders just about to fall on  you..." 
 9950  PAUSE h: PRINT '';TAB p; PAPER i; INK a;" You see RED! "
 9954  PAUSE h: PRINT '';TAB g; PAPER i; INK n;" Then you BLACK out! "
 9956  PAUSE h: GO SUB pr: CLS 
 9960  PAUSE h: PRINT  INK i;AT l,n;"You open your eyes....Everythingis blurred and your mind is     fuzzy...": PAUSE h
 9962  FOR x=VAL "31" TO n STEP -j: PRINT  INK g;AT w,x;a$( TO (VAL "32"-x)): BEEP .03,-t: PAUSE e: NEXT x
 9966  PRINT ''': PAUSE d: GO SUB pr
 9970  POKE VAL "64130",n
 9975  POKE VAL "64528",VAL "32"
 9980  RANDOMIZE USR VAL "65058"
 9985  POKE (f+e),j: POKE (f+m),j: GO TO m
 9999  BEEP .5,d: CLS : PRINT AT l,n: GO SUB pr: GO TO h
