// ========== Alphabricks ==========

// --- Constants ---
const COLS = 10;
const ROWS = 20;
const CELL = 30; // pixel size per cell
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;
const WORDS_PER_LEVEL = 5;

// Tetromino shapes (each rotation state)
const SHAPES = {
  I: [[[0,0],[1,0],[2,0],[3,0]], [[0,0],[0,1],[0,2],[0,3]]],
  O: [[[0,0],[1,0],[0,1],[1,1]]],
  T: [[[0,0],[1,0],[2,0],[1,1]], [[0,0],[0,1],[0,2],[1,1]], [[1,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[0,1]]],
  S: [[[1,0],[2,0],[0,1],[1,1]], [[0,0],[0,1],[1,1],[1,2]]],
  Z: [[[0,0],[1,0],[1,1],[2,1]], [[1,0],[1,1],[0,1],[0,2]]],
  L: [[[0,0],[1,0],[2,0],[0,1]], [[0,0],[1,0],[1,1],[1,2]], [[2,0],[0,1],[1,1],[2,1]], [[0,0],[0,1],[0,2],[1,2]]],
  J: [[[0,0],[1,0],[2,0],[2,1]], [[0,0],[1,0],[0,1],[0,2]], [[0,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[0,2]]]
};

const SHAPE_NAMES = Object.keys(SHAPES);

const COLORS = {
  I: '#00f0f0', O: '#f0f000', T: '#a000f0',
  S: '#00f000', Z: '#f00000', L: '#f0a000', J: '#0000f0'
};

// Letter frequencies (roughly matching English)
const LETTER_FREQ = {
  A:8,B:2,C:3,D:4,E:12,F:2,G:3,H:5,I:7,J:1,K:1,L:4,M:3,
  N:7,O:8,P:2,Q:0,R:6,S:6,T:9,U:3,V:1,W:2,X:0,Y:2,Z:0
};

// Build weighted pool
const LETTER_POOL = [];
for (const [ch, w] of Object.entries(LETTER_FREQ)) {
  for (let i = 0; i < w; i++) LETTER_POOL.push(ch);
}

// Score table
function wordScore(len) {
  if (len <= 3) return 100;
  if (len === 4) return 200;
  if (len === 5) return 400;
  if (len === 6) return 800;
  return 1600;
}

// --- Dictionary ---
// We'll load a dictionary from a bundled word list.
// For simplicity we embed a generation approach + fetch fallback.
let DICT = new Set();
let dictReady = false;

async function loadDictionary() {
  // Try to load the bundled word list first
  try {
    const resp = await fetch('words.txt');
    if (resp.ok) {
      const text = await resp.text();
      for (const w of text.split('\n')) {
        const t = w.trim().toUpperCase();
        if (t.length >= 3) DICT.add(t);
      }
      dictReady = true;
      console.log(`Dictionary loaded: ${DICT.size} words`);
      return;
    }
  } catch(e) {}

  // Fallback: generate a small built-in dictionary
  console.log('Using built-in dictionary');
  const builtIn = getBuiltInWords();
  for (const w of builtIn) DICT.add(w.toUpperCase());
  dictReady = true;
  console.log(`Built-in dictionary: ${DICT.size} words`);
}

function getBuiltInWords() {
  // A reasonable set of common 3-7 letter English words
  return [
    // 3-letter
    "the","and","for","are","but","not","you","all","can","had","her","was","one","our","out",
    "day","get","has","him","his","how","its","may","new","now","old","see","way","who","did",
    "oil","sit","top","red","run","set","sun","ten","two","war","act","age","ago","air","ask",
    "ate","bag","ban","bar","bat","bed","big","bit","box","boy","bus","buy","cap","car","cat",
    "cop","cow","cry","cup","cut","dad","die","dig","dog","dot","dry","due","ear","eat","egg",
    "end","eye","fan","far","fat","few","fit","fix","fly","fun","gap","gas","god","got","gun",
    "gut","guy","hat","hey","hit","hot","ice","ill","ion","jar","jet","job","joy","key","kid",
    "kit","lab","lap","law","lay","led","leg","let","lie","lip","log","lot","low","map","mat",
    "mix","mom","mud","net","nor","nut","odd","pan","pay","pen","per","pet","pie","pin","pit",
    "pop","pot","put","ran","raw","rid","rod","row","sad","sat","saw","sea","sir","six","ski",
    "sky","son","spy","sum","tab","tan","tap","tax","tea","ten","the","tie","tin","tip","toe",
    "ton","too","try","van","via","vet","wet","win","wit","won","yes","yet","zoo",
    // 4-letter
    "able","also","area","army","away","back","ball","band","bank","base","bath","bear","beat",
    "been","bell","best","bill","bird","blow","blue","boat","body","bomb","bond","bone","book",
    "born","boss","both","burn","busy","cafe","cake","call","calm","came","camp","card","care",
    "case","cash","cast","cell","chat","chip","city","club","coal","coat","code","cold","come",
    "cook","cool","cope","copy","core","cost","crew","crop","dark","data","date","dead","deal",
    "dear","debt","deep","deny","desk","diet","dirt","dish","disk","does","done","door","dose",
    "down","drag","draw","drew","drop","drug","drum","dual","duke","dump","dust","duty","each",
    "earn","ease","east","easy","edge","edit","else","euro","even","ever","evil","exam","exec",
    "exit","face","fact","fade","fail","fair","fall","fame","farm","fast","fate","fear","feed",
    "feel","feet","fell","file","fill","film","find","fine","fire","firm","fish","five","flag",
    "flat","fled","flew","flip","flow","fold","folk","font","food","fool","foot","ford","fore",
    "form","fort","foul","four","free","from","fuel","full","fund","fury","gain","game","gang",
    "gate","gave","gear","gene","gift","girl","give","glad","goal","goes","gold","golf","gone",
    "good","grab","gray","grew","grey","grin","grip","grow","gulf","guru","half","hall","hand",
    "hang","hard","harm","hate","have","head","hear","heat","held","hell","help","here","hero",
    "hide","high","hill","hint","hire","hold","hole","holy","home","hope","horn","host","hour",
    "huge","hung","hunt","hurt","idea","inch","into","iron","item","jack","jail","jean","join",
    "joke","jump","jury","just","keen","keep","kept","kick","kill","kind","king","knee","knew",
    "knot","know","lack","lady","laid","lake","land","lane","last","late","lead","left","lend",
    "less","life","lift","like","line","link","list","live","loan","lock","long","look","lord",
    "lose","loss","lost","love","luck","made","mail","main","make","male","many","mark","mass",
    "mate","meal","mean","meat","meet","menu","mere","mile","milk","mill","mind","mine","miss",
    "mode","mood","moon","more","most","move","much","must","name","navy","near","neat","neck",
    "need","news","next","nice","nine","node","none","norm","nose","note","odds","okay","once",
    "only","onto","open","pace","pack","page","paid","pain","pair","pale","palm","park","part",
    "pass","past","path","peak","pick","pile","pine","pink","pipe","plan","play","plot","plug",
    "plus","poem","poet","pole","poll","pond","pool","poor","pope","port","pose","post","pour",
    "pray","pull","pump","pure","push","race","rage","rain","rank","rare","rate","read","real",
    "rear","rely","rent","rest","rice","rich","ride","ring","rise","risk","road","rock","rode",
    "role","roll","roof","room","root","rope","rose","ruin","rule","rush","safe","said","sake",
    "sale","salt","same","sand","sang","save","seal","seat","seed","seek","seem","seen","self",
    "sell","send","sent","sept","ship","shop","shot","show","shut","sick","side","sign","silk",
    "sink","site","size","skin","slip","slow","snow","sock","soft","soil","sold","sole","some",
    "song","soon","sort","soul","spin","spot","star","stay","stem","step","stir","stop","such",
    "suit","sure","swim","tail","take","tale","talk","tall","tank","tape","task","team","tear",
    "tell","tend","tent","term","test","text","than","that","them","then","they","thin","this",
    "thus","tick","tide","tile","till","time","tiny","tire","told","toll","tone","took","tool",
    "tops","tore","torn","tour","town","trap","tree","trim","trio","trip","true","tube","tuck",
    "tune","turn","twin","type","ugly","unit","upon","used","user","vale","vary","vast","very",
    "vice","view","vote","wage","wait","wake","walk","wall","ward","warm","warn","wash","vast",
    "wave","weak","wear","week","well","went","were","west","what","when","whom","wide","wife",
    "wild","will","wind","wine","wing","wire","wise","wish","with","wood","word","wore","work",
    "worm","worn","wrap","yard","yeah","year","yoga","your","zero","zone",
    // 5-letter
    "about","above","abuse","actor","acute","admit","adopt","adult","after","again","agent",
    "agree","ahead","alarm","album","alien","align","alike","alive","allow","alone","along",
    "alter","among","angel","anger","angle","angry","apart","apple","apply","arena","argue",
    "arise","aside","asset","avoid","award","aware","awful","basic","basis","beach","begun",
    "being","below","bench","billy","birth","black","blade","blame","blank","blast","blaze",
    "bleed","blend","bless","blind","block","blood","blown","board","bonus","booth","bound",
    "brain","brand","brave","bread","break","breed","brick","brief","bring","broad","broke",
    "brown","brush","build","built","bunch","burst","buyer","cabin","candy","carry","catch",
    "cause","chain","chair","chaos","charm","chart","chase","cheap","check","cheek","cheer",
    "chess","chest","chief","child","china","choir","chose","chunk","civil","claim","class",
    "clean","clear","climb","cling","clock","clone","close","cloud","coach","coast","color",
    "comes","comic","coral","could","count","court","cover","crack","craft","crash","crazy",
    "cream","crime","cross","crowd","crown","cruel","crush","curve","cycle","daily","dance",
    "death","debut","delay","depth","derby","devil","diary","dirty","doubt","downs","dozen",
    "draft","drain","drama","drank","drawn","dream","dress","dried","drift","drill","drink",
    "drive","drove","dying","eager","early","earth","eight","elect","elite","email","empty",
    "enemy","enjoy","enter","entry","equal","error","essay","event","every","exact","exist",
    "extra","faith","false","fancy","fatal","fault","feast","fiber","field","fifth","fifty",
    "fight","final","first","fixed","flame","flash","fleet","flesh","float","flood","floor",
    "fluid","fly","focus","force","forth","found","frame","frank","fraud","fresh","front",
    "fruit","fully","given","glass","globe","gloom","gonna","grace","grade","grain","grand",
    "grant","graph","grasp","grass","grave","great","green","greet","grief","gross","group",
    "grown","guard","guess","guest","guide","guilt","happy","harsh","heart","heavy","hence",
    "horse","hotel","house","human","humor","ideal","image","imply","index","inner","input",
    "issue","ivory","jewel","joint","jones","judge","juice","known","label","large","laser",
    "later","laugh","layer","learn","least","leave","legal","level","light","limit","lived",
    "local","logic","loose","lover","lower","loyal","lucky","lunch","magic","major","maker",
    "manor","march","match","maybe","mayor","meant","media","mercy","metal","might","minor",
    "minus","model","money","month","moral","motor","mount","mouth","moved","movie","music",
    "naked","nerve","never","newly","night","noble","noise","north","noted","novel","nurse",
    "occur","ocean","offer","often","opera","orbit","order","other","ought","outer","paint",
    "panel","panic","paper","patch","pause","peace","penny","phase","phone","photo","piano",
    "piece","pilot","pitch","pixel","place","plain","plane","plant","plate","plaza","plead",
    "pluck","point","polar","pound","power","press","price","pride","prime","print","prior",
    "prize","proof","proud","prove","psalm","pupil","queen","quest","queue","quick","quiet",
    "quite","quote","radar","radio","raise","rally","range","rapid","ratio","reach","ready",
    "realm","rebel","refer","reign","relax","renew","repay","reply","rider","right","rigid",
    "rival","river","robot","rocky","roman","rough","round","route","royal","rugby","rural",
    "saint","salad","sauce","saved","scale","scene","scope","score","sense","serve","seven",
    "shall","shame","shape","share","sharp","sheep","sheer","sheet","shelf","shell","shift",
    "shine","shirt","shock","shoot","shore","short","shout","shown","sight","since","sixth",
    "sixty","sized","skill","slate","sleep","slice","slide","small","smart","smell","smile",
    "smoke","snake","solar","solid","solve","sorry","sound","south","space","spare","speak",
    "speed","spend","spent","spill","spite","split","spoke","sport","spray","squad","staff",
    "stage","stake","stall","stamp","stand","stare","stark","start","state","stays","steam",
    "steel","steep","steer","stick","stiff","still","stock","stone","stood","store","storm",
    "story","stove","strip","stuck","study","stuff","style","sugar","suite","super","surge",
    "swamp","swear","sweep","sweet","swept","swift","swing","sword","taken","taste","teach",
    "teeth","thank","theme","there","thick","thing","think","third","those","three","threw",
    "throw","tight","tired","title","today","token","total","touch","tough","tower","toxic",
    "trace","track","trade","trail","train","trait","trash","treat","trend","trial","tribe",
    "trick","tried","troop","truck","truly","trump","trunk","trust","truth","tumor","twice",
    "twist","ultra","uncle","under","union","unity","until","upper","upset","urban","usual",
    "valid","value","video","vigor","virus","visit","vital","vivid","vocal","voice","voter",
    "waste","watch","water","weave","weigh","weird","whale","wheat","wheel","where","which",
    "while","white","whole","whose","wider","woman","world","worry","worse","worst","worth",
    "would","wound","write","wrong","wrote","yield","young","yours","youth",
    // 6-letter
    "accept","access","across","action","active","actual","advise","affair","afford","agreed",
    "almost","always","amount","animal","annual","answer","anyone","appeal","appear","artist",
    "assume","attack","August","author","battle","become","before","behalf","behind","belong",
    "beside","better","beyond","bishop","border","bother","bottom","branch","breath","bridge",
    "bright","broken","budget","burden","bureau","butter","camera","cancer","carbon","career",
    "castle","caught","caused","center","centre","chance","change","charge","choice","choose",
    "chosen","church","circle","client","closed","closer","coffee","column","combat","common",
    "comply","copper","corner","costly","cotton","county","couple","course","create","credit",
    "crisis","custom","damage","danger","dealer","debate","decade","defend","define","degree",
    "demand","depend","deputy","desert","design","desire","detail","device","differ","dinner",
    "direct","divide","doctor","domain","double","driven","driver","during","easily","eating",
    "editor","effect","effort","eighth","either","emerge","empire","employ","enable","ending",
    "energy","engage","engine","enough","ensure","entire","entity","equity","escape","estate",
    "ethnic","evolve","exceed","except","excuse","expect","expert","export","extend","extent",
    "fabric","facing","factor","failed","fairly","family","farmer","father","favour","female",
    "figure","filter","finger","finish","flight","flying","follow","forced","forest","forget",
    "formal","format","former","foster","fought","fourth","freeze","friend","frozen","future",
    "gained","garage","garden","gather","gender","gentle","giving","global","golden","govern",
    "growth","guilty","guitar","handle","happen","hardly","header","health","height","hidden",
    "honest","horror","impact","import","impose","income","indeed","inform","injury","inner",
    "insert","inside","insist","intact","intend","invest","island","itself","jersey","launch",
    "lawyer","leader","league","lesson","letter","lifted","likely","linear","linked","liquid",
    "listen","little","living","losing","lovely","mainly","manage","manner","margin","marked",
    "market","master","matter","medium","member","memory","mental","merely","method","middle",
    "mighty","miller","minute","mirror","mobile","modern","modest","moment","mostly","mother",
    "motion","moving","murder","muscle","museum","mutual","myself","namely","narrow","nation",
    "native","nature","nearby","nearly","neatly","needle","normal","notice","notion","number",
    "object","obtain","occupy","offend","office","online","option","orange","origin","others",
    "outfit","output","oxford","packet","palace","parent","partly","passed","patrol","patron",
    "paying","people","period","permit","person","phrase","picked","pillar","planet","player",
    "please","pledge","plenty","pocket","poetry","police","policy","prefer","pretty","prince",
    "prison","profit","proper","proven","public","pursue","pushed","racial","random","rather",
    "rating","reader","really","reason","recall","record","reduce","reform","regard","regime",
    "region","reject","relate","relief","remain","remote","remove","render","repair","repeat",
    "report","rescue","resign","resist","resort","result","retail","retain","retire","return",
    "reveal","review","reward","ritual","robust","ruling","runner","rustic","safely","salary",
    "sample","screen","search","season","second","secret","sector","secure","select","senior",
    "series","settle","severe","shadow","should","signal","silent","silver","simple","simply",
    "single","sister","slight","slowly","smooth","social","solely","source","speech","sphere",
    "spirit","spread","spring","square","stable","stance","stated","status","steady","stolen",
    "strain","strand","stream","street","stress","strict","strike","string","stroke","strong",
    "struck","studio","submit","sudden","suffer","summer","summit","supply","surely","survey",
    "switch","symbol","system","tackle","talent","target","temple","tender","terror","thanks",
    "thirty","threat","thrown","tissue","tongue","toward","travel","treaty","tribal","tricky",
    "trophy","tunnel","turned","twelve","twenty","unfair","unique","united","unlike","update",
    "useful","valley","varied","versus","victim","virgin","vision","visual","volume","walker",
    "wealth","weapon","weekly","weight","wholly","wicked","widely","window","winner","winter",
    "wisdom","within","wonder","wooden","worker","worthy","writer","yellow",
    // 7-letter
    "ability","absence","academy","account","accused","achieve","acquire","address","advance",
    "advised","adviser","against","already","analyse","ancient","another","anxiety","anybody",
    "applied","arrival","article","assault","attempt","attract","auction","average","banking",
    "barrier","battery","bearing","because","bedroom","believe","beneath","benefit","besides",
    "between","billion","borough","breathe","brought","brother","cabinet","cabinet","captain",
    "capture","careful","carried","caution","ceiling","central","century","certain","chamber",
    "channel","chapter","charity","checked","chicken","citizen","classic","climate","cluster",
    "coastal","collect","college","combine","comfort","command","comment","compact","company",
    "compare","compete","complex","concept","concern","conduct","confine","confirm","connect",
    "consent","consist","contact","contain","content","context","control","convert","correct",
    "council","country","counter","coupled","courage","cricket","crystal","culture","current",
    "curtain","cutting","damaged","dealing","decided","declare","decline","default","defence",
    "deficit","deliver","deposit","desktop","despite","destroy","develop","devoted","digital",
    "disease","dismiss","display","distant","disturb","divided","drawing","dressed","driving",
    "eastern","economy","edition","elderly","elected","element","embrace","emotion","emperor",
    "enabled","endless","enforce","engaged","enquiry","essence","evening","evident","exactly",
    "examine","example","excited","exhibit","expense","explain","exploit","explore","express",
    "extract","extreme","factory","faculty","failure","fashion","feature","federal","feeding",
    "fiction","fighter","finally","finance","finding","fishing","fitness","flowing","foreign",
    "formula","fortune","forward","founder","freedom","funeral","further","gallery","gateway",
    "general","genetic","genuine","gesture","getting","glasses","glimpse","goddess","graphic",
    "greatly","growing","habitat","halfway","hanging","heading","hearing","heating","helpful",
    "herself","highway","himself","history","holiday","horizon","hostile","housing","however",
    "hunting","husband","imagine","illness","illegal","imagine","imaging","illegal","implied",
    "imposed","improve","include","indexes","initial","inquiry","inspect","install","instead",
    "interim","invader","involve","Islamic","Justice","justify","keeping","killing","kindred",
    "kingdom","kitchen","knowing","lacking","landing","lasting","lawsuit","leading","learned",
    "leather","leaving","lending","lecture","lengthy","leopard","liberal","liberty","licence",
    "license","limited","linking","listing","literal","logical","longest","looking","loyalty",
    "machine","manager","married","massive","mastery","meaning","measure","medical","meeting",
    "mineral","minimal","minimum","miracle","missing","mission","mistake","mixture","mobster",
    "monitor","monthly","morning","mounted","mystery","natural","neither","nervous","network",
    "neutral","notably","nothing","nowhere","nuclear","nursing","obesity","obvious","offense",
    "offered","officer","opening","operate","opinion","optical","organic","outcome","outdoor",
    "outlook","outside","overall","oversee","ominous","package","painful","painted","parking",
    "partial","partner","passage","passing","passion","patient","pattern","payment","penalty",
    "pending","pension","percent","perfect","perhaps","phoenix","picture","placing","planned",
    "plastic","playful","pleased","pointer","polling","popular","portion","poverty","predict",
    "premier","premium","prepare","present","prevent","pricing","primary","printer","privacy",
    "private","problem","proceed","process","produce","product","profile","program","project",
    "promise","promote","protect","protein","protest","provide","publish","pulling","purpose",
    "pushing","qualify","quality","quarter","quickly","radical","rainbow","raising","ranking",
    "reading","reality","receipt","receive","recover","recover","reduced","reflect","refugee",
    "regular","related","release","remains","removal","removed","renewal","replace","reports",
    "request","require","reserve","resolve","respect","respond","restore","retired","retreat",
    "returns","revenue","reverse","revival","routine","running","rushing","satisfy","scatter",
    "scholar","science","section","segment","serious","serving","session","setting","seventh",
    "several","shallow","shelter","shortly","silicon","similar","sitting","skilled","slavery",
    "smoking","society","soldier","somehow","sorting","speaker","special","species","sponsor",
    "squeeze","stadium","station","storage","strange","stretch","student","subject","succeed",
    "success","suggest","supreme","surface","surgeon","surplus","survive","suspect","sustain",
    "tactics","teacher","tension","theatre","therapy","thereby","thought","through","tobacco",
    "tonight","totally","touched","tourism","tourist","trading","traffic","trainer","trouble",
    "turning","typical","uniform","unknown","unusual","utility","vaccine","variety","various",
    "vehicle","venture","version","veteran","viewing","village","violent","virtual","visible",
    "waiting","walking","wanting","warning","warrant","washing","wearing","weather","wedding",
    "weekend","welfare","western","whoever","willing","winning","witness","working","worship",
    "writing","written"
  ];
}

// --- Board State ---
let board = []; // board[row][col] = { letter, color } or null
let score = 0;
let level = 1;
let wordsCleared = 0;
let gameOver = false;
let paused = false;
let currentPiece = null;
let nextPiece = null;
let dropTimer = 0;
let lastTime = 0;
let animating = false;
let recentWords = [];
let highlightedCells = []; // [{x, y, word, pts, startTime}]
let highlightStartTime = 0;
const HIGHLIGHT_DURATION = 500; // ms

// Canvas
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('next-preview');
const previewCtx = previewCanvas.getContext('2d');

// UI elements
const scoreDisplay = document.getElementById('score-display');
const levelDisplay = document.getElementById('level-display');
const wordsDisplay = document.getElementById('words-display');
const wordsFoundDiv = document.getElementById('words-found');
const overlay = document.getElementById('overlay');
const overlayContent = document.getElementById('overlay-content');
const startBtn = document.getElementById('start-btn');

// --- Board helpers ---
function initBoard() {
  board = [];
  for (let r = 0; r < ROWS; r++) {
    board.push(new Array(COLS).fill(null));
  }
}

function getDropInterval() {
  // Starts at 800ms, decreases with level
  return Math.max(100, 800 - (level - 1) * 60);
}

// --- Piece ---
function randomLetter() {
  return LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
}

function createPiece() {
  const shapeName = SHAPE_NAMES[Math.floor(Math.random() * SHAPE_NAMES.length)];
  const rotations = SHAPES[shapeName];
  const rotation = 0;
  const cells = rotations[rotation];
  const letters = cells.map(() => randomLetter());

  // Center piece horizontally
  const maxX = Math.max(...cells.map(c => c[0]));
  const x = Math.floor((COLS - maxX - 1) / 2);

  return {
    shapeName,
    rotation,
    x,
    y: 0,
    cells, // relative positions [{x,y}, ...]
    letters,
    color: COLORS[shapeName]
  };
}

function getAbsoluteCells(piece) {
  return piece.cells.map(([cx, cy]) => [piece.x + cx, piece.y + cy]);
}

function isValidPosition(piece, offsetX = 0, offsetY = 0) {
  for (const [cx, cy] of piece.cells) {
    const nx = piece.x + cx + offsetX;
    const ny = piece.y + cy + offsetY;
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false;
    if (board[ny][nx] !== null) return false;
  }
  return true;
}

function rotatePiece(piece, direction) {
  const rotations = SHAPES[piece.shapeName];
  const newRot = (piece.rotation + direction + rotations.length) % rotations.length;
  const newCells = rotations[newRot];

  const testPiece = { ...piece, rotation: newRot, cells: newCells };

  // Build map of absolute position -> letter before rotation
  const posToLetter = {};
  for (let i = 0; i < piece.cells.length; i++) {
    const ax = piece.x + piece.cells[i][0];
    const ay = piece.y + piece.cells[i][1];
    posToLetter[`${ax},${ay}`] = piece.letters[i];
  }

  // Wall kick: try offsets 0, -1, +1, -2, +2
  for (const dx of [0, -1, 1, -2, 2]) {
    testPiece.x = piece.x + dx;
    if (isValidPosition(testPiece)) {
      // Reassign letters: keep letters at same absolute positions
      const newLetters = newCells.map(([cx, cy]) => {
        const key = `${testPiece.x + cx},${piece.y + cy}`;
        return posToLetter[key] || randomLetter();
      });
      piece.rotation = newRot;
      piece.cells = newCells;
      piece.letters = newLetters;
      piece.x = testPiece.x;
      return true;
    }
  }
  return false;
}

function lockPiece(piece) {
  const absCells = getAbsoluteCells(piece);
  for (let i = 0; i < absCells.length; i++) {
    const [x, y] = absCells[i];
    if (y < 0) {
      gameOver = true;
      return;
    }
    board[y][x] = { letter: piece.letters[i], color: piece.color };
  }
}

// --- Word Detection ---
function findWords() {
  const found = [];

  // Horizontal (left to right)
  for (let r = 0; r < ROWS; r++) {
    for (let startC = 0; startC <= COLS - 3; startC++) {
      if (!board[r][startC]) continue;
      let word = '';
      let cells = [];
      for (let c = startC; c < COLS && board[r][c]; c++) {
        word += board[r][c].letter;
        cells.push([c, r]);
        if (word.length >= 3 && DICT.has(word)) {
          found.push({ word, cells: [...cells] });
        }
      }
    }
  }

  // Vertical (top to bottom)
  for (let c = 0; c < COLS; c++) {
    for (let startR = 0; startR <= ROWS - 3; startR++) {
      if (!board[startR][c]) continue;
      let word = '';
      let cells = [];
      for (let r = startR; r < ROWS && board[r][c]; r++) {
        word += board[r][c].letter;
        cells.push([c, r]);
        if (word.length >= 3 && DICT.has(word)) {
          found.push({ word, cells: [...cells] });
        }
      }
    }
  }

  // Deduplicate: prefer longer words, remove subsets
  found.sort((a, b) => b.word.length - a.word.length);
  const used = new Set();
  const result = [];
  for (const f of found) {
    const key = f.cells.map(c => `${c[0]},${c[1]}`);
    const anyUsed = key.some(k => used.has(k));
    if (!anyUsed) {
      result.push(f);
      key.forEach(k => used.add(k));
    }
  }
  return result;
}

function clearWords(words) {
  for (const w of words) {
    for (const [x, y] of w.cells) {
      board[y][x] = null;
    }
  }
}

function applyGravity() {
  for (let c = 0; c < COLS; c++) {
    let writeRow = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][c] !== null) {
        if (r !== writeRow) {
          board[writeRow][c] = board[r][c];
          board[r][c] = null;
        }
        writeRow--;
      }
    }
  }
}

