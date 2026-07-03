# ExcelTable 데이터 구조 가이드

이 문서는 `ExcelTable` 폴더의 엑셀 테이블이 어떤 기능을 담당하고, 런타임에서 어떤 구조로 사용되는지 정리한 문서입니다.

## 공통 작성 규칙

- 1행은 컬럼명입니다. 데이터 임포트와 런타임 변환 스크립트가 이 이름을 기준으로 값을 읽습니다.
- 2행은 사용 범위입니다. `client`, `server`, `all`, `design` 중 하나를 사용합니다.
- 3행은 컬럼 설명입니다. 기획자가 읽기 쉽도록 한글 설명을 적습니다.
- 4행은 컬럼 타입입니다. 예: `int`, `bool`, `string`, `ref:Enums.SlotSymbol`.
- 5행부터 실제 데이터입니다.
- 일반 데이터 테이블은 1열에 반드시 `시트명Index` 형태의 정수 인덱스를 둡니다.
- `Config` 계열 테이블은 설정값을 세로 행으로 나누지 않고 컬럼 단위로 가로 배치합니다. 따라서 인덱스 컬럼을 두지 않습니다.
- `ref:Enums.<타입명>` 컬럼은 `Enum.xlsx/Enums`의 `EnumKo` 값을 적는 것을 기본 작업 방식으로 사용합니다. 예: `SLIME` 대신 `슬라임`.
- UI의 선택 색상, 활성/비활성 색상처럼 코드와 캔버스 계층에서 직접 제어해야 하는 순수 시각 상태는 데이터 테이블에 넣지 않습니다.

## Config.xlsx

### SlotMachineConfig

슬롯 머신의 전역 규칙을 정의하는 설정 테이블입니다.

- `SlotRows`: 화면에 노출되는 슬롯 행 수입니다. 현재 3행입니다.
- `ReelCount`: 화면에 노출되는 릴 수입니다. 현재 5릴입니다.
- `EnabledLineTypeEnumIds`: 활성화할 페이라인 타입 목록입니다.
- `SpinCostIncludesActivePaylineCount`: Spin 비용에 활성 페이라인 수를 곱할지 여부입니다. 현재는 비용에 페이라인 수를 곱하지 않습니다.
- `OutcomeDecidedOnSpinStart`: Spin 시작 시점에 결과를 먼저 확정하는지 여부입니다.

### CurrencyConfig

슬롯 머신 테스트 경제와 재화 처리 규칙을 정의합니다.

- `InitialPremiumCoin`: 테스트 시작 시 지급되는 Premium Coin입니다.
- `InitialCommonCoin`: 테스트 시작 시 지급되는 Common Coin입니다.
- `InternalCoinUnit`: 내부 계산에서 코인 1개를 몇 유닛으로 볼지 정의합니다.
- `ConsumePremiumFirst`: 비용 차감 시 Premium Coin을 먼저 사용할지 여부입니다.
- `PayoutCurrencyEnumId`: 보상으로 지급되는 재화 타입입니다.
- `InsufficientBalanceActionEnumId`: 재화 부족 시 처리 방식입니다.

## Enum.xlsx

### Enums

코드와 데이터가 함께 사용하는 Enum 사전입니다.

- `EnumsIndex`: 행 인덱스입니다.
- `EnumTypeName`: Enum 타입명입니다. 예: `SlotSymbol`, `LineType`, `CurrencyType`.
- `EnumNo`: 해당 타입 안에서 사용하는 번호입니다.
- `EnumId`: 코드가 읽는 영문 식별자입니다.
- `EnumString`: 포맷 스트링에서 표시명을 찾을 때 참조할 GameString 인덱스입니다.
- `EnumKo`: 기획자가 데이터 입력 시 사용하는 한글 식별자입니다. 다른 테이블의 `ref:Enums.<타입명>` 컬럼은 이 값을 기준으로 조인할 수 있습니다.

## GameString.xlsx

### GameString

UI에 출력되는 모든 문자열의 원본 테이블입니다.

- `Index`: 문자열 인덱스입니다.
- `String<ko>`: 한국어 출력 문자열입니다.

포맷 스트링은 `{0}`, `{1}`처럼 플레이스홀더를 사용합니다. 예: `{0} - {1}코인`, `x{0}`.

## SlotMachine.xlsx

### BaseBetRegions

BaseBet 목록과 지역별 베팅 금액을 정의합니다.

