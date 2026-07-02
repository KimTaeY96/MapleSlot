# Slot P0 Upgrade Plan

## Purpose
Convert the Cashman-style reference gap analysis into the first practical P0 upgrade scope for this MSW project.

This document is not a request to copy Cashman Casino. It defines which systems our project should build next using MSW-owned naming, resources, economy, and presentation.

## P0 Scope Summary
| Area | Current State | P0 Target | Owner |
|---|---|---|---|
| Visual reel | 3x5 visible reels | Keep 3x5 visual surface and evaluate 3 horizontal paylines only | Tech Director |
| RNG | Prototype local result generation | Prepare authoritative spin contract: cost, RNG, payout, reward grant | Tech Director |
| Reel strips | 30-cell UI strips exist | Move symbol order and stop weights into data tables | Planning Director + Tech Director |
| Payline | `MAIN_LINE` prototype | Enable `TOP_LINE`, `MAIN_LINE`, and `BOTTOM_LINE`; keep diagonal/V-shaped paylines out until P1 | Planning Director |
| Paytable | Five symbols, 3/4/5-kind payouts | Keep current table for prototype; make enum and Excel import structure production-ready | Planning Director |
| Economy | Premium first, Common fallback, Common rewards | Add Premium free replenishment loop: daily UTC grant plus idle RPG per-minute generation | Planning Director + Tech Director |
| Balance proof | Conservative simulator exists | Update simulator inputs to use reel-strip/payline/paytable data directly | Tech Director |
| Presentation | Reel movement and sequential stops implemented | Add win highlight/count-up/jackpot-ready presentation hooks after logic data contract is stable | Art Director + Tech Director |

## Approved Economy Direction
Premium Coin is not cash-only during P0.

The P0 free replenishment loop is:
1. Every day at UTC 00:00, grant a fixed amount of Premium Coin.
2. Later idle RPG content generates a small amount of Premium Coin every minute.
3. Slot cost consumes Premium Coin first.
4. If Premium Coin is insufficient, remaining cost can use Common Coin.
5. Slot winnings always pay Common Coin.

Open values to define in data:
| Value | Initial Direction |
|---|---|
| Daily Premium Coin grant amount | TBD |
| Per-minute idle Premium Coin generation | TBD |
| Offline accumulation | TBD |
| Premium Coin cap | TBD |
| Daily reset timezone | UTC 00:00 |
| Clock abuse handling | TBD |

## P0 Implementation Order
1. Data contract cleanup: Enums, ReelStrip, Payline, Paytable, SlotConfig, EconomyConfig.
2. Runtime result contract cleanup: selected bet, cost, stop indexes, visible 3x5 grid, line wins, payout, balance delta.
3. Simulator update: consume the same data shape as runtime.
4. Authoritative spin path design: validate, deduct, resolve, reward, return presentation result.
5. Prototype integration: keep current UI, replace hardcoded values with data-backed structures.

## Out Of P0
- Diagonal, V-shaped, or ways-style paylines beyond 3 horizontal rows.
- Wild, Scatter, Free Spin, Bonus Wheel, Jackpot Wheel.
- Real-money purchase behavior.
- Brand logo, mascot, specific slot IP name, and unique Cashman-style sound copying.

These can be added as separate specs after the P0 data and authority contracts are stable.