// Process words: find, highlight, then clear after animation
function processBoard() {
  const words = findWords();
  if (words.length === 0) return;

  // Set up highlight animation
  animating = true;
  highlightStartTime = performance.now();
  highlightedCells = [];

  for (const w of words) {
    const pts = wordScore(w.word.length);
    for (const [x, y] of w.cells) {
      highlightedCells.push({ x, y, word: w.word, pts });
    }
    recentWords.unshift({ word: w.word, pts });
    if (recentWords.length > 20) recentWords.pop();
    score += pts;
    wordsCleared++;
  }
  level = Math.floor(wordsCleared / WORDS_PER_LEVEL) + 1;
  updateUI();

  // Store the words to clear after animation
  highlightedCells._wordsToProcess = words;
}

function finishWordAnimation() {
  const words = highlightedCells._wordsToProcess;
  clearWords(words);
  applyGravity();
  highlightedCells = [];
  animating = false;

  // Check for cascading words
  processBoard();
}

// --- Rendering ---
function drawBoard() {
  ctx.clearRect(0, 0, BOARD_W, BOARD_H);

  // Draw grid
  ctx.strokeStyle = '#1a1a3a';
  ctx.lineWidth = 0.5;
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL);
    ctx.lineTo(BOARD_W, r * CELL);
    ctx.stroke();
  }
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL, 0);
    ctx.lineTo(c * CELL, BOARD_H);
    ctx.stroke();
  }

  // Draw locked cells
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) {
        drawCell(ctx, c, r, board[r][c].letter, board[r][c].color);
      }
    }
  }

  // Draw word highlight animation
  if (highlightedCells.length > 0) {
    const elapsed = performance.now() - highlightStartTime;
    const pulse = 0.5 + 0.5 * Math.sin(elapsed / 80); // fast pulse
    const alpha = 0.4 + 0.4 * pulse;

    // Draw glow on highlighted cells
    for (const { x, y } of highlightedCells) {
      const px = x * CELL;
      const py = y * CELL;
      ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
      ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
      ctx.strokeStyle = `rgba(255, 255, 0, ${alpha + 0.2})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, CELL, CELL);
    }

    // Draw score popups per word (centered on word cells)
    const wordsDrawn = new Set();
    for (const { x, y, word, pts } of highlightedCells) {
      if (wordsDrawn.has(word + pts)) continue;
      wordsDrawn.add(word + pts);

      // Find center of this word's cells
      const wordCells = highlightedCells.filter(c => c.word === word && c.pts === pts);
      const cx = wordCells.reduce((s, c) => s + c.x, 0) / wordCells.length;
      const cy = wordCells.reduce((s, c) => s + c.y, 0) / wordCells.length;

      // Float upward over time
      const floatY = -20 * (elapsed / HIGHLIGHT_DURATION);
      const fadeOut = Math.max(0, 1 - elapsed / HIGHLIGHT_DURATION * 0.3);

      ctx.save();
      ctx.globalAlpha = fadeOut;
      ctx.fillStyle = '#e2b714';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+${pts}`, (cx + 0.5) * CELL, (cy + 0.5) * CELL + floatY);
      ctx.restore();
    }
  }

  // Draw ghost piece
  if (currentPiece && !paused) {
    let ghostY = 0;
    while (isValidPosition(currentPiece, 0, ghostY + 1)) ghostY++;
    if (ghostY > 0) {
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < currentPiece.cells.length; i++) {
        const [cx, cy] = currentPiece.cells[i];
        drawCell(ctx, currentPiece.x + cx, currentPiece.y + cy + ghostY, currentPiece.letters[i], currentPiece.color);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Draw current piece
  if (currentPiece && !paused) {
    for (let i = 0; i < currentPiece.cells.length; i++) {
      const [cx, cy] = currentPiece.cells[i];
      drawCell(ctx, currentPiece.x + cx, currentPiece.y + cy, currentPiece.letters[i], currentPiece.color);
    }
  }

  // Draw score overlay on board
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, BOARD_W, 22);
  ctx.fillStyle = '#e2b714';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`Score: ${score.toLocaleString()}`, 4, 4);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#aaa';
  ctx.font = '12px monospace';
  ctx.fillText(`Lv ${level}`, BOARD_W - 4, 5);
  ctx.restore();
}