- `BaseBetRegionsIndex`: BaseBet 지역 인덱스입니다. 다른 테이블에서 지역 그룹 키로 참조합니다.
- `RegionNameStringIndex`: 지역 이름을 출력할 GameString 인덱스입니다.
- `BetCoins`: 해당 BaseBet에서 Spin 1회에 넣는 코인 수입니다.
- `DisplayTemplateStringIndex`: BaseBet 드롭다운 표시 포맷을 찾을 GameString 인덱스입니다.
- `InitialUnlocked`: 처음부터 선택 가능한지 여부입니다.
- `LockSeconds`: 선택 후 잠금 시간이 필요한 경우 사용하는 값입니다.
- `Notes`: 기획 참고 메모입니다.

### SlotSymbols

슬롯 심볼의 전역 기본값을 정의합니다. BaseBet별 릴 셀에서 별도 리소스를 지정하지 않았을 때 이 테이블의 값이 기본값으로 사용됩니다.

- `SlotSymbolsIndex`: 심볼 행 인덱스입니다.
- `SymbolEnumId`: `Enum.xlsx/Enums`의 `SlotSymbol` 타입을 참조합니다.
- `DisplayNameStringIndex`: 심볼 표시 이름을 찾을 GameString 인덱스입니다.
- `RuntimeLabelStringIndex`: 런타임/디버그용 짧은 라벨을 찾을 GameString 인덱스입니다.
- `SymbolResourceRuid`: 일반 상태에서 표시할 기본 스프라이트 RUID입니다.
- `WinAnimationRuid`: 당첨 시 재생할 기본 스프라이트 애니메이션 RUID입니다.
- `WinAnimationEnumId`: 당첨 애니메이션 연출 타입입니다.
- `Rank`, `ThemeRole`, `IntendedRarity`: 기획 밸런싱 참고값입니다.

### Paytable

BaseBet 지역별 당첨 배당표입니다.

- `PaytableIndex`: 행 인덱스입니다.
- `BaseBetRegionIndex`: `BaseBetRegions.BaseBetRegionsIndex`를 참조합니다. 이 값으로 지역별 배당표를 분리합니다.
- `SymbolEnumId`: 배당을 받을 심볼입니다.
- `MatchCount`: 왼쪽부터 연속으로 맞아야 하는 개수입니다.
- `PayoutTenths`: 배당값을 10배 정수로 저장한 값입니다. 예: `4`는 `0.4배`입니다.
- `PayoutMultiplierX`: 사람이 읽기 쉬운 배당 표시값입니다. 런타임 계산에는 `PayoutTenths`를 사용합니다.
- `LineTypeEnumId`: 적용되는 페이라인 타입입니다.
- `Notes`: 기획 참고 메모입니다.

현재 런타임은 `BaseBetRegionIndex`를 기준으로 `paytableTenths[baseBetIndex][symbolId][matchCount]` 구조를 생성합니다. 따라서 BaseBet별로 같은 심볼이라도 다른 배당을 줄 수 있습니다.

### Paylines

페이라인 정의 테이블입니다.

- `PaylinesIndex`: 행 인덱스입니다.
- `LineTypeEnumId`: 페이라인 타입입니다.
- `StartRow`: 판정할 화면 행입니다. 현재 1, 2, 3행 가로 라인을 사용합니다.
- `StartColumn`: 시작 컬럼입니다.
- `RowPattern`: 기획 참고용 라인 패턴입니다.
- `IsEnabled`: 해당 라인을 사용할지 여부입니다.
- `CostCountsAsLine`: 비용에 이 라인을 추가로 반영할지 여부입니다. 현재는 false입니다.
- `Notes`: 기획 참고 메모입니다.

### Multipliers

Multiplier 선택지와 비용/보상 배율을 정의합니다.

- `MultipliersIndex`: 행 인덱스입니다.
- `MultiplierValue`: Spin 비용과 보상에 곱해지는 배율입니다.
- `DisplayTemplateStringIndex`: `x{0}` 같은 표시 포맷을 찾을 GameString 인덱스입니다.
- `CanChangeDuringSpin`: 릴 회전 중 변경 가능 여부입니다.

선택 색상, 비선택 색상 같은 UI 상태는 이 테이블에서 제거했습니다. 현재 Multiplier 버튼 색상은 UI 캔버스와 런타임 코드에서 직접 스위칭합니다.

### ScreenSprayVfx

화면 전체에 1회 재생할 슬롯 당첨 VFX 트리거를 정의합니다.

