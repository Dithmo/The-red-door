   10  CLEAR 58423
   20  BORDER 0: PAPER 0: INK 0: BRIGHT 1: CLS 
   30  LOAD ""CODE 23300
   40  POKE 23658,8: POKE 23606,0: POKE 23607,249
   50  RANDOMIZE USR 23300
   55  GO TO 8900
   60  PRINT  INK 4;AT 12,14;"FROM";AT 14,10;"YOUR SINCLAIR"; INK 5;AT 16,14;"AND";AT 18,9;"TARTAN SOFTWARE"
   65  PRINT AT 0,0
   70  RANDOMIZE USR 23377
   80  POKE 23606,56: POKE 23607,227
   90  CLS 
  100  PRINT  INK 6;AT 1,3;"TARTAN SOFTWARE,";AT 2,3;"61,BAILIE NORRIE CRESCENT,";AT 3,3;"MONTROSE, ANGUS,";AT 4,3;"SCOTLAND.   DD10 9DT"
  110  PRINT : PRINT  INK 5;" This adventure was taken from   "; INK 7;"6-in-1"; INK 5;", which is a compilation  of six adventures of differing  difficulties. The complete      current catalogue of TARTAN     SOFTWARE adventures is:......."
  112  PRINT " "; PAPER 6; INK 0;"SIX-in-ONE...............£4.95"
  115  PRINT " "; PAPER 7; INK 0;"SHIPWRECK/CASTLE EERIE...£2.95"
  120  PRINT " "; PAPER 4; INK 0;"PRINCE OF TYNDAL.........£1.95"
  125  PRINT " "; PAPER 6; INK 0;"RAMHOTEP/PROSPECTOR......£2.95"
  130  PRINT " "; PAPER 5; INK 0;"DOUBLE AGENT + ESCAPE....£3.95"
  135  PRINT : PRINT  INK 7;" Compilations of any collection  of the above adventures are     available. Write for details."
  185  INK 0: PRINT AT 4,0;
  190  LOAD ""
 8800  FOR x=-5 TO 15
 8802  BEEP .02,x: NEXT x
 8804  FOR x=14 TO -5 STEP -1
 8806  BEEP .02,x: NEXT x
 8808  RETURN 
 8901  PRINT  INK 6;AT 7,10;"STOP TAPE";AT 9,13;"and"
 8902  PRINT  INK 5;AT 12,8;"press any key"
 8904  BEEP .03,40
 8905  PAUSE 10
 8906  IF INKEY$<>"" THEN  GO TO 8910
 8908  GO TO 8904
 8910  CLS 
 8912  PRINT  INK 6;AT 8,1;"Press ""I"" to read Introduction"
 8914  GO TO 9102
 9000  LET line=9010
 9005  INK 7
 9010  GO SUB 9800
 9011  PRINT "An adventure is totally unlike  a fast reaction arcade game---  there is no demand for speedy   reaction but SOME brain power   and a degree of lateral thinkingmay be required to complete the game."
 9012  PRINT : PRINT "An adventure places the player  in a world of his/her own, with a task to achieve and usually   many puzzles to solve before    THE END."
 9013  PRINT : PRINT "The computer acts as your sensesand accepts instructions from   commands in ENGLISH from the    keyboard."
 9019  GO TO 9700
 9020  GO SUB 9800
 9021  PRINT "Most adventure games will acceptshortened versions of frequentlyused commands such that:-"
 9022  PRINT : PRINT "{INK 6}N{INK 7},{INK 6}S{INK 7},{INK 6}E{INK 7},{INK 6}W{INK 7} etc can be used instead of {INK 6}GO NORTH{INK 7}, {INK 6}GO SOUTH{INK 7} etc."
 9023  PRINT : PRINT "{INK 4}I{INK 7} (for {INK 4}INVENTORY{INK 7} or {INK 4}LIST{INK 7}) will  itemise the objects which you   have in your possession."
 9024  PRINT : PRINT "{INK 5}R{INK 7} (or sometimes {INK 5}L{INK 7} or {INK 5}LOOK{INK 7}) will redescribe the current location.Can be useful if the details    have scrolled off the screen."
 9029  GO TO 9700
 9030  GO SUB 9800
 9031  PRINT "Other single word commands:-"
 9032  PRINT : PRINT ;"{INK 6}HELP{INK 7} or {INK 6}HINT{INK 7}..not always useful!"
 9033  PRINT : PRINT "{INK 5}QUIT{INK 7} (or {INK 5}STOP{INK 7}) enables you to   organise a fresh start.........."
 9034  PRINT : PRINT "{INK 4}SAVE{INK 7} allows you to retain your  current position in the game,   either to tape for a permanent  SAVE or into the memory of the  computer for a temporary SAVE."
 9035  PRINT : PRINT "{INK 6}LOAD{INK 7} permits the reinstatement  of a {INK 4}SAVED{INK 7} position either from tape or from the memory of the  computer. Details of specific   requirements will be found on   the inlay card. {INK 4}STORE{INK 7} and {INK 6}RECALL{INK 7}may sometimes be used."
 9039  GO TO 9700
 9040  GO SUB 9800
 9041  PRINT "{INK 6}SCORE{INK 7} can on occasions give an  indication of your progress."
 9042  PRINT : PRINT "GET (or TAKE) is the usual      command to pick up an object.   Until recently it had been the  convention that any object whichcould be picked up would be     included in the {INK 4}HERE YOU CAN SEE{INK 7}section, but that no longer     necessarily holds."
 9043  PRINT : PRINT "DROP (or LEAVE), or in special  cases {INK 5}THROW{INK 7} or {INK 4}TOSS{INK 7} are used to dispense with an object."
 9044  PRINT : PRINT "{INK 4}EXAMINE {INK 7}object sometimes can    provide more useful information."
 9049  GO TO 9700
 9050  GO SUB 9800
 9051  PRINT "{INK 4}GAME PLAYING HINTS{INK 7}"
 9052  PRINT : PRINT "Always draw a map and note on itthe position of any found object"
 9053  PRINT : PRINT "Most adventure programs take    notice of only the first few    letters of each typed-in word-  the number can vary from 3 to 5 although on occasions a program may require the full word."
 9054  PRINT : PRINT "So if {INK 4}UNL CUP{INK 7} does not elicit   the correct response then try   {INK 6}UNLO CUPB{INK 7}....{INK 5}UNLOC CUPBO{PAPER 7}{PAPER 0}{INK 7}........{INK 4}UNLOCK CUPBOARD....etc.":{INK 7} PRINT : PRINT "(This adventure requires the    first 5 letters.)"
 9059 {INK 7} GO TO 9700
 9060  GO SUB 9800
 9061  PRINT "{INK 7}{PAPER 2}{PAPER 0}{PAPER 2}Explore{PAPER 0} as much as possible at  your first attempt (only after  carefully reading ALL the detailof the inlay card), then start  again when you have made at     least some progress."
 9062  PRINT : PRINT "Many adventures, like this one, require mainly an input of {INK 4}VERB-NOUN{INK 7} (eg {INK 6}GET KEY{INK 7}) but several   can accept inputs of complete   sentences."
 9063  PRINT : PRINT "{PAPER 1}READ{INK 0}{PAPER 0}{INK 7} what appears on the screen VERY carefully as a hasty glancecan often result in missing somepiece of vital information."
 9069  GO TO 9700
 9070  GO SUB 9800
 9071  PRINT "If an action does not work then try synonyms, particularly for  VERBS. eg CLOSE BOX may not workbut SHUT BOX might."
 9072  PRINT : PRINT "Keep an open mind and remember  that most objects will have someuse albeit not the expected one!eg A paper CLIP may be used to  PICK LOCK rather than hold a    sheaf of papers together."
 9073  PRINT : PRINT "If a source of light ({INK 6}TORCH {INK 7}or  {INK 6}CANDLE{INK 7}) is required in some darklocations then be sure to switchoff or extinguish when it is notrequired as there is likely to  be a time limit on the use of   the light source."
 9079  GO TO 9700
 9080  GO SUB 9800
 9081  PRINT "Commands to activate lights varyfrom the obvious {INK 6}LIGHT TORCH {INK 7}to {INK 6}TORCH ON{INK 7}, {INK 6}ON TORCH{INK 7}, {INK 6}SWITCH ON{INK 7} oreven just {INK 6}ON{INK 7}."
 9082  PRINT : PRINT "Be careful with fragile items asthey MAY break if you DROP them!"
 9083  PRINT : PRINT "If an item of apparel cannot be worn then be sure it has some   other, probably obcsure use!"
 9084  PRINT : PRINT "Check your INVENTORY at start ofthe adventure."
 9085  PRINT : PRINT "If a temporary SAVE command is  available then make good use of it before trying any possibly   dangerous command such as {INK 5}JUMP  RAVINE{INK 7}!"
 9089  GO TO 9700
 9090  GO SUB 9800
 9091  PRINT "Many adventures incorporate a   MAZE puzzle and the way through {PAPER 7}{PAPER 2}may{PAPER 0} be ""mapped"" by dropping     objects in each of the locationsof the MAZE (SAVE first!)."
 9092  PRINT : PRINT "In the first MAZE location DROP an object and then, if on going {INK 6}N{INK 7}, the object is still there youknow that you have in fact not  ""moved."""
 9093  PRINT : PRINT "Try other directions until you  find that you HAVE moved then   DROP another object. Continue   with this approach until the    route through the MAZE becomes  apparent."
 9094  GO TO 9700
 9101  CLS : PRINT AT 8,6;"{INK 6}Press I to read the             Introduction again."
 9102 {INK 7} PRINT AT 11,0;"{INK 5} Press any other key and start  the tape to LOAD the adventure."{INK 7}
 9104  PAUSE 0
 9105  IF INKEY$="I" THEN  GO TO 8990
 9106  CLS : PRINT AT 5,1;" {INK 5}HAPPY ADVENTURING!  {INK 6}HAVE FUN!{INK 7}": GO SUB 8800: PAUSE 30: GO TO 60
 9110  LET line=line-10: GO TO line
 9700  LET line=line+10: PRINT ;#1;AT 1,0;"{PAPER 2}{INK 6}""F"">>forward ""B"">>back ""Q"">>quit{PAPER 0}{INK 7}"
 9701  RANDOMIZE USR 23460
 9702  PAUSE 0
 9703  IF INKEY$="F" THEN  GO TO line
 9704  IF INKEY$="B" THEN  LET line=line-20: GO TO line
 9705  IF INKEY$="Q" THEN  CLS : GO TO 9100
 9706  GO TO 9702
 9800  PRINT AT 0,7;"                 "
 9802  RANDOMIZE USR 23400
 9809  PRINT  PAPER 2;AT 0,7;" ADVENTURE GUIDE ";AT 1,0
 9810  RETURN 
 9990  SAVE "rdys2" LINE 1: POKE 23736,181: SAVE "code"CODE 23300,240: PAUSE 300: POKE 23736,181: RANDOMIZE USR 23363: STOP 
 9999  FOR x=1 TO 5: BEEP .1,50: NEXT x: RANDOMIZE USR 23400: PRINT  PAPER 0; INK 6;AT 8,8;" HELLO THERE ": PAUSE 50: PRINT  PAPER 2; INK 7;AT 19,3;" PRESS ANY KEY TO RESTART ": PAUSE 0: GO TO 9000