function drawCell(context, col, row, letter, color) {
  const x = col * CELL;
  const y = row * CELL;

  // Block background
  context.fillStyle = color;
  context.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);

  // Slight 3D effect
  context.fillStyle = 'rgba(255,255,255,0.15)';
  context.fillRect(x + 1, y + 1, CELL - 2, 3);
  context.fillRect(x + 1, y + 1, 3, CELL - 2);

  context.fillStyle = 'rgba(0,0,0,0.2)';
  context.fillRect(x + CELL - 3, y + 1, 2, CELL - 2);
  context.fillRect(x + 1, y + CELL - 3, CELL - 2, 2);

  // Letter
  context.fillStyle = '#fff';
  context.font = 'bold 16px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(letter, x + CELL / 2, y + CELL / 2 + 1);
}

function drawPreview() {
  previewCtx.clearRect(0, 0, 120, 120);
  if (!nextPiece) return;

  const cells = nextPiece.cells;
  const maxX = Math.max(...cells.map(c => c[0]));
  const maxY = Math.max(...cells.map(c => c[1]));
  const cellSize = 25;
  const offsetX = (120 - (maxX + 1) * cellSize) / 2;
  const offsetY = (120 - (maxY + 1) * cellSize) / 2;

  for (let i = 0; i < cells.length; i++) {
    const [cx, cy] = cells[i];
    const x = offsetX + cx * cellSize;
    const y = offsetY + cy * cellSize;

    previewCtx.fillStyle = nextPiece.color;
    previewCtx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

    previewCtx.fillStyle = '#fff';
    previewCtx.font = 'bold 14px monospace';
    previewCtx.textAlign = 'center';
    previewCtx.textBaseline = 'middle';
    previewCtx.fillText(nextPiece.letters[i], x + cellSize / 2, y + cellSize / 2 + 1);
  }
}

