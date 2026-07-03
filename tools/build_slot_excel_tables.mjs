import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const dependencyRoot = "C:/Users/ghddj/Documents/MSW";
const require = createRequire(import.meta.url);
const artifactToolPath = require.resolve("@oai/artifact-tool", { paths: [dependencyRoot] });
const { FileBlob, SpreadsheetFile, Workbook } = await import(pathToFileURL(artifactToolPath).href);

const outputDir = "C:/Users/ghddj/Desktop/AI/MSW/ExcelTable";
const screenSprayVfxRuid = "49f7b6c23fc645e798f7ce0458b356bc";

const kr = {
  henesys: "\uD5E4\uB124\uC2DC\uC2A4",
  ellinia: "\uC5D8\uB9AC\uB2C8\uC544",
  perion: "\uD398\uB9AC\uC628",
  kerning: "\uCEE4\uB2DD\uC2DC\uD2F0",
  lith: "\uB9AC\uC2A4\uD56D\uAD6C",
  sleepywood: "\uC2AC\uB9AC\uD53C\uC6B0\uB4DC",
  orbis: "\uC624\uB974\uBE44\uC2A4",
  ludibrium: "\uB8E8\uB514\uBE0C\uB9AC\uC5C4",
  aquarium: "\uC544\uCFE0\uC544\uB9AC\uC6C0",
  leafre: "\uB9AC\uD504\uB808",
  coin: "\uCF54\uC778",
};

const enumNo = {
  SLIME: 1,
  MUSHROOM: 2,
  PIG: 3,
  GOLEM: 4,
  PINK_BEAN: 5,
  WILD: 6,
  TOP_LINE: 1,
  MAIN_LINE: 2,
  BOTTOM_LINE: 3,
  ALL_HORIZONTAL_LINES: 4,
  PREMIUM_COIN: 1,
  COMMON_COIN: 2,
  NORMAL: 1,
  QUICK: 2,
  TENSION: 3,
  REJECT_SPIN: 1,
  BOUNCE: 1,
  POP: 2,
  WOBBLE: 3,
  SHAKE: 4,
  FLASH: 5,
};

const columnDescriptionKo = {
  EnumsIndex: "Enum ?뚯씠釉??됱쓣 ?앸퀎?섎뒗 ?뺤닔 ?몃뜳?ㅼ엯?덈떎.",
  EnumTypeName: "?꾪룷??寃利앹뿉 ?ъ슜??Enum 洹몃９紐낆엯?덈떎.",
  EnumNo: "?대떦 Enum 洹몃９ ?덉뿉???ъ슜?섎뒗 ?뺤닔 媛믪엯?덈떎.",
  EnumId: "湲고쉷?먯? 肄붾뱶媛 ?④퍡 ?쎈뒗 Enum ?앸퀎 臾몄옄?댁엯?덈떎.",

  BaseBetRegionsIndex: "BaseBetRegions ?뚯씠釉??됱쓣 ?앸퀎?섎뒗 ?뺤닔 ?몃뜳?ㅼ엯?덈떎.",
  RegionName: "Base Bet 紐⑸줉???몄쭛????李멸퀬?섎뒗 吏???대쫫?낅땲??",
  BetCoins: "Multiplier ?곸슜 ???щ’ 1?뚯뿉 ?ъ엯?섎뒗 肄붿씤 ?섏엯?덈떎.",
  DisplayLabel: "Base Bet ?쒕∼?ㅼ슫 紐⑸줉???쒖떆?섎뒗 臾멸뎄?낅땲??",
  InitialUnlocked: "?대떦 Base Bet ??ぉ??泥섏쓬遺???좏깮 媛?ν븳吏 ?щ??낅땲??",
  LockSeconds: "Base Bet 吏???좏깮 ???곸슜???좉툑 ?쒓컙?낅땲??",
  Notes: "?고??꾩뿉???ъ슜?섏? ?딅뒗 湲고쉷 李멸퀬 硫붾え?낅땲??",

  SlotSymbolsIndex: "SlotSymbols ?뚯씠釉??됱쓣 ?앸퀎?섎뒗 ?뺤닔 ?몃뜳?ㅼ엯?덈떎.",
  SymbolEnumNo: "Enums ?뚯씠釉붿쓽 SlotSymbol ???EnumNo瑜?李몄“?⑸땲??",
  DisplayName: "?щ낵 UI ?먮뒗 ?붾쾭洹??쒖떆???ъ슜???대쫫?낅땲??",
  RuntimeLabel: "?꾨줈?좏???由?????쒖떆??吏㏃? ?щ낵 ?쇰꺼?낅땲??",
  Rank: "??? 蹂댁긽遺???믪? 蹂댁긽源뚯? ?뺣젹?섍린 ?꾪븳 湲고쉷 ?쒖꽌?낅땲??",
  ThemeRole: "異뷀썑 硫붿씠?뚯뒪?좊━ 由ъ냼?ㅻ? 留ㅼ묶????李멸퀬????븷?낅땲??",
  IntendedRarity: "理쒖쥌 由??뺣쪧 議곗젙 ??李멸퀬?섎뒗 湲고쉷 ?ш??꾩엯?덈떎.",
  SymbolEnumId: "Enums ?뚯씠釉붿쓽 SlotSymbol ???EnumId瑜?李몄“?⑸땲??",

  PaytableIndex: "Paytable ?뚯씠釉??됱쓣 ?앸퀎?섎뒗 ?뺤닔 ?몃뜳?ㅼ엯?덈떎.",
  MatchCount: "硫붿씤 ?쇱씤?먯꽌 媛숈? ?щ낵???곗냽?쇰줈 留욎븘???섎뒗 媛쒖닔?낅땲??",
  PayoutTenths: "?뚯닔 怨꾩궛???쇳븯湲??꾪빐 蹂댁긽 諛곗쑉??10諛??뺤닔濡???ν빀?덈떎.",
  PayoutMultiplierX: "湲고쉷?먭? ?쎄린 ?ъ슫 蹂댁긽 諛곗쑉 ?쒖떆媛믪엯?덈떎.",
  LineTypeEnumId: "Enums ?뚯씠釉붿쓽 LineType ???EnumId瑜?李몄“?⑸땲??",
  LineTypeEnumNo: "Enums ?뚯씠釉붿쓽 LineType ???EnumNo瑜?李몄“?⑸땲??",

  MultipliersIndex: "Multipliers ?뚯씠釉??됱쓣 ?앸퀎?섎뒗 ?뺤닔 ?몃뜳?ㅼ엯?덈떎.",
  MultiplierValue: "Spin 鍮꾩슜怨?蹂댁긽?됱뿉 怨깊빐吏??諛곗쑉 媛믪엯?덈떎.",
  CanChangeDuringSpin: "由??뚯쟾 以?Multiplier 蹂寃쎌쓣 ?덉슜?좎? ?щ??낅땲??",

  SlotRows: "?붾㈃???쒖떆?섎뒗 ?щ’ ??媛쒖닔?낅땲??",
  ReelCount: "?붾㈃???쒖떆?섎뒗 由???媛쒖닔?낅땲??",
  OutcomeDecidedOnSpinStart: "Spin ?쒖옉 ?쒖젏??寃곌낵瑜?癒쇱? ?뺤젙?좎? ?щ??낅땲??",
  InitialPremiumCoin: "?뚮젅???뚯뒪???쒖옉 ??吏湲됲븷 Premium Coin ?섎웾?낅땲??",
  InitialCommonCoin: "?뚮젅???뚯뒪???쒖옉 ??吏湲됲븷 Common Coin ?섎웾?낅땲??",
  InternalCoinUnit: "?쒖떆 肄붿씤 1媛쒕? ?대? 怨꾩궛 ?⑥쐞 紐?媛쒕줈 蹂쇱? ?뺥빀?덈떎.",
  ConsumePremiumFirst: "鍮꾩슜 李④컧 ??Premium Coin??癒쇱? ?뚮え?좎? ?щ??낅땲??",
  PayoutCurrencyEnumId: "Enums ?뚯씠釉붿쓽 CurrencyType ???EnumId瑜?李몄“?⑸땲??",
  PayoutCurrencyEnumNo: "Enums ?뚯씠釉붿쓽 CurrencyType ???EnumNo瑜?李몄“?⑸땲??",
  InsufficientBalanceActionEnumId: "?붿븸 遺議????섑뻾???숈옉 EnumId瑜?李몄“?⑸땲??",
  InsufficientBalanceActionEnumNo: "?붿븸 遺議????섑뻾???숈옉 EnumNo瑜?李몄“?⑸땲??",

  SpinProfilesIndex: "SpinProfiles ?뚯씠釉??됱쓣 ?앸퀎?섎뒗 ?뺤닔 ?몃뜳?ㅼ엯?덈떎.",
  SpinProfileEnumId: "Enums ?뚯씠釉붿쓽 SpinProfileType ???EnumId瑜?李몄“?⑸땲??",
  SpinProfileEnumNo: "Enums ?뚯씠釉붿쓽 SpinProfileType ???EnumNo瑜?李몄“?⑸땲??",
  WeightPercent: "?대떦 Spin ?곗텧 由щ벉???좏깮??媛以??뺣쪧?낅땲??",
  OverallFeel: "湲고쉷?먭? ?곗텧 由щ벉???댄빐?섍린 ?꾪븳 吏㏃? ?ㅻ챸?낅땲??",
  FirstReelMinSec: "泥?踰덉㎏ 由댁씠 硫덉텛湲곌퉴吏 嫄몃━??理쒖냼 ?쒓컙?낅땲??",
  FirstReelMaxSec: "泥?踰덉㎏ 由댁씠 硫덉텛湲곌퉴吏 嫄몃━??理쒕? ?쒓컙?낅땲??",
  StaggerMinSec: "?ㅼ쓬 由??뺤?源뚯? 異붽??섎뒗 理쒖냼 吏???쒓컙?낅땲??",
  StaggerMaxSec: "?ㅼ쓬 由??뺤?源뚯? 異붽??섎뒗 理쒕? 吏???쒓컙?낅땲??",
  MinCellsPerSecond: "由??대룞 ?띾룄媛 ??媛믩낫???먮━硫?異붽? 猷⑦봽瑜?遺숈엯?덈떎.",
  MaxCellsPerSecond: "由??대룞 ?띾룄媛 ??媛믩낫??鍮좊Ⅴ硫?猷⑦봽瑜?以꾩씠嫄곕굹 ?쒓컙???섎┰?덈떎.",
  ExtraLoopMin: "由댁씠 硫덉텛湲???理쒖냼濡??뚯븘???섎뒗 ?꾩껜 猷⑦봽 ?섏엯?덈떎.",
  ExtraLoopRandomMin: "異붽? ?쒕뜡 猷⑦봽 ?섏쓽 理쒖냼媛믪엯?덈떎.",
  ExtraLoopRandomMax: "異붽? ?쒕뜡 猷⑦봽 ?섏쓽 理쒕?媛믪엯?덈떎.",
  AccelerateSecondsMin: "珥덇린 媛??援ш컙??理쒖냼 吏???쒓컙?낅땲??",
  AccelerateSecondsMax: "珥덇린 媛??援ш컙??理쒕? 吏???쒓컙?낅땲??",
  DecelerateSecondsMin: "理쒖쥌 媛먯냽 援ш컙??理쒖냼 吏???쒓컙?낅땲??",
  DecelerateSecondsMax: "理쒖쥌 媛먯냽 援ш컙??理쒕? 吏???쒓컙?낅땲??",
  SettleBounceSecondsMin: "理쒖쥌 ?ㅻ깄 ?먮뒗 諛붿슫???곗텧??理쒖냼 ?쒓컙?낅땲??",
  SettleBounceSecondsMax: "理쒖쥌 ?ㅻ깄 ?먮뒗 諛붿슫???곗텧??理쒕? ?쒓컙?낅땲??",

  ReelStripsIndex: "ReelStrips ?뚯씠釉??됱쓣 ?앸퀎?섎뒗 ?뺤닔 ?몃뜳?ㅼ엯?덈떎.",
  ReelNo: "?쇱そ遺??紐?踰덉㎏ 由댁씤吏 ?섑??대뒗 踰덊샇?낅땲??",
  StopIndex: "諛섎났?섎뒗 由??ㅽ듃由??덉뿉?쒖쓽 ?뺤? ?꾩튂?낅땲??",

  UIBindingsIndex: "UIBindings ?뚯씠釉??됱쓣 ?앸퀎?섎뒗 ?뺤닔 ?몃뜳?ㅼ엯?덈떎.",
  BindingKey: "UI 肄붾뱶 ?먮뒗 ?섎룞 留ㅽ븨?먯꽌 ?ъ슜??怨좎젙 ?ㅼ엯?덈떎.",
  UINode: "Maker UI 怨꾩링?먯꽌 湲곕??섎뒗 UI ?몃뱶 ?대쫫?낅땲??",
  Purpose: "?대떦 UI 諛붿씤?⑹씠 ?꾩슂???댁쑀?낅땲??",
  CurrentStatus: "?꾨줈?좏???湲곗? ?꾩옱 援ы쁽 ?곹깭?낅땲??",
  TemplateKey: "肄붾뱶? ?곗씠?곗뿉??李몄“?섎뒗 臾몄옄???쒗뵆由??ㅼ엯?덈떎.",
  ExampleArguments: "湲고쉷?먭? ?쒗뵆由??숈옉???뺤씤?섍린 ?꾪븳 ?덉떆 ?몄옄?낅땲??",
  PreviewText: "?덉떆 ?몄옄瑜??곸슜?덉쓣 ??湲곕??섎뒗 ?쒖떆 臾멸뎄?낅땲??",
};

