# Slot Deepening Plan

## Purpose
Define the current Phase1 scope for slot machine deepening after the Phase0 prototype.

This document replaces older ambiguous phase labels. In the current user-approved naming, Phase1 means slot machine deepening, not combat/map harness work.

## Phase Boundary
| Area | Phase0 Status | Phase1 Direction |
|---|---|---|
| Visual reel | 3 rows x 5 reels with physical strip movement | Keep surface stable; add stronger win and payout presentation hooks |
| Paylines | 3 fixed horizontal paylines | Keep 3 horizontal lines as the default; design diagonal/V-shaped lines only as a gated expansion |
| RNG / result | Local prototype result generation | Prepare data-backed and authority-ready spin result contract |
| Reel strips | Runtime contains explicit 30-cell strips | Move strip definitions and stop assumptions toward Excel/data-backed source |
| Paytable | Five base symbols, 3/4/5-of-kind payouts | Retune only after simulator candidates are reviewed |
| RTP proof | Simulator exists and validates 3 horizontal paylines | Add candidate weight/reel-strip sets and pick a target RTP band |
| Economy | Premium-first spend, Common reward | Keep rules; define daily Premium grant and later idle Premium generation as data |
| Presentation | Sequential reel stops and basic highlight surface | Add win highlight, payout count-up, and jackpot-ready event hooks |
| Bonus systems | Not enabled | Plan Wild/Scatter/Free Spin/Bonus/Jackpot as future modules, not immediate runtime behavior |

## Phase1 Implementation Order
1. Data contract cleanup: ensure Excel tables, runtime tables, and simulator tables use the same enum IDs and names. **Done for current prototype symbols on 2026-06-21.**
2. Runtime config extraction: isolate Base Bet catalog, multipliers, paylines, paytable, reel strips, spin profiles, and economy constants into clear config builders. **Initial runtime extraction done on 2026-06-21.**
3. Simulator alignment: make simulator validation names and cost rules match runtime exactly. **Done on 2026-07-01; simulator now reads current Excel symbols/paylines/paytable/reel strips and uses `BaseBet * Multiplier`.**
4. RTP candidate pass: test 2-3 candidate reel/weight sets and report RTP, hit rate, multi-line win rate, and max payout multiple. **Initial pass done on 2026-07-01; current explicit reel strips sit around 70.5%-75.6% RTP with ~22% hit rate.**
5. Presentation hook pass: expose line-win data for UI highlight, payout count-up, and jackpot-ready events.
6. Feature gate pass: enable `WILD` as a substitute-only symbol, then document and stub disabled future systems (`SCATTER`, `FREE_SPIN`, `BONUS_WHEEL`, `JACKPOT_WHEEL`) without enabling their payouts.

## Phase1 Non-Goals
- Combat map or idle auto-battle implementation.
- Shop, equipment, item progression, or monster balance.
- Real-money purchase behavior.
- Copying external slot IP, brand logos, mascot characters, or unique sounds.
- Replacing the approved imagegen-based integrated slot cabinet without user approval.

## First Implementation Slice
The first Phase1 slice should focus on hardening the existing slot runtime rather than adding a large new feature.

| Task | Owner | Output |
|---|---|---|
| Resolve stale phase wording and cost-rule contradictions | Main Agent / PM | Done on 2026-06-21 |
| Normalize symbol IDs between runtime (`MUSH`, `DRGN`) and design data (`MUSHROOM`, `DRAGON`) | 테크 디렉터 | Done on 2026-06-21; runtime now uses canonical IDs |
| Keep three-horizontal-line payout math and single-spin cost math consistent | 테크 디렉터 | Updated on 2026-06-28; paylines affect payout evaluation, not spend amount |
| Define RTP candidate target bands | 기획 디렉터 | Done on 2026-06-21; see `Slot_RTP_Candidates.md` |
| Identify win presentation nodes/hooks | 아트 디렉터 UI lane + 테크 디렉터 | Done on 2026-06-21; see `Slot_Win_Presentation.md` |
| Extract runtime prototype config builders | 테크 디렉터 | Done on 2026-06-21; runtime now has `Build*` config methods |

## Design Decisions Locked For Now
- Phase1 starts from the approved 3x5 visual slot surface.
- `TOP_LINE`, `MAIN_LINE`, and `BOTTOM_LINE` remain enabled by default.
- A payline win must start at column 1 and continue left-to-right.
- Spin cost remains `BaseBet * Multiplier`.
- Active paylines affect payout evaluation only; they do not multiply spin cost.
- Each winning line payout remains `BaseBet * Multiplier * paytableMultiplier`.
- Slot rewards pay Common Coin only.
- Premium Coin is consumed before Common Coin.
- Multiplier changes cost and payout equally, so it should not change RTP.

## Open Decisions
| Topic | Default Proposal | Why It Matters |
|---|---|---|
| Target RTP band | Keep the current explicit-strip lane around 70%-85% for prototype feel, then retune after combat/shop income exists | Current Excel reel strips are now in this band; final economy still needs Common Coin sinks |
| Symbol generation model | Use explicit per-reel strips for runtime; simulator may support weighted shorthand that expands into strips | Physical strips match the visual reel concept and future stop control |
| Base Bet lock during QA | Keep UI field, but allow test bypass until balance QA stabilizes | 300-second lock slows iteration |
| Wild/Scatter timing | Wild substitute behavior is enabled in the first Phase1 slice; Scatter, Free Spin, Bonus Wheel, and Jackpot remain planned stubs | Keeps RTP changes contained while proving the extensible symbol contract |
| Common Coin decimal display | Keep scaled integer internals; decide final display after paytable retune | Prevents rounding abuse while design is still moving |

## Agent Routing
| Agent | Read These Docs | Do Not Read Unless Asked |
|---|---|---|
| 기획 디렉터 | `Slot_Deepening_Plan.md`, `Slot_Symbols_Paytable.md`, `Slot_RTP_Simulator_Handoff.md` | Combat map docs, UI resource search notes |
| 테크 디렉터 | `Slot_Deepening_Plan.md`, `Slot_Machine_Runtime.md`, `Slot_RTP_Simulator_Handoff.md`, Excel table files | Combat map docs |
| 아트 디렉터 / UI lane | `Slot_Deepening_Plan.md`, `UI_Canvas_TestSandbox_Assembly.md`, `Slot_Machine_Runtime.md` UI binding section | Combat map docs, RTP internals unless a UI state needs it |
| 아트 디렉터 / UI lane + 테크 디렉터 | `Slot_Win_Presentation.md` | Combat map docs |

## Acceptance Criteria For First Slice
- Planning docs no longer describe the current Phase1 as combat harness work.
- Runtime, simulator, and docs agree that 3 horizontal paylines are active.
- Runtime and simulator agree on spin cost: `BaseBet * Multiplier`.
- Symbol ID naming mismatch is either removed or explicitly bridged.
- Next implementation task can be assigned without re-reading unrelated combat documents.