function updateUI() {
  scoreDisplay.textContent = score.toLocaleString();
  levelDisplay.textContent = level;
  wordsDisplay.textContent = wordsCleared;

  wordsFoundDiv.innerHTML = '';
  for (const w of recentWords) {
    const div = document.createElement('div');
    div.className = 'word-entry';
    div.innerHTML = `<span class="word">${w.word}</span><span class="pts">+${w.pts}</span>`;
    wordsFoundDiv.appendChild(div);
  }
}

// --- Controls ---
document.addEventListener('keydown', (e) => {
  if (gameOver) return;

  // Pause toggle
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    togglePause();
    return;
  }

  if (paused || animating || !currentPiece) return;

  switch (e.key) {
    case 'ArrowLeft':
    case 'a':
    case 'A':
      e.preventDefault();
      if (isValidPosition(currentPiece, -1, 0)) currentPiece.x--;
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      e.preventDefault();
      if (isValidPosition(currentPiece, 1, 0)) currentPiece.x++;
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      e.preventDefault();
      if (isValidPosition(currentPiece, 0, 1)) {
        currentPiece.y++;
        dropTimer = 0;
      }
      break;
    case 'ArrowUp':
    case 'w':
    case 'W':
      e.preventDefault();
      rotatePiece(currentPiece, 1); // CW
      break;
    case 'z':
    case 'Z':
      e.preventDefault();
      rotatePiece(currentPiece, -1); // CCW
      break;
    case ' ':
      e.preventDefault();
      hardDrop();
      break;
    default:
      // Numpad controls
      handleNumpad(e);
      break;
  }
});