const slotSymbolTable = {
  SLIME: {
    displayName: "Slime",
    runtimeLabel: "SLIME",
    rank: 1,
    themeRole: "Common monster icon",
    intendedRarity: "Very common",
    resourceRuid: "a8f43ecd71084c14aab092cf23406235",
    winAnimation: "BOUNCE",
  },
  MUSHROOM: {
    displayName: "Mushroom",
    runtimeLabel: "MUSH",
    rank: 2,
    themeRole: "Early RPG monster icon",
    intendedRarity: "Common",
    resourceRuid: "c61cc1debb2a4f27b19b46bc32f34426",
    winAnimation: "POP",
  },
  PIG: {
    displayName: "Ribbon Pig",
    runtimeLabel: "PIG",
    rank: 3,
    themeRole: "Mid-tier monster icon",
    intendedRarity: "Uncommon",
    resourceRuid: "ed6b1a230f7d4e079f5db8dfa50f5468",
    winAnimation: "WOBBLE",
  },
  GOLEM: {
    displayName: "Stone Golem",
    runtimeLabel: "GOLEM",
    rank: 4,
    themeRole: "Heavy monster icon",
    intendedRarity: "Rare",
    resourceRuid: "af728bc3f10641efb84f31edcd3506a7",
    winAnimation: "SHAKE",
  },
  PINK_BEAN: {
    displayName: "Pink Bean",
    runtimeLabel: "PINK",
    rank: 5,
    themeRole: "Jackpot boss monster icon",
    intendedRarity: "Very rare",
    resourceRuid: "00b055cd1b1141f9bee48a4e9ce0534c",
    winAnimation: "FLASH",
  },
  WILD: {
    displayName: "Wild",
    runtimeLabel: "WILD",
    rank: 6,
    themeRole: "Substitute symbol",
    intendedRarity: "Special",
    resourceRuid: "f07924c49aef4ec784bf78fedb5db171",
    winAnimation: "FLASH",
  },
};

const baseBetRegionTable = [
  [1, kr.henesys, 1],
  [2, kr.ellinia, 2],
  [3, kr.perion, 3],
  [4, kr.kerning, 4],
  [5, kr.lith, 5],
  [6, kr.sleepywood, 6],
  [7, kr.orbis, 7],
  [8, kr.ludibrium, 8],
  [9, kr.aquarium, 9],
  [10, kr.leafre, 10],
];

const gs = {
  SLIME: 1,
  MUSHROOM: 2,
  PIG: 3,
  GOLEM: 4,
  PINK_BEAN: 5,
  WILD: 6,
  TOP_LINE: 11,
  MAIN_LINE: 12,
  BOTTOM_LINE: 13,
  ALL_HORIZONTAL_LINES: 14,
  PREMIUM_COIN: 21,
  COMMON_COIN: 22,
  NORMAL: 31,
  QUICK: 32,
  TENSION: 33,
  REJECT_SPIN: 41,
  BOUNCE: 51,
  POP: 52,
  WOBBLE: 53,
  SHAKE: 54,
  FLASH: 55,
  HENESYS: 101,
  ELLINIA: 102,
  PERION: 103,
  KERNING: 104,
  LITH: 105,
  SLEEPYWOOD: 106,
  ORBIS: 107,
  LUDIBRIUM: 108,
  AQUARIUM: 109,
  LEAFRE: 110,
  BASE_BET_LABEL: 201,
  PREMIUM_AMOUNT: 202,
  COMMON_AMOUNT: 203,
  WIN_STATUS: 204,
  NOT_ENOUGH_COINS: 205,
  MULTIPLIER_LABEL: 206,
  BASE_BET_CONFIRM_LOCK: 207,
  WIN_LINE_FORMULA: 208,
  WIN_TOTAL_FORMULA: 209,
};

