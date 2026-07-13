# 마일리지 코인 회전 애니메이션

## 리소스 구성

- 기준 코인 RUID: `e9c1cc8acd504e41b1cdd4492c2fc05b`
- 회전 레퍼런스 RUID: `b60c3cbbf52c40709f2fd886d98fe2d9`
- 신규 AnimationClip RUID: `464a7603c344480aaa3b085b81152cb8`
- 이름 / 분류: `mileage_coin_spin_4f_pixel` / `animationclip.item`

## 애니메이션 규격

- 캔버스: 프레임당 `32x32px`
- 프레임: 정면에 가까운 면 -> 사선 면 -> 반대 사선 면 -> 측면의 4단계
- 재생 간격: 프레임당 `150ms`
- 루프: 반복
- 피벗: 모든 프레임의 동일한 `32x32px` 캔버스 중앙
- 스케일링: 도트 경계를 보존하는 nearest-neighbor 방식

## 프레임 RUID

| 순서 | RUID |
| --- | --- |
| 1 | `4609ba14a7c94485bbe02523a3eb14c0` |
| 2 | `16a65f72df394312840b5f85f20b3959` |
| 3 | `f578d76998a94ea09f0481c7618caa07` |
| 4 | `ddbb88f3578b49afac3f517f84695191` |

## 생성 및 검증

ImageGen으로 기준 코인의 붉은색, 흰색 테두리, 중앙 `M` 문양을 유지한 4프레임 회전 시트를 생성했다. 레퍼런스의 프레임별 폭 변화와 도트 실루엣을 반영한 뒤 투명 배경으로 변환하고, `tools/build_mileage_coin_spin_animation.py`에서 프레임 폭 범위와 중앙 정렬을 검증한다.

MSW AnimationClip Editor에서 위 프레임을 순서대로 연결했으며 각 프레임 Delay를 `150ms`로 설정했다. 최종 RUID와 개별 프레임 RUID는 `GeneratedAssets/CoinAnimation/msw_resource_manifest.json`을 기준으로 사용한다.
