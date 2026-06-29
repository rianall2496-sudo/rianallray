import { AgencyStageInfo, CustomerType, GameEvent } from './types.ts';

export const INITIAL_MONEY = 10000000; // 10 million KRW
export const INITIAL_STATS = {
  intelligence: 10,
  stamina: 10,
  charm: 10,
  reputation: 0,
};

export const AGENCY_STAGES: Record<number, AgencyStageInfo> = {
  1: { level: 1, name: "동네 여행사", description: "동네 구석의 허름한 사무실. 사장 1명.", reqMoney: 0, reqReputation: 0, imagePlaceholder: "https://picsum.photos/seed/stage1/400/200" },
  2: { level: 2, name: "중형 여행사", description: "번화가로 진출한 번듯한 사무실.", reqMoney: 50000000, reqReputation: 500, imagePlaceholder: "https://picsum.photos/seed/stage2/400/200" },
  3: { level: 3, name: "전국 체인 여행사", description: "전국에 지점을 둔 유명 여행사.", reqMoney: 200000000, reqReputation: 2000, imagePlaceholder: "https://picsum.photos/seed/stage3/400/200" },
  4: { level: 4, name: "기업형 여행사", description: "항공사 및 호텔과 직접 협상하는 대형 기업.", reqMoney: 1000000000, reqReputation: 5000, imagePlaceholder: "https://picsum.photos/seed/stage4/400/200" },
  5: { level: 5, name: "글로벌 여행 그룹", description: "전 세계 50개국 지사, 항공사/호텔 인수 가능.", reqMoney: 5000000000, reqReputation: 20000, imagePlaceholder: "https://picsum.photos/seed/stage5/400/200" }
};

export const STAT_NAMES = {
  intelligence: "지력 (Intelligence)",
  stamina: "체력 (Stamina)",
  charm: "매력 (Charm)",
  reputation: "명성 (Reputation)"
};

export const STAT_DESCRIPTIONS = {
  intelligence: "수익 증가 및 실수 감소",
  stamina: "하루 행동력(의뢰 처리) 증가",
  charm: "의뢰 성공 확률 증가",
  reputation: "상위 단계 진급 및 VIP 의뢰 조건"
};

export const UPGRADE_COST_BASE = 1000000;

export const AIRLINES = [
  "대한항공", "아시아나항공", "제주항공", "진에어", "티웨이항공", "에어부산", "에어서울", "이스타항공", "피치항공", "ANA",
  "JAL", "에바항공", "중화항공", "캐세이퍼시픽", "홍콩익스프레스", "중국동방항공", "중국남방항공", "에어아시아", "싱가포르항공", "타이항공",
  "베트남항공", "비엣젯항공", "필리핀항공", "세부퍼시픽", "가루다인도네시아", "말레이시아항공", "콴타스항공", "에어뉴질랜드", "델타항공", "유나이티드항공",
  "아메리칸항공", "에어캐나다", "하와이안항공", "에어프랑스", "루프트한자", "영국항공", "KLM독일항공", "핀에어", "알리탈리아", "아에로플로트",
  "에미레이트항공", "카타르항공", "에티하드항공", "터키항공", "사우디아항공", "에어인디아", "LATAM", "아비앙카", "에티오피아항공", "플레이어항공"
];

export const HOTELS = [
  "힐튼", "메리어트", "인터컨티넨탈", "하얏트", "아코르", "포시즌스", "샹그릴라", "만다린 오리엔탈", "페닌슐라", "로즈우드",
  "반얀트리", "아만", "식스센스", "세인트레지스", "리츠칼튼", "월도프 아스토리아", "콘래드", "파크 하얏트", "그랜드 하얏트", "안다즈"
];

export const ATTRACTIONS = [
  "유니버설 스튜디오", "디즈니랜드", "디즈니씨", "도쿄타워", "스카이트리", "오사카성", "루브르 박물관", "에펠탑", "대영박물관", "런던아이",
  "콜로세움", "바티칸 미술관", "자유의 여신상", "엠파이어 스테이트", "그랜드 캐니언", "나이아가라 헬기투어", "오로라 관측", "사막 사파리", "스노클링 투어", "미슐랭 미식투어"
];