const gameStringRows = [
  [gs.SLIME, "\uC2AC\uB77C\uC784"],
  [gs.MUSHROOM, "\uBC84\uC12F"],
  [gs.PIG, "\uB3FC\uC9C0"],
  [gs.GOLEM, "\uACE8\uB818"],
  [gs.PINK_BEAN, "\uD551\uD06C\uBE48"],
  [gs.WILD, "\uC640\uC77C\uB4DC"],
  [gs.TOP_LINE, "\uC0C1\uB2E8 \uB77C\uC778"],
  [gs.MAIN_LINE, "\uC911\uC559 \uB77C\uC778"],
  [gs.BOTTOM_LINE, "\uD558\uB2E8 \uB77C\uC778"],
  [gs.ALL_HORIZONTAL_LINES, "\uC804\uCCB4 \uAC00\uB85C \uB77C\uC778"],
  [gs.PREMIUM_COIN, "\uD504\uB9AC\uBBF8\uC5C4 \uCF54\uC778"],
  [gs.COMMON_COIN, "\uC77C\uBC18 \uCF54\uC778"],
  [gs.NORMAL, "\uC77C\uBC18"],
  [gs.QUICK, "\uBE60\uB984"],
  [gs.TENSION, "\uAE34\uC7A5\uAC10"],
  [gs.REJECT_SPIN, "\uC2A4\uD540 \uAC70\uBD80"],
  [gs.BOUNCE, "\uD280"],
  [gs.POP, "\uD31D"],
  [gs.WOBBLE, "\uD754\uB4E4\uB9BC"],
  [gs.SHAKE, "\uC9C4\uB3D9"],
  [gs.FLASH, "\uC810\uBA78"],
  [gs.HENESYS, kr.henesys],
  [gs.ELLINIA, kr.ellinia],
  [gs.PERION, kr.perion],
  [gs.KERNING, kr.kerning],
  [gs.LITH, kr.lith],
  [gs.SLEEPYWOOD, kr.sleepywood],
  [gs.ORBIS, kr.orbis],
  [gs.LUDIBRIUM, kr.ludibrium],
  [gs.AQUARIUM, kr.aquarium],
  [gs.LEAFRE, kr.leafre],
  [gs.BASE_BET_LABEL, "{0} - {1}\uCF54\uC778"],
  [gs.PREMIUM_AMOUNT, "\uD504\uB9AC\uBBF8\uC5C4 {0}"],
  [gs.COMMON_AMOUNT, "\uC77C\uBC18 {0}"],
  [gs.WIN_STATUS, "\uB2F9\uCCA8 {0}\uB77C\uC778 +{1}"],
  [gs.NOT_ENOUGH_COINS, "\uCF54\uC778\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4"],
  [gs.MULTIPLIER_LABEL, "x{0}"],
  [gs.BASE_BET_CONFIRM_LOCK, "Base Bet \uBCC0\uACBD? {0} \uB3D9\uC548 \uC7A0\uAE08\uB429\uB2C8\uB2E4."],
  [gs.WIN_LINE_FORMULA, "x {0}"],
  [gs.WIN_TOTAL_FORMULA, " = {0}"],
];
const gameStringIndexByRegionIndex = new Map([
  [1, gs.HENESYS],
  [2, gs.ELLINIA],
  [3, gs.PERION],
  [4, gs.KERNING],
  [5, gs.LITH],
  [6, gs.SLEEPYWOOD],
  [7, gs.ORBIS],
  [8, gs.LUDIBRIUM],
  [9, gs.AQUARIUM],
  [10, gs.LEAFRE],
]);

const enumKoById = {
  SLIME: "\uC2AC\uB77C\uC784",
  MUSHROOM: "\uBC84\uC12F",
  PIG: "\uB3FC\uC9C0",
  GOLEM: "\uACE8\uB818",
  PINK_BEAN: "\uD551\uD06C\uBE48",
  WILD: "\uC640\uC77C\uB4DC",
  TOP_LINE: "\uC0C1\uB2E8 \uB77C\uC778",
  MAIN_LINE: "\uC911\uC559 \uB77C\uC778",
  BOTTOM_LINE: "\uD558\uB2E8 \uB77C\uC778",
  ALL_HORIZONTAL_LINES: "\uC804\uCCB4 \uAC00\uB85C \uB77C\uC778",
  PREMIUM_COIN: "\uD504\uB9AC\uBBF8\uC5C4 \uCF54\uC778",
  COMMON_COIN: "\uC77C\uBC18 \uCF54\uC778",
  NORMAL: "\uC77C\uBC18",
  QUICK: "\uBE60\uB984",
  TENSION: "\uAE34\uC7A5\uAC10",
  REJECT_SPIN: "\uC2A4\uD540 \uAC70\uBD80",
  BOUNCE: "\uD280",
  POP: "\uD31D",
  WOBBLE: "\uD754\uB4E4\uB9BC",
  SHAKE: "\uC9C4\uB3D9",
  FLASH: "\uC810\uBA78",
};
const enumStringIndexById = {
  SLIME: gs.SLIME,
  MUSHROOM: gs.MUSHROOM,
  PIG: gs.PIG,
  GOLEM: gs.GOLEM,
  PINK_BEAN: gs.PINK_BEAN,
  WILD: gs.WILD,
  TOP_LINE: gs.TOP_LINE,
  MAIN_LINE: gs.MAIN_LINE,
  BOTTOM_LINE: gs.BOTTOM_LINE,
  ALL_HORIZONTAL_LINES: gs.ALL_HORIZONTAL_LINES,
  PREMIUM_COIN: gs.PREMIUM_COIN,
  COMMON_COIN: gs.COMMON_COIN,
  NORMAL: gs.NORMAL,
  QUICK: gs.QUICK,
  TENSION: gs.TENSION,
  REJECT_SPIN: gs.REJECT_SPIN,
  BOUNCE: gs.BOUNCE,
  POP: gs.POP,
  WOBBLE: gs.WOBBLE,
  SHAKE: gs.SHAKE,
  FLASH: gs.FLASH,
};

const enumIdByKo = Object.fromEntries(Object.entries(enumKoById).map(([id, ko]) => [ko, id]));

function enumRef(enumId) {
  return enumKoById[enumId] ?? enumId;
}

function normalizeEnumRef(value) {
  return enumIdByKo[value] ?? value;
}