function handleNumpad(e) {
  // e.code is more reliable for numpad keys
  switch (e.code) {
    case 'Numpad4':
      e.preventDefault();
      if (isValidPosition(currentPiece, -1, 0)) currentPiece.x--;
      break;
    case 'Numpad6':
      e.preventDefault();
      if (isValidPosition(currentPiece, 1, 0)) currentPiece.x++;
      break;
    case 'Numpad2':
      e.preventDefault();
      if (isValidPosition(currentPiece, 0, 1)) {
        currentPiece.y++;
        dropTimer = 0;
      }
      break;
    case 'Numpad0':
      e.preventDefault();
      hardDrop();
      break;
    case 'Numpad5':
      e.preventDefault();
      rotatePiece(currentPiece, 1); // CW
      break;
    case 'Numpad8':
      e.preventDefault();
      rotatePiece(currentPiece, -1); // CCW
      break;
  }
}

function hardDrop() {
  while (isValidPosition(currentPiece, 0, 1)) {
    currentPiece.y++;
  }
  lockPiece(currentPiece);
  if (!gameOver) {
    processBoard();
    if (!animating) {
      spawnPiece();
    }
    // If animating, game loop will handle spawning after animation
  }
  dropTimer = 0;
}

function togglePause() {
  paused = !paused;
  if (paused) {
    showOverlay('Paused', 'Press Escape or P to resume', 'Resume');
  } else {
    hideOverlay();
    lastTime = performance.now();
  }
}