export const RENTAL_CARS = [
  "허츠(Hertz)", "아비스(Avis)", "엔터프라이즈(Enterprise)", "알라모(Alamo)", "유로카(Europcar)", 
  "내셔널(National)", "버젯(Budget)", "달러(Dollar)", "식스트(Sixt)", "스리프티(Thrifty)",
  "롯데렌터카", "SK렌터카", "쏘카", "그린카", "타임즈카", "토요타렌터카", "닛산렌터카", "오릭스렌터카"
];

export const DESTINATIONS = [
  // 국내선 (Stage 1)
  { name: "제주", country: "한국", isDomestic: true, stage: 1, basePrice: 50000, airport: "제주(CJU)", minDuration: 1, maxDuration: 3, flightTime: 70 },
  { name: "부산", country: "한국", isDomestic: true, stage: 1, basePrice: 60000, airport: "김해(PUS)", minDuration: 1, maxDuration: 2, flightTime: 60 },
  { name: "여수", country: "한국", isDomestic: true, stage: 1, basePrice: 45000, airport: "여수(RSU)", minDuration: 1, maxDuration: 2, flightTime: 55 },
  { name: "양양", country: "한국", isDomestic: true, stage: 1, basePrice: 40000, airport: "양양(YNY)", minDuration: 1, maxDuration: 2, flightTime: 50 },
  { name: "광주", country: "한국", isDomestic: true, stage: 1, basePrice: 45000, airport: "광주(KWJ)", minDuration: 1, maxDuration: 2, flightTime: 55 },
  { name: "포항", country: "한국", isDomestic: true, stage: 1, basePrice: 55000, airport: "포항경주(KPO)", minDuration: 1, maxDuration: 2, flightTime: 55 },
  { name: "울산", country: "한국", isDomestic: true, stage: 1, basePrice: 55000, airport: "울산(USN)", minDuration: 1, maxDuration: 2, flightTime: 60 },
  { name: "사천", country: "한국", isDomestic: true, stage: 1, basePrice: 50000, airport: "사천(HIN)", minDuration: 1, maxDuration: 2, flightTime: 60 },
  { name: "군산", country: "한국", isDomestic: true, stage: 1, basePrice: 45000, airport: "군산(KUV)", minDuration: 1, maxDuration: 2, flightTime: 50 },
  { name: "원주", country: "한국", isDomestic: true, stage: 1, basePrice: 40000, airport: "원주(WJU)", minDuration: 1, maxDuration: 2, flightTime: 45 },

  // 국제선 (Stage 1)
  { name: "도쿄", country: "일본", isDomestic: false, stage: 1, basePrice: 200000, airport: "나리타(NRT)", minDuration: 2, maxDuration: 4, flightTime: 140 },
  { name: "오사카", country: "일본", isDomestic: false, stage: 1, basePrice: 180000, airport: "간사이(KIX)", minDuration: 2, maxDuration: 4, flightTime: 100 },
  { name: "후쿠오카", country: "일본", isDomestic: false, stage: 1, basePrice: 150000, airport: "후쿠오카(FUK)", minDuration: 2, maxDuration: 3, flightTime: 80 },
  { name: "삿포로", country: "일본", isDomestic: false, stage: 1, basePrice: 250000, airport: "신치토세(CTS)", minDuration: 3, maxDuration: 4, flightTime: 160 },
  { name: "오키나와", country: "일본", isDomestic: false, stage: 1, basePrice: 220000, airport: "나하(OKA)", minDuration: 3, maxDuration: 4, flightTime: 130 },
  { name: "베이징", country: "중국", isDomestic: false, stage: 1, basePrice: 180000, airport: "서우두(PEK)", minDuration: 2, maxDuration: 4, flightTime: 120 },
  { name: "상하이", country: "중국", isDomestic: false, stage: 1, basePrice: 190000, airport: "푸둥(PVG)", minDuration: 2, maxDuration: 4, flightTime: 110 },
  { name: "칭다오", country: "중국", isDomestic: false, stage: 1, basePrice: 120000, airport: "류팅(TAO)", minDuration: 2, maxDuration: 3, flightTime: 90 },
  { name: "타이베이", country: "대만", isDomestic: false, stage: 1, basePrice: 230000, airport: "타오위안(TPE)", minDuration: 2, maxDuration: 4, flightTime: 150 },
  { name: "홍콩", country: "홍콩", isDomestic: false, stage: 1, basePrice: 260000, airport: "첵랍콕(HKG)", minDuration: 2, maxDuration: 4, flightTime: 210 },
  
  // 국제선 (Stage 2)
  { name: "마카오", country: "마카오", isDomestic: false, stage: 2, basePrice: 250000, airport: "마카오(MFM)", minDuration: 2, maxDuration: 4, flightTime: 220 },
  { name: "방콕", country: "태국", isDomestic: false, stage: 2, basePrice: 350000, airport: "수완나품(BKK)", minDuration: 3, maxDuration: 5, flightTime: 350 },
  { name: "푸껫", country: "태국", isDomestic: false, stage: 2, basePrice: 400000, airport: "푸껫(HKT)", minDuration: 3, maxDuration: 5, flightTime: 380 },
  { name: "다낭", country: "베트남", isDomestic: false, stage: 2, basePrice: 320000, airport: "다낭(DAD)", minDuration: 3, maxDuration: 5, flightTime: 280 },
  { name: "하노이", country: "베트남", isDomestic: false, stage: 2, basePrice: 300000, airport: "노이바이(HAN)", minDuration: 3, maxDuration: 5, flightTime: 270 },
  { name: "호치민", country: "베트남", isDomestic: false, stage: 2, basePrice: 330000, airport: "떤선녓(SGN)", minDuration: 3, maxDuration: 5, flightTime: 310 },
  { name: "마닐라", country: "필리핀", isDomestic: false, stage: 2, basePrice: 280000, airport: "니노이아키노(MNL)", minDuration: 3, maxDuration: 5, flightTime: 240 },
  { name: "세부", country: "필리핀", isDomestic: false, stage: 2, basePrice: 310000, airport: "막탄세부(CEB)", minDuration: 3, maxDuration: 5, flightTime: 270 },
  { name: "보라카이", country: "필리핀", isDomestic: false, stage: 2, basePrice: 340000, airport: "칼리보(KLO)", minDuration: 3, maxDuration: 5, flightTime: 260 },
  { name: "싱가포르", country: "싱가포르", isDomestic: false, stage: 2, basePrice: 450000, airport: "창이(SIN)", minDuration: 3, maxDuration: 5, flightTime: 380 },
  
  // 국제선 (Stage 3)
  { name: "쿠알라룸푸르", country: "말레이시아", isDomestic: false, stage: 3, basePrice: 420000, airport: "쿠알라룸푸르(KUL)", minDuration: 3, maxDuration: 5, flightTime: 390 },
  { name: "코타키나발루", country: "말레이시아", isDomestic: false, stage: 3, basePrice: 400000, airport: "코타키나발루(BKI)", minDuration: 3, maxDuration: 5, flightTime: 310 },
  { name: "발리", country: "인도네시아", isDomestic: false, stage: 3, basePrice: 550000, airport: "응우라라이(DPS)", minDuration: 4, maxDuration: 6, flightTime: 420 },
  { name: "괌", country: "미국", isDomestic: false, stage: 3, basePrice: 480000, airport: "안토니오비원팻(GUM)", minDuration: 3, maxDuration: 5, flightTime: 260 },
  { name: "사이판", country: "미국", isDomestic: false, stage: 3, basePrice: 460000, airport: "사이판(SPN)", minDuration: 3, maxDuration: 5, flightTime: 260 },
  { name: "블라디보스토크", country: "러시아", isDomestic: false, stage: 3, basePrice: 350000, airport: "크네비치(VVO)", minDuration: 2, maxDuration: 4, flightTime: 160 },
  { name: "울란바토르", country: "몽골", isDomestic: false, stage: 3, basePrice: 400000, airport: "칭기스칸(UBN)", minDuration: 3, maxDuration: 5, flightTime: 220 },
  { name: "시드니", country: "호주", isDomestic: false, stage: 3, basePrice: 900000, airport: "시드니(SYD)", minDuration: 5, maxDuration: 8, flightTime: 600 },
  { name: "멜버른", country: "호주", isDomestic: false, stage: 3, basePrice: 950000, airport: "멜버른(MEL)", minDuration: 5, maxDuration: 8, flightTime: 630 },
  { name: "오클랜드", country: "뉴질랜드", isDomestic: false, stage: 3, basePrice: 1000000, airport: "오클랜드(AKL)", minDuration: 5, maxDuration: 8, flightTime: 660 },
  
  // 국제선 (Stage 4)
  { name: "파리", country: "프랑스", isDomestic: false, stage: 4, basePrice: 1200000, airport: "샤를드골(CDG)", minDuration: 6, maxDuration: 10, flightTime: 840 },
  { name: "런던", country: "영국", isDomestic: false, stage: 4, basePrice: 1300000, airport: "히스로(LHR)", minDuration: 6, maxDuration: 10, flightTime: 860 },
  { name: "로마", country: "이탈리아", isDomestic: false, stage: 4, basePrice: 1150000, airport: "피우미치노(FCO)", minDuration: 6, maxDuration: 10, flightTime: 800 },
  { name: "프랑크푸르트", country: "독일", isDomestic: false, stage: 4, basePrice: 1100000, airport: "프랑크푸르트(FRA)", minDuration: 6, maxDuration: 10, flightTime: 810 },
  { name: "마드리드", country: "스페인", isDomestic: false, stage: 4, basePrice: 1250000, airport: "바라하스(MAD)", minDuration: 6, maxDuration: 10, flightTime: 880 },
  { name: "바르셀로나", country: "스페인", isDomestic: false, stage: 4, basePrice: 1250000, airport: "엘프라트(BCN)", minDuration: 6, maxDuration: 10, flightTime: 870 },
  { name: "취리히", country: "스위스", isDomestic: false, stage: 4, basePrice: 1400000, airport: "취리히(ZRH)", minDuration: 6, maxDuration: 10, flightTime: 820 },
  { name: "암스테르담", country: "네덜란드", isDomestic: false, stage: 4, basePrice: 1200000, airport: "스히폴(AMS)", minDuration: 6, maxDuration: 10, flightTime: 830 },
  { name: "프라하", country: "체코", isDomestic: false, stage: 4, basePrice: 1050000, airport: "바츨라프하벨(PRG)", minDuration: 6, maxDuration: 10, flightTime: 800 },
  { name: "빈", country: "오스트리아", isDomestic: false, stage: 4, basePrice: 1100000, airport: "슈베하트(VIE)", minDuration: 6, maxDuration: 10, flightTime: 790 },
  
  // 국제선 (Stage 5)
  { name: "뉴욕", country: "미국", isDomestic: false, stage: 5, basePrice: 1500000, airport: "존F케네디(JFK)", minDuration: 7, maxDuration: 14, flightTime: 840 },
  { name: "로스앤젤레스", country: "미국", isDomestic: false, stage: 5, basePrice: 1300000, airport: "로스앤젤레스(LAX)", minDuration: 6, maxDuration: 10, flightTime: 660 },
  { name: "샌프란시스코", country: "미국", isDomestic: false, stage: 5, basePrice: 1350000, airport: "샌프란시스코(SFO)", minDuration: 6, maxDuration: 10, flightTime: 630 },
  { name: "시카고", country: "미국", isDomestic: false, stage: 5, basePrice: 1400000, airport: "오헤어(ORD)", minDuration: 6, maxDuration: 10, flightTime: 780 },
  { name: "하와이", country: "미국", isDomestic: false, stage: 5, basePrice: 1100000, airport: "호놀룰루(HNL)", minDuration: 4, maxDuration: 7, flightTime: 480 },
  { name: "토론토", country: "캐나다", isDomestic: false, stage: 5, basePrice: 1450000, airport: "피어슨(YYZ)", minDuration: 7, maxDuration: 14, flightTime: 780 },
  { name: "밴쿠버", country: "캐나다", isDomestic: false, stage: 5, basePrice: 1250000, airport: "밴쿠버(YVR)", minDuration: 6, maxDuration: 10, flightTime: 600 },
  { name: "두바이", country: "아랍에미리트", isDomestic: false, stage: 5, basePrice: 1000000, airport: "두바이(DXB)", minDuration: 4, maxDuration: 7, flightTime: 570 },
  { name: "아부다비", country: "아랍에미리트", isDomestic: false, stage: 5, basePrice: 950000, airport: "아부다비(AUH)", minDuration: 4, maxDuration: 7, flightTime: 580 },
  { name: "몰디브", country: "몰디브", isDomestic: false, stage: 5, basePrice: 1600000, airport: "말레(MLE)", minDuration: 4, maxDuration: 7, flightTime: 660 }
];