function getColumnDescriptionKo(column) {
  const overrides = {
    Index: "GameString 테이블 행을 식별하는 정수 인덱스입니다.",
    "String<ko>": "런타임과 UI에서 인덱스로 조회해 출력할 한글 문자열입니다.",
    EnumString: "이 Enum을 문자열로 출력할 때 참조하는 GameString Index입니다.",
    EnumKo: "기획자가 읽고 다른 ref:Enums 컬럼에서 입력할 한글 Enum 참조값입니다.",
    RegionNameStringIndex: "Base Bet 지역명을 출력할 때 참조하는 GameString Index입니다.",
    DisplayTemplateStringIndex: "표시 문구 포맷 스트링을 조회할 GameString Index입니다.",
    DisplayNameStringIndex: "심볼 표시명을 출력할 때 참조하는 GameString Index입니다.",
    RuntimeLabelStringIndex: "프로토타입 또는 디버그 라벨을 출력할 때 참조하는 GameString Index입니다.",
    MatchCount: "?쒖꽦?붾맂 媛濡??섏씠?쇱씤?먯꽌 媛숈? ?щ낵???곗냽?쇰줈 留욎븘???섎뒗 媛쒖닔?낅땲??",
    PaylinesIndex: "Paylines ?뚯씠釉??됱쓣 ?앸퀎?섎뒗 ?뺤닔 ?몃뜳?ㅼ엯?덈떎.",
    StartRow: "?섏씠?쇱씤 ?먯젙???쒖옉?섎뒗 ??踰덊샇?낅땲??",
    StartColumn: "?섏씠?쇱씤 ?먯젙???쒖옉?섎뒗 ??踰덊샇?낅땲??",
    RowPattern: "1~5?댁뿉??李⑤??濡??쎌쓣 ??踰덊샇 紐⑸줉?낅땲??",
    IsEnabled: "?꾩옱 ?щ’ ?먯젙?먯꽌 ???섏씠?쇱씤???ъ슜?섎뒗吏 ?щ??낅땲??",
    CostCountsAsLine: "Spin 鍮꾩슜 怨꾩궛 ???쒖꽦 ?섏씠?쇱씤 ?섏뿉 ?ы븿?좎? ?щ??낅땲??",
    EnabledLineTypeEnumIds: "?꾩옱 ?쒖꽦?붾맂 ?섏씠?쇱씤 EnumId 紐⑸줉?낅땲??",
    SpinCostIncludesActivePaylineCount: "Spin 鍮꾩슜???쒖꽦 ?섏씠?쇱씤 ?섎? 怨깊븷吏 ?щ??낅땲??",
    SymbolResourceRuid: "?щ낵 ?ㅽ봽?쇱씠???먮뒗 ?좊땲硫붿씠?섑겢由쎌쓣 ?곌껐??MSW 由ъ냼??RUID?낅땲??",
    WinAnimationEnumId: "?뱀꺼 ???대떦 ?щ낵???ㅽ뻾???좊땲硫붿씠???곗텧 EnumId?낅땲??",
  };
  const cleanDescriptions = {
    EnumsIndex: "Enums 테이블 행을 식별하는 정수 인덱스입니다.",
    EnumTypeName: "Enum 그룹 이름입니다.",
    EnumNo: "해당 Enum 그룹 안에서 사용하는 정수 번호입니다.",
    EnumId: "코드에서 사용하는 영문 Enum 식별자입니다.",
    EnumString: "Enum을 문자열로 출력할 때 참조하는 GameString Index입니다.",
    EnumKo: "기획자가 입력하고 ref:Enums 컬럼에서 참조하는 한글 Enum 값입니다.",
    Index: "GameString 테이블 행을 식별하는 정수 인덱스입니다.",
    "String<ko>": "런타임과 UI에서 인덱스로 조회해 출력할 한글 문자열입니다.",
    BaseBetRegionsIndex: "BaseBetRegions 테이블 행을 식별하는 정수 인덱스입니다.",
    RegionNameStringIndex: "Base Bet 지역명 출력을 위해 참조하는 GameString Index입니다.",
    BetCoins: "Multiplier 적용 전 슬롯 1회에 투입되는 코인 수입니다.",
    DisplayTemplateStringIndex: "표시 문구 포맷 스트링을 조회할 GameString Index입니다.",
    InitialUnlocked: "처음부터 선택 가능한 Base Bet인지 여부입니다.",
    LockSeconds: "Base Bet 선택 후 적용되는 잠금 시간입니다.",
    Notes: "개발 로직에서는 사용하지 않는 기획 참고 메모입니다.",
    SlotSymbolsIndex: "SlotSymbols 테이블 행을 식별하는 정수 인덱스입니다.",
    SymbolEnumId: "Enums 테이블의 SlotSymbol 타입 EnumKo 값을 참조합니다.",
    DisplayNameStringIndex: "심볼 표시명을 출력할 때 참조하는 GameString Index입니다.",
    RuntimeLabelStringIndex: "프로토타입 또는 디버그 라벨을 출력할 때 참조하는 GameString Index입니다.",
    SymbolResourceRuid: "일반 상태에서 표시할 기본 스프라이트 또는 애니메이션클립 RUID입니다.",
    WinAnimationRuid: "당첨 시 재생할 스프라이트 애니메이션클립 RUID입니다.",
    WinAnimationEnumId: "Enums 테이블의 SymbolWinAnimation 타입 EnumKo 값을 참조합니다.",
    Rank: "낮은 보상부터 높은 보상까지 정렬하기 위한 기획 순서입니다.",
    ThemeRole: "리소스 매칭 시 참고하는 심볼 역할 설명입니다.",
    IntendedRarity: "최종 릴 확률 조정 전 참고하는 기획 희귀도입니다.",
    PaytableIndex: "Paytable 테이블 행을 식별하는 정수 인덱스입니다.",
    MatchCount: "활성 가로 페이라인에서 왼쪽부터 연속으로 맞아야 하는 심볼 수입니다.",
    PayoutTenths: "소수 보상을 정수로 계산하기 위해 10배 단위로 저장한 보상 배율입니다.",
    PayoutMultiplierX: "기획자가 읽기 쉬운 보상 배율 표시값입니다.",
    LineTypeEnumId: "Enums 테이블의 LineType 타입 EnumKo 값을 참조합니다.",
    PaylinesIndex: "Paylines 테이블 행을 식별하는 정수 인덱스입니다.",
    StartRow: "페이라인 시작 행 번호입니다.",
    StartColumn: "페이라인 시작 열 번호입니다.",
    RowPattern: "1~5열에서 참조할 행 번호 목록입니다.",
    IsEnabled: "현재 설정에서 이 페이라인을 사용하는지 여부입니다.",
    CostCountsAsLine: "Spin 비용 계산에 이 라인을 추가 비용으로 포함할지 여부입니다.",
    MultipliersIndex: "Multipliers 테이블 행을 식별하는 정수 인덱스입니다.",
    MultiplierValue: "Spin 비용과 보상에 곱해지는 배율 값입니다.",
    CanChangeDuringSpin: "릴 회전 중 Multiplier 변경을 허용할지 여부입니다.",
    SlotRows: "화면에 표시되는 슬롯 행 개수입니다.",
    ReelCount: "화면에 표시되는 릴 열 개수입니다.",
    EnabledLineTypeEnumIds: "현재 활성화된 LineType EnumKo 목록입니다.",
    SpinCostIncludesActivePaylineCount: "Spin 비용에 활성 페이라인 수를 곱할지 여부입니다.",
    OutcomeDecidedOnSpinStart: "Spin 시작 시점에 결과를 먼저 확정할지 여부입니다.",
    InitialPremiumCoin: "플레이 테스트 시작 시 지급할 Premium Coin 수량입니다.",
    InitialCommonCoin: "플레이 테스트 시작 시 지급할 Common Coin 수량입니다.",
    InternalCoinUnit: "표시 코인 1개를 내부 계산 단위 몇 개로 볼지 정합니다.",
    ConsumePremiumFirst: "비용 차감 시 Premium Coin을 먼저 소모할지 여부입니다.",
    PayoutCurrencyEnumId: "Enums 테이블의 CurrencyType 타입 EnumKo 값을 참조합니다.",
    InsufficientBalanceActionEnumId: "잔액 부족 시 실행할 동작의 EnumKo 값을 참조합니다.",
    SpinProfilesIndex: "SpinProfiles 테이블 행을 식별하는 정수 인덱스입니다.",
    SpinProfileEnumId: "Enums 테이블의 SpinProfileType 타입 EnumKo 값을 참조합니다.",
    WeightPercent: "해당 Spin 연출 리듬이 선택될 가중 확률입니다.",
    OverallFeel: "기획자가 연출 리듬을 이해하기 위한 설명입니다.",
    FirstReelMinSec: "첫 번째 릴이 멈추기까지 걸리는 최소 시간입니다.",
    FirstReelMaxSec: "첫 번째 릴이 멈추기까지 걸리는 최대 시간입니다.",
    StaggerMinSec: "다음 릴 정지까지 추가되는 최소 지연 시간입니다.",
    StaggerMaxSec: "다음 릴 정지까지 추가되는 최대 지연 시간입니다.",
    MinCellsPerSecond: "릴 이동 속도의 최소 셀/초 값입니다.",
    MaxCellsPerSecond: "릴 이동 속도의 최대 셀/초 값입니다.",
    ExtraLoopMin: "릴이 멈추기 전 최소로 돌아야 하는 전체 루프 수입니다.",
    ExtraLoopRandomMin: "추가 랜덤 루프 수의 최소값입니다.",
    ExtraLoopRandomMax: "추가 랜덤 루프 수의 최대값입니다.",
    AccelerateSecondsMin: "초기 가속 구간의 최소 시간입니다.",
    AccelerateSecondsMax: "초기 가속 구간의 최대 시간입니다.",
    DecelerateSecondsMin: "최종 감속 구간의 최소 시간입니다.",
    DecelerateSecondsMax: "최종 감속 구간의 최대 시간입니다.",
    SettleBounceSecondsMin: "최종 스냅 또는 바운스 연출의 최소 시간입니다.",
    SettleBounceSecondsMax: "최종 스냅 또는 바운스 연출의 최대 시간입니다.",
    ReelStripsIndex: "ReelStrips 테이블 행을 식별하는 정수 인덱스입니다.",
    BaseBetRegionIndex: "BaseBetRegionsIndex를 참조하며 BaseBet 지역별 릴 데이터를 구분합니다.",
    RegionName: "필터링을 쉽게 하기 위한 기획 참고용 지역명입니다.",
    ReelNo: "왼쪽부터 몇 번째 릴인지 나타내는 번호입니다.",
    StopIndex: "반복되는 릴 스트립 안에서의 정지 위치입니다.",
    IdleSpriteRuid: "일반 상태에서 이 릴 셀에 표시할 MSW 리소스 RUID입니다.",
    UIBindingsIndex: "UIBindings 테이블 행을 식별하는 정수 인덱스입니다.",
    BindingKey: "UI 코드 또는 수동 매핑에서 사용하는 고정 키입니다.",
    UINode: "Maker UI 계층에서 기대하는 UI 노드 이름입니다.",
    Purpose: "해당 UI 바인딩이 필요한 이유입니다.",
    CurrentStatus: "프로토타입 기준 현재 구현 상태입니다.",
  };
  return cleanDescriptions[column.name] ?? overrides[column.name] ?? columnDescriptionKo[column.name] ?? column.desc;
}

function styledRange(sheet, row, column, rowCount, columnCount, format) {
  sheet.getRangeByIndexes(row, column, rowCount, columnCount).format = {
    ...format,
    font: {
      name: "\uB9D1\uC740 \uACE0\uB515",
      ...(format.font ?? {}),
    },
  };
}

function setColumnWidths(sheet, totalRows, widths) {
  widths.forEach((width, column) => {
    sheet.getRangeByIndexes(0, column, totalRows, 1).format.columnWidthPx = width;
  });
}

