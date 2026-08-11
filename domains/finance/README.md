# Finance Domain

Finance owns financial calculations and financial records.

It must not:
- read DOM elements,
- calculate from formatted UI text,
- mutate another domain's internal state directly,
- decide authentication/authorization.

Current foundation calculation:
coveredVideos = floor(totalPaid / pricePerVideo)
remainingPaidVideos = max(coveredVideos - deliveredVideos, 0)
remainingPaidValue = remainingPaidVideos * pricePerVideo

Future outstanding receivables are separate from collected cash.
