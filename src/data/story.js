// The story: Mateo's tournament week in Cleveland. One chapter plays before
// each fight (same order as the roster), and `ending` plays after the last one.
// who: 'narrator' or a head key.  bg: a backdrop drawn in gfx/cleveland.js.
const MATEO = { who: 'new-mexico', name: 'MATEO' };
const GREG = { who: 'mount-st-marys', name: 'FATHER GREG' };
const TESSA = { who: 'toledo', name: 'TESSA' };
const GARY = { who: 'bowling-green', name: 'GARY' };
const HANNAH = { who: 'ball-state', name: 'HANNAH' };
const RAY = { who: 'ohio', name: 'RAY' };
const TREVOR = { who: 'central-michigan', name: 'TREVOR' };
const say = (speaker, text) => ({ ...speaker, text });
const tell = (text) => ({ who: 'narrator', text });

export const CHAPTERS = [
  {
    title: 'CHAPTER 1', sub: 'HELLO, CLEVELAND',
    panels: [
      { bg: 'lake', place: 'THE LAKEFRONT', lines: [
        tell('TOURNAMENT WEEK. THE WIND COMES OFF THE LAKE LIKE A JAB YOU DID NOT SEE.'),
        say(MATEO, 'A WHOLE CITY OF ANCHORS, FATHER. EVERY ONE OF THEM WANTS MY DESK.'),
        say(GREG, 'AND EVERY ONE OF THEM WORKS OUT, MY SON. I HAVE SEEN THE ARMS.'),
        say(MATEO, 'GOOD. I DID NOT PACK THE SEQUINS TO FIGHT ACCOUNTANTS.'),
      ] },
      { bg: 'flats', place: 'THE FLATS', lines: [
        tell('DOWN BY THE RIVER, THE NEON IS PINK AND THE PIEROGIES ARE HOT.'),
        say(TESSA, 'MATEO SANDOVAL. I HAD YOUR POSTER ON MY WALL. I ALSO HAD A HEAVY BAG UNDER IT.'),
        say(MATEO, 'YOU HIT THE POSTER?'),
        say(TESSA, 'ONLY WHEN I MISSED YOU. BUY ME A PIEROGI AFTER I KNOCK YOU OUT?'),
        say(MATEO, 'LOSER BUYS. I LIKE MINE WITH EXTRA BUTTER.'),
      ] },
    ],
  },
  {
    title: 'CHAPTER 2', sub: 'BRIGHT LIGHTS, OLD PRO',
    panels: [
      { bg: 'flats', place: 'THE FLATS, LATER', lines: [
        say(TESSA, 'OKAY. YOU ARE EVEN PRETTIER UP CLOSE, AND I HATE THAT. HERE IS YOUR PIEROGI.'),
        say(MATEO, 'EXTRA BUTTER. YOU REMEMBERED.'),
        say(TESSA, 'WATCH YOURSELF TOMORROW. GARY TOOK HIS SHIRT OFF IN 1987 AND NEVER PUT IT BACK ON.'),
      ] },
      { bg: 'square', place: 'THE THEATER DISTRICT', lines: [
        tell('UNDER THE GIANT CHANDELIER, A SILVER FOX FLEXES FOR NOBODY IN PARTICULAR.'),
        say(GARY, 'SANDOVAL. FORTY YEARS I HAVE CLOSED THE SHOW IN THIS TOWN. THE LADIES AT THE DELI STILL SAVE ME THE GOOD RYE.'),
        say(MATEO, 'IT IS TEN DEGREES OUT, GARY.'),
        say(GARY, 'AND YET HERE WE BOTH ARE, GLISTENING. LET US GIVE THEM A LATE EDITION.'),
        say(GREG, 'LORD, FORGIVE THEM BOTH. THEN HELP MATEO DODGE THE HOOK.'),
      ] },
    ],
  },
  {
    title: 'CHAPTER 3', sub: 'HEAVY LIFTING',
    panels: [
      { bg: 'dawn', place: 'SUNRISE ON THE LAKE', lines: [
        say(GARY, 'YOU HAVE GOT THE HANDS, KID. AND THE CHEEKBONES. USE THEM WISELY.'),
        say(TESSA, 'TEAM BREAKFAST? I KNOW A MARKET WITH A SAUSAGE STAND THAT WILL CHANGE YOUR LIFE.'),
        say(MATEO, 'TWO DOWN. WHO IS NEXT, FATHER?'),
        say(GREG, 'HANNAH LINDQVIST, OF BALL STATE. THEY SAY SHE BENCH PRESSES THE NEWS VAN.'),
      ] },
      { bg: 'market', place: 'THE MARKET HALL', lines: [
        tell('UNDER THE CLOCK TOWER, A WOMAN CURLS A WHEEL OF CHEESE IN EACH HAND.'),
        say(HANNAH, 'SANDOVAL. I WATCHED YOU FIGHT GARY. NICE FOOTWORK. NICER TRUNKS.'),
        say(MATEO, 'THEY ARE SEQUINED. BY HAND.'),
        say(HANNAH, 'I WILL TRY NOT TO DENT THEM. NO PROMISES ABOUT THE REST OF YOU.'),
        say(TESSA, 'IS IT WRONG THAT I WANT TO WATCH THIS AND ALSO EAT A SAUSAGE?'),
        say(GREG, 'IT IS CLEVELAND, CHILD. THAT IS THE WHOLE POINT.'),
      ] },
    ],
  },
  {
    title: 'CHAPTER 4', sub: 'BLACK TIE OPTIONAL',
    panels: [
      { bg: 'lake', place: 'THE LAKEFRONT, MIDNIGHT', lines: [
        say(HANNAH, 'NOBODY HAS PUT ME DOWN SINCE THE VAN ROLLED BACK ON ME IN MUNCIE. I LIKE YOU.'),
        say(TESSA, 'GET IN LINE.'),
        say(MATEO, 'THREE DOWN. WHO IS LEFT, FATHER?'),
        say(GREG, 'RAY ABERNATHY. HE IS WAITING ON THE BRIDGE. HE SAID TO DRESS UP.'),
      ] },
      { bg: 'bridge', place: 'THE GUARDIANS BRIDGE', lines: [
        tell('STONE GIANTS WATCH THE BRIDGE. BENEATH THEM STANDS A MAN IN A BOW TIE AND VERY LITTLE ELSE.'),
        say(RAY, 'MISTER SANDOVAL. THEY TELL ME YOU FIGHT IN SEQUINS. I RESPECT A MAN WHO COMMITS.'),
        say(MATEO, 'YOU ARE WEARING A BOW TIE WITH NO SHIRT, RAY.'),
        say(RAY, 'THE JACKET IS A RENTAL. THE REST OF ME IS VINTAGE. SHALL WE?'),
        say(HANNAH, 'I WOULD LIKE IT NOTED THAT THIS IS THE BEST WEEK OF MY LIFE.'),
      ] },
    ],
  },
  {
    title: 'CHAPTER 5', sub: 'THE MAIN EVENT',
    panels: [
      { bg: 'arena', place: 'THE ARENA', lines: [
        tell('SPOTLIGHTS SWEEP THE SKY. THE WHOLE CITY HAS COME DOWNTOWN FOR THE GOLDEN MIC.'),
        say(RAY, 'A WORD OF ADVICE. HOLLOWAY HAS NEVER BLINKED ON AIR. NOT ONCE. IT IS UNSETTLING.'),
        say(TREVOR, 'SANDOVAL. YOU CHARMED MY WHOLE CIRCUIT. TESSA WILL NOT STOP TALKING ABOUT YOUR CHEEKBONES.'),
        say(MATEO, 'THEY ARE LOAD BEARING.'),
        say(TREVOR, 'CUTE. THE MIC STAYS WITH ME. BUT I WILL LET YOU HOLD IT ONCE, BEFORE YOU GO DOWN.'),
        say(GREG, 'THIS IS IT, MY SON. HANDS UP, CHIN DOWN, SEQUINS OUT.'),
      ] },
    ],
  },
];