function addDataSheet(workbook, name, columns, rows, widths = []) {
  if (columns[0]?.name !== `${name}Index`) {
    throw new Error(`${name} first column must be ${name}Index`);
  }
  if (columns[0]?.type !== "int") {
    throw new Error(`${name} first column must be int`);
  }

  const sheet = workbook.worksheets.add(name);
  sheet.showGridLines = false;
  const values = [
    columns.map((column) => column.name),
    columns.map((column) => column.scope),
    columns.map((column) => getColumnDescriptionKo(column)),
    columns.map((column) => column.type),
    ...rows,
  ];
  const range = sheet.getRangeByIndexes(0, 0, values.length, columns.length);
  range.values = values;
  range.format.font = { name: "\uB9D1\uC740 \uACE0\uB515" };
  sheet.freezePanes.freezeRows(4);
  styledRange(sheet, 0, 0, 1, columns.length, {
    fill: "#111827",
    font: { bold: true, color: "#FFFFFF" },
  });
  styledRange(sheet, 1, 0, 1, columns.length, {
    fill: "#374151",
    font: { bold: true, color: "#E5E7EB" },
  });
  styledRange(sheet, 2, 0, 1, columns.length, {
    fill: "#E5E7EB",
    font: { color: "#111827", size: 8 },
  });
  styledRange(sheet, 3, 0, 1, columns.length, {
    fill: "#FEF3C7",
    font: { bold: true, color: "#92400E" },
  });
  range.format.borders = { preset: "all", style: "thin", color: "#D1D5DB" };
  setColumnWidths(sheet, values.length, widths.length ? widths : columns.map(() => 150));
  return sheet;
}

function addConfigSheet(workbook, name, columns, values, widths = []) {
  const sheet = workbook.worksheets.add(name);
  sheet.showGridLines = false;
  const grid = [
    columns.map((column) => column.name),
    columns.map((column) => column.scope),
    columns.map((column) => getColumnDescriptionKo(column)),
    columns.map((column) => column.type),
    values,
  ];
  const range = sheet.getRangeByIndexes(0, 0, grid.length, columns.length);
  range.values = grid;
  range.format.font = { name: "\uB9D1\uC740 \uACE0\uB515" };
  sheet.freezePanes.freezeRows(4);
  styledRange(sheet, 0, 0, 1, columns.length, {
    fill: "#111827",
    font: { bold: true, color: "#FFFFFF" },
  });
  styledRange(sheet, 1, 0, 1, columns.length, {
    fill: "#374151",
    font: { bold: true, color: "#E5E7EB" },
  });
  styledRange(sheet, 2, 0, 1, columns.length, {
    fill: "#E5E7EB",
    font: { color: "#111827", size: 8 },
  });
  styledRange(sheet, 3, 0, 1, columns.length, {
    fill: "#FEF3C7",
    font: { bold: true, color: "#92400E" },
  });
  range.format.borders = { preset: "all", style: "thin", color: "#D1D5DB" };
  setColumnWidths(sheet, grid.length, widths.length ? widths : columns.map(() => 150));
  return sheet;
}

function addGameStringSheet(workbook) {
  const sheet = workbook.worksheets.add("GameString");
  sheet.showGridLines = false;
  const columns = [
    { name: "Index", scope: "all", desc: "Unique row index for game string lookup.", type: "int" },
    { name: "String<ko>", scope: "client", desc: "Korean localized string looked up by Index.", type: "string" },
  ];
  const values = [
    columns.map((column) => column.name),
    columns.map((column) => column.scope),
    columns.map((column) => getColumnDescriptionKo(column)),
    columns.map((column) => column.type),
    ...gameStringRows,
  ];
  const range = sheet.getRangeByIndexes(0, 0, values.length, columns.length);
  range.values = values;
  range.format.font = { name: "\uB9D1\uC740 \uACE0\uB515" };
  sheet.freezePanes.freezeRows(4);
  styledRange(sheet, 0, 0, 1, columns.length, {
    fill: "#111827",
    font: { bold: true, color: "#FFFFFF" },
  });
  styledRange(sheet, 1, 0, 1, columns.length, {
    fill: "#374151",
    font: { bold: true, color: "#E5E7EB" },
  });
  styledRange(sheet, 2, 0, 1, columns.length, {
    fill: "#E5E7EB",
    font: { color: "#111827", size: 8 },
  });
  styledRange(sheet, 3, 0, 1, columns.length, {
    fill: "#FEF3C7",
    font: { bold: true, color: "#92400E" },
  });
  range.format.borders = { preset: "all", style: "thin", color: "#D1D5DB" };
  setColumnWidths(sheet, values.length, [90, 260]);
  return sheet;
}

async function loadExistingSheetRows(filename, sheetName) {
  const inputPath = path.join(outputDir, filename);
  try {
    await fs.access(inputPath);
  } catch {
    return [];
  }

  const input = await FileBlob.load(inputPath);
  const workbook = await SpreadsheetFile.importXlsx(input);
  const sheet = workbook.worksheets.getItem(sheetName);
  if (!sheet) return [];

  const usedRange = sheet.getUsedRange(true);
  const values = usedRange?.values;
  if (!values || values.length < 5) return [];

  const headers = values[0];
  return values.slice(4)
    .filter((row) => row.some((value) => value !== null && value !== ""))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
}

const existingSlotSymbols = new Map(
  (await loadExistingSheetRows("SlotMachine.xlsx", "SlotSymbols"))
    .filter((row) => row.SlotSymbolsIndex !== null && row.SlotSymbolsIndex !== "")
    .map((row) => [normalizeEnumRef(row.SymbolEnumId), row]),
);

const existingPaytableRows = await loadExistingSheetRows("SlotMachine.xlsx", "Paytable");
const existingPaytableByScopedKey = new Map();
const existingPaytableByGlobalKey = new Map();
for (const row of existingPaytableRows) {
  const symbolId = normalizeEnumRef(row.SymbolEnumId);
  const matchCount = Number(row.MatchCount);
  const lineType = normalizeEnumRef(row.LineTypeEnumId || enumRef("ALL_HORIZONTAL_LINES"));
  const baseBetRegionIndex = Number(row.BaseBetRegionIndex);
  const globalKey = `${symbolId}:${matchCount}:${lineType}`;
  if (Number.isFinite(baseBetRegionIndex) && baseBetRegionIndex > 0) {
    existingPaytableByScopedKey.set(`${baseBetRegionIndex}:${globalKey}`, row);
  }
  existingPaytableByGlobalKey.set(globalKey, row);
}

const existingScreenSprayVfxRows = await loadExistingSheetRows("SlotMachine.xlsx", "ScreenSprayVfx");
const existingScreenSprayVfx = existingScreenSprayVfxRows[0] ?? {};

const existingReelStripRows = new Map(
  (await loadExistingSheetRows("SpinPresentation.xlsx", "ReelStrips"))
    .filter((row) => row.ReelStripsIndex !== null && row.ReelStripsIndex !== "")
    .map((row) => [`${row.BaseBetRegionIndex}:${row.ReelNo}:${row.StopIndex}`, row]),
);

function existingSlotSymbol(symbolId, key, fallback) {
  const value = existingSlotSymbols.get(symbolId)?.[key];
  return value === null || value === undefined || value === "" ? fallback : value;
}

function existingPaytableValue(baseBetRegionIndex, symbolId, matchCount, lineType, key, fallback) {
  const globalKey = `${symbolId}:${matchCount}:${lineType}`;
  const row = existingPaytableByScopedKey.get(`${baseBetRegionIndex}:${globalKey}`)
    ?? existingPaytableByGlobalKey.get(globalKey);
  const value = row?.[key];
  return value === null || value === undefined || value === "" ? fallback : value;
}

function existingReelStripValue(baseBetRegionIndex, reelNo, stopIndex, key, fallback) {
  const value = existingReelStripRows.get(`${baseBetRegionIndex}:${reelNo}:${stopIndex}`)?.[key];
  return value === null || value === undefined || value === "" ? fallback : value;
}

function existingScreenSprayVfxValue(key, fallback) {
  const value = existingScreenSprayVfx?.[key];
  return value === null || value === undefined || value === "" ? fallback : value;
}

async function saveWorkbook(filename, build) {
  const workbook = Workbook.create();
  build(workbook);
  const errors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
    summary: "formula error scan",
  });
  if (errors.ndjson.includes("#REF!") || errors.ndjson.includes("#DIV/0!") || errors.ndjson.includes("#VALUE!")) {
    throw new Error(errors.ndjson);
  }
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, filename);
  const xlsx = await SpreadsheetFile.exportXlsx(workbook);
  await xlsx.save(outputPath);
  return outputPath;
}

const outputs = [];

outputs.push(await saveWorkbook("GameString.xlsx", (workbook) => {
  addGameStringSheet(workbook);
}));