export const CUSTOMER_TYPES: CustomerType[] = [
  { name: '혼자 여행 (항공권만)', seats: 1, budgetMultiplier: 1.0, charmReq: 0, isVip: false, wantsHotel: false, wantsAttraction: false, wantsRentalCar: false },
  { name: '커플 (자유여행)', seats: 2, budgetMultiplier: 1.2, charmReq: 5, isVip: false, wantsHotel: true, wantsAttraction: false, wantsRentalCar: true },
  { name: '가족 (패키지)', seats: [3, 4, 5], budgetMultiplier: 1.5, charmReq: 15, isVip: false, wantsHotel: true, wantsAttraction: true, wantsRentalCar: true },
  { name: '학생 (배낭여행)', seats: [1, 2, 3, 4], budgetMultiplier: 0.8, charmReq: 0, isVip: false, wantsHotel: false, wantsAttraction: true, wantsRentalCar: false },
  { name: '회사 출장', seats: [1, 2, 5, 10], budgetMultiplier: 1.8, charmReq: 25, isVip: false, wantsHotel: true, wantsAttraction: false, wantsRentalCar: true },
  { name: 'VIP (풀패키지)', seats: [1, 2], budgetMultiplier: 3.5, charmReq: 60, isVip: true, wantsHotel: true, wantsAttraction: true, wantsRentalCar: true },
];