- `ScreenSprayVfxIndex`: 행 인덱스입니다.
- `TriggerKey`: 런타임에서 구분하는 트리거 키입니다.
- `AnimationClipRuid`: 전체 화면에 재생할 MSW animationclip RUID입니다.
- `MinFourPlusLineWins`: `MatchCount >= 4` 당첨 라인이 이 개수 이상이면 재생합니다.
- `MinFivePlusLineWins`: `MatchCount >= 5` 당첨 라인이 이 개수 이상이면 재생합니다.
- `PlayRate`: 애니메이션 재생 속도 배율입니다.
- `FallbackHideSeconds`: 1회 재생 후 숨김 처리하는 안전 지연 시간입니다.
- `Notes`: 기획 참고 메모입니다.

현재 기본값은 4개 이상 매치 당첨 라인 2개 이상 또는 5개 이상 매치 당첨 라인 1개 이상일 때 전체 화면 뿌리기 애니메이션을 1회 재생합니다.

## SpinPresentation.xlsx

### SpinProfiles

Spin 연출의 시간감 프로필입니다.

- `SpinProfilesIndex`: 행 인덱스입니다.
- `SpinProfileEnumId`: 연출 프로필 타입입니다.
- `WeightPercent`: 해당 프로필이 선택될 확률 가중치입니다.
- `OverallFeel`: 기획 참고용 연출 느낌입니다.
- `FirstReelMinSec`, `FirstReelMaxSec`: 첫 릴 최소/최대 정지 시간입니다.
- `StaggerMinSec`, `StaggerMaxSec`: 릴별 순차 정지 간격입니다.

### ReelMotionConfig

릴 이동 속도, 추가 루프, 가속/감속, 바운스 시간을 정의하는 가로형 Config 테이블입니다.

### ReelStrips

BaseBet 지역별 실제 릴 스트립과 셀 리소스를 정의합니다.

- `ReelStripsIndex`: 행 인덱스입니다.
- `BaseBetRegionIndex`: 지역별 릴 그룹 키입니다.
- `RegionName`: 기획 필터링용 지역명입니다.
- `ReelNo`: 몇 번째 릴인지 나타냅니다.
- `StopIndex`: 반복 릴 스트립 안에서의 위치입니다.
- `SymbolEnumId`: 해당 셀의 슬롯 심볼입니다.
- `IdleSpriteRuid`: 일반 상태에서 이 셀에 표시할 스프라이트 RUID입니다.
- `WinAnimationRuid`: 당첨 시 이 셀에서 재생할 스프라이트 애니메이션 RUID입니다.
- `WinAnimationEnumId`: 당첨 연출 타입입니다.
- `Notes`: 기획 참고 메모입니다.

현재 런타임은 `reelStripCellData[baseBetIndex][reelNo][stopIndex]` 구조를 생성합니다. 따라서 BaseBet별로 같은 심볼이라도 다른 정지 스프라이트와 당첨 애니메이션을 연결할 수 있습니다.

## UI.xlsx

### UIBindings

UI 노드와 런타임 스크립트 연결 상태를 추적하는 참고 테이블입니다.

- `UIBindingsIndex`: 행 인덱스입니다.
- `BindingKey`: 코드에서 쓰는 바인딩 키입니다.
- `UINode`: 연결 대상 UI 노드입니다.
- `Purpose`: 사용 목적입니다.
- `CurrentStatus`: 현재 연결 상태입니다.

## 데이터 변경 후 반영 순서

1. 엑셀에서 값을 수정합니다.
2. 테이블 구조 자체가 바뀌었거나 기본 테이블을 재생성해야 하면 `tools/build_slot_excel_tables.mjs`를 실행합니다. 이 스크립트는 기존 `SlotSymbols`, `ReelStrips`, `Paytable`의 주요 작업값을 보존하도록 구성되어 있습니다.
3. 런타임에 실제 반영하려면 `tools/apply_slot_excel_to_runtime.mjs`를 실행합니다.
4. 검증은 `tools/check_slot_rtp_simulator.cjs`와 `tools/validate_slot_ui_layers.cjs`로 확인합니다.

## BaseBet별 그룹 정책

- 지역별 릴 셀 데이터는 `SpinPresentation.xlsx/ReelStrips.BaseBetRegionIndex`로 분리합니다.
- 지역별 당첨 배당 데이터는 `SlotMachine.xlsx/Paytable.BaseBetRegionIndex`로 분리합니다.
- `SlotMachine.xlsx/SlotSymbols`는 전역 기본 심볼 정의입니다. 지역별로 실제 노출 리소스를 바꾸고 싶으면 `ReelStrips`의 `IdleSpriteRuid`, `WinAnimationRuid`, `WinAnimationEnumId`를 수정합니다.