outputs.push(await saveWorkbook("Enum.xlsx", (workbook) => {
  addDataSheet(workbook, "Enums", [
    { name: "EnumsIndex", scope: "all", desc: "Unique row index for enum normalization.", type: "int" },
    { name: "EnumTypeName", scope: "all", desc: "Enum group name used by import validation.", type: "string" },
    { name: "EnumNo", scope: "all", desc: "Integer value inside the enum group.", type: "int" },
    { name: "EnumId", scope: "all", desc: "Human-readable enum id for designers and code mapping.", type: "string" },
    { name: "EnumString", scope: "client", desc: "References GameString.Index for formatting this enum as text.", type: "ref:GameString.Index" },
    { name: "EnumKo", scope: "design", desc: "Korean enum value used by designers and ref:Enums columns.", type: "string" },
  ], [
    [1, "SlotSymbol", 1, "SLIME", enumStringIndexById.SLIME, enumRef("SLIME")],
    [2, "SlotSymbol", 2, "MUSHROOM", enumStringIndexById.MUSHROOM, enumRef("MUSHROOM")],
    [3, "SlotSymbol", 3, "PIG", enumStringIndexById.PIG, enumRef("PIG")],
    [4, "SlotSymbol", 4, "GOLEM", enumStringIndexById.GOLEM, enumRef("GOLEM")],
    [5, "SlotSymbol", 5, "PINK_BEAN", enumStringIndexById.PINK_BEAN, enumRef("PINK_BEAN")],
    [6, "SlotSymbol", 6, "WILD", enumStringIndexById.WILD, enumRef("WILD")],
    [7, "LineType", 1, "TOP_LINE", enumStringIndexById.TOP_LINE, enumRef("TOP_LINE")],
    [8, "LineType", 2, "MAIN_LINE", enumStringIndexById.MAIN_LINE, enumRef("MAIN_LINE")],
    [9, "LineType", 3, "BOTTOM_LINE", enumStringIndexById.BOTTOM_LINE, enumRef("BOTTOM_LINE")],
    [10, "LineType", 4, "ALL_HORIZONTAL_LINES", enumStringIndexById.ALL_HORIZONTAL_LINES, enumRef("ALL_HORIZONTAL_LINES")],
    [11, "CurrencyType", 1, "PREMIUM_COIN", enumStringIndexById.PREMIUM_COIN, enumRef("PREMIUM_COIN")],
    [12, "CurrencyType", 2, "COMMON_COIN", enumStringIndexById.COMMON_COIN, enumRef("COMMON_COIN")],
    [13, "SpinProfileType", 1, "NORMAL", enumStringIndexById.NORMAL, enumRef("NORMAL")],
    [14, "SpinProfileType", 2, "QUICK", enumStringIndexById.QUICK, enumRef("QUICK")],
    [15, "SpinProfileType", 3, "TENSION", enumStringIndexById.TENSION, enumRef("TENSION")],
    [16, "InsufficientBalanceAction", 1, "REJECT_SPIN", enumStringIndexById.REJECT_SPIN, enumRef("REJECT_SPIN")],
    [17, "SymbolWinAnimation", 1, "BOUNCE", enumStringIndexById.BOUNCE, enumRef("BOUNCE")],
    [18, "SymbolWinAnimation", 2, "POP", enumStringIndexById.POP, enumRef("POP")],
    [19, "SymbolWinAnimation", 3, "WOBBLE", enumStringIndexById.WOBBLE, enumRef("WOBBLE")],
    [20, "SymbolWinAnimation", 4, "SHAKE", enumStringIndexById.SHAKE, enumRef("SHAKE")],
    [21, "SymbolWinAnimation", 5, "FLASH", enumStringIndexById.FLASH, enumRef("FLASH")],
  ], [110, 180, 100, 180, 130, 180]);
}));

outputs.push(await saveWorkbook("SlotMachine.xlsx", (workbook) => {
  const regions = baseBetRegionTable.map(([index, regionName, betCoins]) => [
    index,
    gameStringIndexByRegionIndex.get(index),
    betCoins,
    gs.BASE_BET_LABEL,
    true,
    300,
    "Prototype test data.",
  ]);

  addDataSheet(workbook, "BaseBetRegions", [
    { name: "BaseBetRegionsIndex", scope: "all", desc: "Unique row index for base bet normalization.", type: "int" },
    { name: "RegionNameStringIndex", scope: "all", desc: "References GameString.Index for the displayed Base Bet region name.", type: "ref:GameString.Index" },
    { name: "BetCoins", scope: "all", desc: "Displayed coin amount paid per spin before multiplier.", type: "int" },
    { name: "DisplayTemplateStringIndex", scope: "client", desc: "References GameString.Index for display text formatting.", type: "ref:GameString.Index" },
    { name: "InitialUnlocked", scope: "all", desc: "Whether this base bet is initially available.", type: "bool" },
    { name: "LockSeconds", scope: "server", desc: "Lock duration after selecting the base bet region.", type: "int" },
    { name: "Notes", scope: "design", desc: "Designer-only note ignored by runtime import.", type: "string" },
  ], regions, [150, 130, 90, 190, 120, 110, 220]);

  const slotSymbolRows = ["SLIME", "MUSHROOM", "PIG", "GOLEM", "PINK_BEAN", "WILD"].map((symbolId, index) => {
    const symbolData = slotSymbolTable[symbolId];
    const existingWinAnimationId = normalizeEnumRef(existingSlotSymbol(symbolId, "WinAnimationEnumId", symbolData.winAnimation));
    const resourceRuid = existingSlotSymbol(symbolId, "SymbolResourceRuid", symbolData.resourceRuid);
    return [
      index + 1,
      enumRef(symbolId),
      enumStringIndexById[symbolId],
      enumStringIndexById[symbolId],
      resourceRuid,
      existingSlotSymbol(symbolId, "WinAnimationRuid", resourceRuid),
      enumRef(existingWinAnimationId),
      existingSlotSymbol(symbolId, "Rank", symbolData.rank),
      existingSlotSymbol(symbolId, "ThemeRole", symbolData.themeRole),
      existingSlotSymbol(symbolId, "IntendedRarity", symbolData.intendedRarity),
    ];
  });

  addDataSheet(workbook, "SlotSymbols", [
    { name: "SlotSymbolsIndex", scope: "all", desc: "Unique row index for symbol normalization.", type: "int" },
    { name: "SymbolEnumId", scope: "all", desc: "References Enums where EnumTypeName is SlotSymbol.", type: "ref:Enums.SlotSymbol" },
    { name: "DisplayNameStringIndex", scope: "client", desc: "References GameString.Index for symbol display name.", type: "ref:GameString.Index" },
    { name: "RuntimeLabelStringIndex", scope: "client", desc: "References GameString.Index for prototype/debug symbol label.", type: "ref:GameString.Index" },
    { name: "SymbolResourceRuid", scope: "client", desc: "Default idle sprite or animationclip RUID used for this symbol.", type: "string" },
    { name: "WinAnimationRuid", scope: "client", desc: "Default sprite animationclip RUID used when this symbol wins.", type: "string" },
    { name: "WinAnimationEnumId", scope: "client", desc: "References Enums where EnumTypeName is SymbolWinAnimation.", type: "ref:Enums.SymbolWinAnimation" },
    { name: "Rank", scope: "design", desc: "Designer ordering from low to high reward identity.", type: "int" },
    { name: "ThemeRole", scope: "design", desc: "Planning note for later MapleStory resource matching.", type: "string" },
    { name: "IntendedRarity", scope: "design", desc: "Planning rarity note before final reel strips are tuned.", type: "string" },
  ], slotSymbolRows, [140, 130, 190, 190, 230, 230, 170, 80, 220, 130]);

  const basePaytableRows = [
    ["SLIME", 3, 4, 0.4, "ALL_HORIZONTAL_LINES"],
    ["SLIME", 4, 12, 1.2, "ALL_HORIZONTAL_LINES"],
    ["SLIME", 5, 40, 4.0, "ALL_HORIZONTAL_LINES"],
    ["MUSHROOM", 3, 6, 0.6, "ALL_HORIZONTAL_LINES"],
    ["MUSHROOM", 4, 18, 1.8, "ALL_HORIZONTAL_LINES"],
    ["MUSHROOM", 5, 70, 7.0, "ALL_HORIZONTAL_LINES"],
    ["PIG", 3, 10, 1.0, "ALL_HORIZONTAL_LINES"],
    ["PIG", 4, 30, 3.0, "ALL_HORIZONTAL_LINES"],
    ["PIG", 5, 120, 12.0, "ALL_HORIZONTAL_LINES"],
    ["GOLEM", 3, 18, 1.8, "ALL_HORIZONTAL_LINES"],
    ["GOLEM", 4, 60, 6.0, "ALL_HORIZONTAL_LINES"],
    ["GOLEM", 5, 300, 30.0, "ALL_HORIZONTAL_LINES"],
    ["PINK_BEAN", 3, 40, 4.0, "ALL_HORIZONTAL_LINES"],
    ["PINK_BEAN", 4, 150, 15.0, "ALL_HORIZONTAL_LINES"],
    ["PINK_BEAN", 5, 1000, 100.0, "ALL_HORIZONTAL_LINES"],
  ];
  const paytableRows = [];
  let paytableIndex = 1;
  for (const [baseBetRegionIndex] of baseBetRegionTable) {
    for (const [symbolId, matchCount, defaultPayoutTenths, defaultPayoutMultiplierX, lineType] of basePaytableRows) {
      const payoutTenths = Number(existingPaytableValue(baseBetRegionIndex, symbolId, matchCount, lineType, "PayoutTenths", defaultPayoutTenths));
      const payoutMultiplierX = existingPaytableValue(baseBetRegionIndex, symbolId, matchCount, lineType, "PayoutMultiplierX", payoutTenths / 10);
      paytableRows.push([
        paytableIndex,
        baseBetRegionIndex,
        enumRef(symbolId),
        matchCount,
        payoutTenths,
        payoutMultiplierX,
        enumRef(lineType),
        existingPaytableValue(baseBetRegionIndex, symbolId, matchCount, lineType, "Notes", ""),
      ]);
      paytableIndex += 1;
    }
  }

  addDataSheet(workbook, "Paytable", [
    { name: "PaytableIndex", scope: "all", desc: "Unique row index for paytable normalization.", type: "int" },
    { name: "BaseBetRegionIndex", scope: "all", desc: "References BaseBetRegions.BaseBetRegionsIndex; each BaseBet region can own payout values.", type: "ref:BaseBetRegions.BaseBetRegionsIndex" },
    { name: "SymbolEnumId", scope: "all", desc: "References Enums where EnumTypeName is SlotSymbol.", type: "ref:Enums.SlotSymbol" },
    { name: "MatchCount", scope: "server", desc: "Required consecutive same-symbol count on an enabled horizontal line.", type: "int" },
    { name: "PayoutTenths", scope: "server", desc: "Payout multiplier stored as tenths to avoid float logic.", type: "int" },
    { name: "PayoutMultiplierX", scope: "design", desc: "Designer-readable payout multiplier.", type: "float" },
    { name: "LineTypeEnumId", scope: "server", desc: "References Enums where EnumTypeName is LineType.", type: "ref:Enums.LineType" },
    { name: "Notes", scope: "design", desc: "Designer-only note ignored by runtime import.", type: "string" },
  ], paytableRows, [120, 150, 130, 110, 120, 140, 140, 180]);

  addDataSheet(workbook, "Paylines", [
    { name: "PaylinesIndex", scope: "all", desc: "Unique row index for payline normalization.", type: "int" },
    { name: "LineTypeEnumId", scope: "all", desc: "References Enums where EnumTypeName is LineType.", type: "ref:Enums.LineType" },
    { name: "StartRow", scope: "server", desc: "First row coordinate for the payline.", type: "int" },
    { name: "StartColumn", scope: "server", desc: "First column coordinate for the payline.", type: "int" },
    { name: "RowPattern", scope: "server", desc: "Comma-separated row coordinates for columns 1 through 5.", type: "string" },
    { name: "IsEnabled", scope: "all", desc: "Whether this payline is active.", type: "bool" },
    { name: "CostCountsAsLine", scope: "server", desc: "Whether this line increases spin cost.", type: "bool" },
    { name: "Notes", scope: "design", desc: "Designer-only note ignored by runtime import.", type: "string" },
  ], [
    [1, enumRef("TOP_LINE"), 1, 1, "1,1,1,1,1", true, false, "P0.5 horizontal payline. Active for payout, not extra spin cost."],
    [2, enumRef("MAIN_LINE"), 2, 1, "2,2,2,2,2", true, false, "P0.5 horizontal payline. Active for payout, not extra spin cost."],
    [3, enumRef("BOTTOM_LINE"), 3, 1, "3,3,3,3,3", true, false, "P0.5 horizontal payline. Active for payout, not extra spin cost."],
  ], [120, 150, 100, 110, 170, 100, 150, 220]);

  addDataSheet(workbook, "Multipliers", [
    { name: "MultipliersIndex", scope: "all", desc: "Unique row index for multiplier normalization.", type: "int" },
    { name: "MultiplierValue", scope: "all", desc: "Spin cost and reward multiplier value.", type: "int" },
    { name: "DisplayTemplateStringIndex", scope: "client", desc: "References GameString.Index for display text formatting.", type: "ref:GameString.Index" },
    { name: "CanChangeDuringSpin", scope: "all", desc: "Whether selection can change while reels spin.", type: "bool" },
  ], [
    [1, 1, gs.MULTIPLIER_LABEL, false],
    [2, 2, gs.MULTIPLIER_LABEL, false],
    [3, 3, gs.MULTIPLIER_LABEL, false],
    [4, 4, gs.MULTIPLIER_LABEL, false],
    [5, 5, gs.MULTIPLIER_LABEL, false],
  ], [130, 130, 190, 170]);

  addDataSheet(workbook, "ScreenSprayVfx", [
    { name: "ScreenSprayVfxIndex", scope: "all", desc: "Unique row index for screen-wide slot VFX triggers.", type: "int" },
    { name: "TriggerKey", scope: "client", desc: "Stable runtime trigger key for this screen-wide VFX.", type: "string" },
    { name: "AnimationClipRuid", scope: "client", desc: "MSW animationclip RUID played over the full screen.", type: "string" },
    { name: "MinFourPlusLineWins", scope: "client", desc: "Play when at least this many winning paylines have MatchCount >= 4.", type: "int" },
    { name: "MinFivePlusLineWins", scope: "client", desc: "Play when at least this many winning paylines have MatchCount >= 5.", type: "int" },
    { name: "PlayRate", scope: "client", desc: "Playback speed multiplier for the animationclip.", type: "float" },
    { name: "FallbackHideSeconds", scope: "client", desc: "Safety delay to hide the full-screen VFX after one play.", type: "float" },
    { name: "Notes", scope: "design", desc: "Designer-only note ignored by runtime import.", type: "string" },
  ], [[
    1,
    existingScreenSprayVfxValue("TriggerKey", "BIG_MATCH_SCREEN_SPRAY"),
    existingScreenSprayVfxValue("AnimationClipRuid", screenSprayVfxRuid),
    Number(existingScreenSprayVfxValue("MinFourPlusLineWins", 2)),
    Number(existingScreenSprayVfxValue("MinFivePlusLineWins", 1)),
    Number(existingScreenSprayVfxValue("PlayRate", 1.0)),
    Number(existingScreenSprayVfxValue("FallbackHideSeconds", 1.25)),
    existingScreenSprayVfxValue("Notes", "2+ four-match winning paylines or 1+ five-match win plays a full-screen spray animation once."),
  ]], [170, 210, 280, 190, 190, 100, 150, 360]);
}));

