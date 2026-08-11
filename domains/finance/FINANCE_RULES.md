# Finance Rules — Canonical

1. Collected cash = payments actually recorded.
2. Expenses reduce collected cash for the selected month.
3. Net collected = collected cash - expenses.
4. Outstanding receivables never enter net collected.
5. Covered videos = floor(total paid / price per video).
6. Remaining paid videos = max(covered videos - delivered videos, 0).
7. Remaining paid value = remaining paid videos * price per video.
8. Delivered videos are never converted into money by themselves.
9. Multiple payments and deliveries are aggregated.
10. Every UI view must consume these results rather than implement its own formulas.