export const ENDING = {
  title: 'CHAMPION', sub: 'THE GOLDEN MIC IS YOURS',
  panels: [
    { bg: 'arena', place: 'THE ARENA', lines: [
      say(TREVOR, 'I BLINKED. FIRST TIME IN SIX YEARS. HERE. TAKE THE MIC BEFORE I CHANGE MY MIND.'),
      say(MATEO, 'IT IS HEAVIER THAN IT LOOKS.'),
      say(HANNAH, 'I CAN CARRY IT FOR YOU. AND YOU. AT THE SAME TIME.'),
    ] },
    { bg: 'dawn', place: 'SUNRISE ON THE LAKE', lines: [
      say(TESSA, 'SO WHAT NOW, CHAMP? CLEVELAND IS ALL OUT OF ANCHORS.'),
      say(GARY, 'HEAD WEST, KID. THE MOUNTAIN CIRCUIT. THIN AIR AND THICK ARMS.'),
      say(GREG, 'I HEAR LUPE ARCHULETA HAS BEEN ASKING ABOUT YOU, MY SON. SHE DID NOT SOUND FRIENDLY.'),
      say(MATEO, 'LUPE. OF COURSE. PACK THE GOOD SEQUINS, FATHER.'),
      tell('END OF THE MID-MAJOR CIRCUIT. THANK YOU FOR PLAYING.'),
    ] },
  ],
};