outputs.push(await saveWorkbook("Config.xlsx", (workbook) => {
  addConfigSheet(workbook, "SlotMachineConfig", [
    { name: "SlotRows", scope: "all", desc: "Number of visible slot rows.", type: "int" },
    { name: "ReelCount", scope: "all", desc: "Number of visible reel columns.", type: "int" },
    { name: "EnabledLineTypeEnumIds", scope: "all", desc: "Comma-separated active LineType EnumIds.", type: "string" },
    { name: "SpinCostIncludesActivePaylineCount", scope: "server", desc: "Whether spin cost multiplies by active payline count.", type: "bool" },
    { name: "OutcomeDecidedOnSpinStart", scope: "server", desc: "Spin result is fixed before presentation starts.", type: "bool" },
  ], [3, 5, [enumRef("TOP_LINE"), enumRef("MAIN_LINE"), enumRef("BOTTOM_LINE")].join(","), false, true], [110, 110, 260, 260, 220]);

  addConfigSheet(workbook, "CurrencyConfig", [
    { name: "InitialPremiumCoin", scope: "all", desc: "Play-test Premium Coin amount on session start.", type: "int" },
    { name: "InitialCommonCoin", scope: "all", desc: "Play-test Common Coin amount on session start.", type: "int" },
    { name: "InternalCoinUnit", scope: "all", desc: "Internal unit count per displayed coin.", type: "int" },
    { name: "ConsumePremiumFirst", scope: "server", desc: "Premium Coin is consumed before Common Coin.", type: "bool" },
    { name: "PayoutCurrencyEnumId", scope: "server", desc: "References Enums where EnumTypeName is CurrencyType.", type: "ref:Enums.CurrencyType" },
    { name: "InsufficientBalanceActionEnumId", scope: "server", desc: "Action when balance cannot pay spin cost.", type: "ref:Enums.InsufficientBalanceAction" },
  ], [9999, 0, 10, true, enumRef("COMMON_COIN"), enumRef("REJECT_SPIN")], [160, 160, 140, 170, 190, 250]);
}));