export const EMPLOYEE_ROLES = ["예약 전문가", "항공 전문가", "호텔 전문가", "패키지 전문가", "마케팅 전문가", "VIP 담당", "외국어 담당"];
export const EMPLOYEE_LEVELS = ["신입", "사원", "주임", "대리", "과장", "차장", "부장", "이사", "전무", "대표"];

export const RANDOM_EVENTS: Omit<GameEvent, 'id' | 'duration'>[] = [
  { name: "글로벌 스포츠 축제", description: "전 세계적인 스포츠 행사로 여행 수요가 폭증합니다!", type: "positive", priceMultiplier: 1.5, demandMultiplier: 2.0 },
  { name: "유명 인플루언서 방문", description: "특정 지역이 SNS에서 화제가 되었습니다.", type: "positive", priceMultiplier: 1.2, demandMultiplier: 1.5 },
  { name: "대형 태풍 발생", description: "기상 악화로 인해 항공편 결항 우려가 있습니다.", type: "negative", priceMultiplier: 0.7, demandMultiplier: 0.5 },
  { name: "환율 급등", description: "해외 여행 경비 부담으로 수요가 감소합니다.", type: "negative", priceMultiplier: 0.9, demandMultiplier: 0.7 },
  { name: "항공사 파업", description: "일부 항공편 운항이 취소될 수 있습니다.", type: "negative", priceMultiplier: 1.3, demandMultiplier: 0.6 },
];