// --- Game Flow ---
function spawnPiece() {
  currentPiece = nextPiece || createPiece();
  nextPiece = createPiece();
  drawPreview();

  // Check if spawn position is blocked
  if (!isValidPosition(currentPiece)) {
    gameOver = true;
    showOverlay('Game Over', `Final Score: ${score.toLocaleString()}<br>Words: ${wordsCleared}<br>Level: ${level}`, 'Play Again');
  }
}

function showOverlay(title, message, buttonText) {
  overlayContent.innerHTML = `<h1>${title}</h1><p>${message}</p><button id="overlay-btn">${buttonText}</button>`;
  overlay.classList.remove('hidden');
  document.getElementById('overlay-btn').addEventListener('click', () => {
    if (gameOver) {
      startGame();
    } else {
      togglePause();
    }
  });
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function startGame() {
  initBoard();
  score = 0;
  level = 1;
  wordsCleared = 0;
  gameOver = false;
  paused = false;
  recentWords = [];
  highlightedCells = [];
  animating = false;
  dropTimer = 0;
  currentPiece = null;
  nextPiece = null;
  updateUI();
  hideOverlay();
  spawnPiece();
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  if (gameOver) return;
  if (paused) {
    requestAnimationFrame(gameLoop);
    return;
  }

  const dt = timestamp - lastTime;
  lastTime = timestamp;

  // Handle highlight animation
  if (animating) {
    if (timestamp - highlightStartTime >= HIGHLIGHT_DURATION) {
      finishWordAnimation();
      if (animating) {
        // New cascade animation started
        drawBoard();
        requestAnimationFrame(gameLoop);
        return;
      }
      // Animation done, spawn next piece
      spawnPiece();
      if (gameOver) return;
      dropTimer = 0;
    }
    drawBoard();
    requestAnimationFrame(gameLoop);
    return;
  }

  dropTimer += dt;

  if (dropTimer >= getDropInterval()) {
    dropTimer = 0;
    if (isValidPosition(currentPiece, 0, 1)) {
      currentPiece.y++;
    } else {
      lockPiece(currentPiece);
      if (!gameOver) {
        processBoard();
        if (animating) {
          // Word found, wait for animation
          drawBoard();
          requestAnimationFrame(gameLoop);
          return;
        }
        spawnPiece();
      }
      if (gameOver) return;
    }
  }

  drawBoard();
  requestAnimationFrame(gameLoop);
}

// --- Touch Controls ---
function setupTouchControls() {
  // On-screen button controls
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnDown = document.getElementById('btn-down');
  const btnUp = document.getElementById('btn-up');
  const btnCW = document.getElementById('btn-cw');
  const btnCCW = document.getElementById('btn-ccw');
  const btnDrop = document.getElementById('btn-drop');
  const btnPause = document.getElementById('btn-pause');

  function onTouch(btn, action) {
    if (!btn) return;
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      action();
    });
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      action();
    });
  }

  onTouch(btnLeft, () => {
    if (!gameOver && !paused && currentPiece && isValidPosition(currentPiece, -1, 0)) currentPiece.x--;
  });
  onTouch(btnRight, () => {
    if (!gameOver && !paused && currentPiece && isValidPosition(currentPiece, 1, 0)) currentPiece.x++;
  });
  onTouch(btnDown, () => {
    if (!gameOver && !paused && currentPiece && isValidPosition(currentPiece, 0, 1)) {
      currentPiece.y++;
      dropTimer = 0;
    }
  });
  onTouch(btnUp, () => {
    if (!gameOver && !paused && currentPiece) rotatePiece(currentPiece, 1);
  });
  onTouch(btnCW, () => {
    if (!gameOver && !paused && currentPiece) rotatePiece(currentPiece, 1);
  });
  onTouch(btnCCW, () => {
    if (!gameOver && !paused && currentPiece) rotatePiece(currentPiece, -1);
  });
  onTouch(btnDrop, () => {
    if (!gameOver && !paused && currentPiece) hardDrop();
  });
  onTouch(btnPause, () => {
    if (!gameOver) togglePause();
  });

  // Swipe controls on the canvas
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (gameOver || paused || !currentPiece) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const minSwipe = 30;

    if (absDx < minSwipe && absDy < minSwipe && dt < 300) {
      // Tap = rotate
      rotatePiece(currentPiece, 1);
    } else if (absDy > absDx && dy > minSwipe) {
      // Swipe down
      if (dy > 100 || dt < 200) {
        hardDrop();
      } else {
        if (isValidPosition(currentPiece, 0, 1)) {
          currentPiece.y++;
          dropTimer = 0;
        }
      }
    } else if (absDx > absDy) {
      if (dx < -minSwipe && isValidPosition(currentPiece, -1, 0)) currentPiece.x--;
      if (dx > minSwipe && isValidPosition(currentPiece, 1, 0)) currentPiece.x++;
    }
  }, { passive: false });
}

// --- Init ---
setupTouchControls();

startBtn.addEventListener('click', async () => {
  startBtn.textContent = 'Loading...';
  startBtn.disabled = true;
  await loadDictionary();
  startGame();
});