outputs.push(await saveWorkbook("SpinPresentation.xlsx", (workbook) => {
  addDataSheet(workbook, "SpinProfiles", [
    { name: "SpinProfilesIndex", scope: "all", desc: "Unique row index for spin profile normalization.", type: "int" },
    { name: "SpinProfileEnumId", scope: "all", desc: "References Enums where EnumTypeName is SpinProfileType.", type: "ref:Enums.SpinProfileType" },
    { name: "WeightPercent", scope: "server", desc: "Weighted random chance to select this spin rhythm.", type: "int" },
    { name: "OverallFeel", scope: "design", desc: "Designer-facing summary of the spin rhythm.", type: "string" },
    { name: "FirstReelMinSec", scope: "client", desc: "Minimum stop time for the first reel.", type: "float" },
    { name: "FirstReelMaxSec", scope: "client", desc: "Maximum stop time for the first reel.", type: "float" },
    { name: "StaggerMinSec", scope: "client", desc: "Minimum delay before the next reel stop.", type: "float" },
    { name: "StaggerMaxSec", scope: "client", desc: "Maximum delay before the next reel stop.", type: "float" },
  ], [
    [1, enumRef("NORMAL"), 70, "Standard spin rhythm", 1.55, 1.90, 0.18, 0.36],
    [2, enumRef("QUICK"), 20, "Snappier short spin", 1.25, 1.55, 0.14, 0.28],
    [3, enumRef("TENSION"), 10, "Longer suspenseful spin", 1.85, 2.30, 0.26, 0.55],
  ], [140, 160, 120, 200, 140, 140, 140, 140]);

  addConfigSheet(workbook, "ReelMotionConfig", [
    { name: "MinCellsPerSecond", scope: "client", desc: "Minimum reel movement speed; add loops if slower.", type: "float" },
    { name: "MaxCellsPerSecond", scope: "client", desc: "Maximum reel movement speed; reduce loops or extend time if faster.", type: "float" },
    { name: "ExtraLoopMin", scope: "client", desc: "Minimum full strip loops before a reel can stop.", type: "int" },
    { name: "ExtraLoopRandomMin", scope: "client", desc: "Lower bound for additional random loops.", type: "int" },
    { name: "ExtraLoopRandomMax", scope: "client", desc: "Upper bound for additional random loops.", type: "int" },
    { name: "AccelerateSecondsMin", scope: "client", desc: "Minimum acceleration ramp duration.", type: "float" },
    { name: "AccelerateSecondsMax", scope: "client", desc: "Maximum acceleration ramp duration.", type: "float" },
    { name: "DecelerateSecondsMin", scope: "client", desc: "Minimum deceleration duration.", type: "float" },
    { name: "DecelerateSecondsMax", scope: "client", desc: "Maximum deceleration duration.", type: "float" },
    { name: "SettleBounceSecondsMin", scope: "client", desc: "Minimum final snap or bounce duration.", type: "float" },
    { name: "SettleBounceSecondsMax", scope: "client", desc: "Maximum final snap or bounce duration.", type: "float" },
  ], [18, 42, 2, 0, 2, 0.15, 0.25, 0.35, 0.55, 0.08, 0.14], [150, 150, 120, 160, 160, 170, 170, 170, 170, 190, 190]);

  const stripRows = [];
  const strips = [
    ["SLIME", "MUSHROOM", "PIG", "GOLEM", "PINK_BEAN", "SLIME", "MUSHROOM", "PIG", "GOLEM", "SLIME", "MUSHROOM", "PIG", "GOLEM", "PINK_BEAN", "WILD"],
    ["MUSHROOM", "PIG", "SLIME", "PINK_BEAN", "GOLEM", "MUSHROOM", "PIG", "SLIME", "GOLEM", "MUSHROOM", "PIG", "SLIME", "GOLEM", "PINK_BEAN", "WILD"],
    ["PIG", "SLIME", "GOLEM", "MUSHROOM", "PINK_BEAN", "PIG", "SLIME", "GOLEM", "MUSHROOM", "PIG", "SLIME", "GOLEM", "MUSHROOM", "PINK_BEAN", "WILD"],
    ["GOLEM", "SLIME", "MUSHROOM", "PINK_BEAN", "PIG", "GOLEM", "SLIME", "MUSHROOM", "PIG", "GOLEM", "SLIME", "MUSHROOM", "PIG", "PINK_BEAN", "WILD"],
    ["PINK_BEAN", "PIG", "MUSHROOM", "SLIME", "GOLEM", "PIG", "MUSHROOM", "SLIME", "GOLEM", "PIG", "MUSHROOM", "SLIME", "GOLEM", "PINK_BEAN", "WILD"],
  ];
  let rowIndex = 1;
  for (const [baseBetRegionIndex, regionName] of baseBetRegionTable) {
    for (let reel = 1; reel <= 5; reel += 1) {
      for (let stopIndex = 1; stopIndex <= 30; stopIndex += 1) {
        const pattern = strips[reel - 1];
        const shiftedIndex = (stopIndex + baseBetRegionIndex + reel - 3) % pattern.length;
        const defaultSymbolId = pattern[shiftedIndex];
        const symbolId = normalizeEnumRef(existingReelStripValue(baseBetRegionIndex, reel, stopIndex, "SymbolEnumId", enumRef(defaultSymbolId)));
        const symbolData = slotSymbolTable[symbolId];
        const resourceRuid = existingReelStripValue(
          baseBetRegionIndex,
          reel,
          stopIndex,
          "IdleSpriteRuid",
          existingSlotSymbol(symbolId, "SymbolResourceRuid", symbolData.resourceRuid),
        );
        const winAnimationRuid = existingReelStripValue(
          baseBetRegionIndex,
          reel,
          stopIndex,
          "WinAnimationRuid",
          existingSlotSymbol(symbolId, "WinAnimationRuid", resourceRuid),
        );
        const winAnimationId = normalizeEnumRef(existingReelStripValue(
          baseBetRegionIndex,
          reel,
          stopIndex,
          "WinAnimationEnumId",
          existingSlotSymbol(symbolId, "WinAnimationEnumId", symbolData.winAnimation),
        ));
        stripRows.push([
          rowIndex,
          baseBetRegionIndex,
          existingReelStripValue(baseBetRegionIndex, reel, stopIndex, "RegionName", regionName),
          reel,
          stopIndex,
          enumRef(symbolId),
          resourceRuid,
          winAnimationRuid,
          enumRef(winAnimationId),
          existingReelStripValue(baseBetRegionIndex, reel, stopIndex, "Notes", "BaseBet-specific strip. Edit SymbolEnumId, IdleSpriteRuid, and WinAnimationRuid per cell."),
        ]);
        rowIndex += 1;
      }
    }
  }
  addDataSheet(workbook, "ReelStrips", [
    { name: "ReelStripsIndex", scope: "all", desc: "Unique row index for reel-strip normalization.", type: "int" },
    { name: "BaseBetRegionIndex", scope: "all", desc: "References BaseBetRegions.BaseBetRegionsIndex; each BaseBet region owns its own reel strip set.", type: "ref:BaseBetRegions.BaseBetRegionsIndex" },
    { name: "RegionName", scope: "design", desc: "Designer-facing region name copied from BaseBetRegions for easier filtering.", type: "string" },
    { name: "ReelNo", scope: "all", desc: "Visible reel column number from left to right.", type: "int" },
    { name: "StopIndex", scope: "all", desc: "Position inside the looping reel strip.", type: "int" },
    { name: "SymbolEnumId", scope: "all", desc: "References Enums where EnumTypeName is SlotSymbol.", type: "ref:Enums.SlotSymbol" },
    { name: "IdleSpriteRuid", scope: "client", desc: "MSW sprite or animationclip RUID used by this reel stop cell during normal display.", type: "string" },
    { name: "WinAnimationRuid", scope: "client", desc: "MSW animationclip RUID used by this cell when included in a winning line.", type: "string" },
    { name: "WinAnimationEnumId", scope: "client", desc: "Symbol animation category for filtering or fallback selection.", type: "ref:Enums.SymbolWinAnimation" },
    { name: "Notes", scope: "design", desc: "Designer-only note ignored by runtime import.", type: "string" },
  ], stripRows, [140, 150, 130, 90, 100, 140, 230, 230, 170, 360]);
}));

outputs.push(await saveWorkbook("UI.xlsx", (workbook) => {
  addDataSheet(workbook, "UIBindings", [
    { name: "UIBindingsIndex", scope: "design", desc: "Unique row index for UI binding notes.", type: "int" },
    { name: "BindingKey", scope: "client", desc: "Stable binding key used by UI code or manual mapping.", type: "string" },
    { name: "UINode", scope: "client", desc: "Expected UI node name in the Maker UI hierarchy.", type: "string" },
    { name: "Purpose", scope: "design", desc: "Short reason this binding exists.", type: "string" },
    { name: "CurrentStatus", scope: "design", desc: "Prototype implementation status.", type: "string" },
  ], [
    [1, "PremiumCoinText", "Text_PremiumCoinAmount", "Premium Coin display", "Implemented"],
    [2, "CommonCoinText", "Text_CommonCoinAmount", "Common Coin display", "Implemented"],
    [3, "BaseBetDropdown", "Dropdown_BaseBet", "Open/select Base Bet", "Needs scroll-list upgrade"],
    [4, "BaseBetText", "Text_BaseBetValue", "Selected Base Bet display", "Implemented"],
    [5, "BaseBetListPanel", "Panel_BaseBetList_Above_Hidden", "Upward scroll list", "Planned"],
    [6, "BaseBetOptionScroll", "Scroll_BaseBetOptions", "Scrollable Base Bet option area", "Planned"],
    [7, "BaseBetOptionTemplate", "Item_BaseBetOption_Template", "Base Bet option item", "Planned"],
    [8, "MultiplierButtons", "Button_Multiplier_x1..x5", "Multiplier selection", "Needs visual-state upgrade"],
    [9, "SpinButton", "Button_Spin", "Start spin", "Implemented"],
    [10, "ReelCells", "ReelStripCell_C1_01..C5_30", "3x5 visible reel window from 30-cell strips", "Implemented"],
  ], [130, 180, 260, 260, 210]);
}));

console.log(outputs.join("\n"));

