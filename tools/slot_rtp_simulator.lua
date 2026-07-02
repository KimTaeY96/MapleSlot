local SlotRtpSimulator = {}

SlotRtpSimulator.symbols = { "SLIME", "MUSHROOM", "PIG", "GOLEM", "PINK_BEAN", "WILD" }
SlotRtpSimulator.wildSymbolId = "WILD"
SlotRtpSimulator.coinUnitPerCoin = 10

SlotRtpSimulator.paylines = {
    TOP_LINE = { row = 1, columns = { 1, 2, 3, 4, 5 } },
    MAIN_LINE = { row = 2, columns = { 1, 2, 3, 4, 5 } },
    BOTTOM_LINE = { row = 3, columns = { 1, 2, 3, 4, 5 } },
}

SlotRtpSimulator.paylineOrder = {
    "TOP_LINE",
    "MAIN_LINE",
    "BOTTOM_LINE",
}

-- Payouts use tenths of Base Bet. Example: 0.4x = 4, 100.0x = 1000.
SlotRtpSimulator.paytableTenths = {
    SLIME = { [3] = 4, [4] = 12, [5] = 40 },
    MUSHROOM = { [3] = 6, [4] = 18, [5] = 70 },
    PIG = { [3] = 10, [4] = 30, [5] = 120 },
    GOLEM = { [3] = 18, [4] = 60, [5] = 300 },
    PINK_BEAN = { [3] = 40, [4] = 150, [5] = 1000 },
}

local function makeRng(seed)
    local state = seed or 123456789
    if state <= 0 then
        state = 123456789
    end
    return function()
        state = (state * 16807) % 2147483647
        return (state - 1) / 2147483646
    end
end

local function normalizeWeights(symbols, weights)
    local total = 0
    local normalized = {}

    for _, symbol in ipairs(symbols) do
        local weight = weights[symbol]
        assert(type(weight) == "number" and weight >= 0, "Invalid weight for " .. symbol)
        total = total + weight
        normalized[#normalized + 1] = { symbol = symbol, weight = weight }
    end

    assert(total > 0, "Total symbol weight must be greater than 0")
    return normalized, total
end

function SlotRtpSimulator.isWildSymbol(config, symbolId)
    return symbolId == (config.wildSymbolId or SlotRtpSimulator.wildSymbolId)
end

function SlotRtpSimulator.sampleSymbol(symbols, weights, rng)
    local normalized, total = normalizeWeights(symbols, weights)
    local roll = rng() * total
    local cursor = 0

    for _, entry in ipairs(normalized) do
        cursor = cursor + entry.weight
        if roll < cursor then
            return entry.symbol
        end
    end

    return normalized[#normalized].symbol
end

function SlotRtpSimulator.spinGrid(config, rng)
    local grid = { {}, {}, {} }
    for row = 1, 3 do
        for col = 1, 5 do
            grid[row][col] = SlotRtpSimulator.sampleSymbol(config.symbols, config.weights, rng)
        end
    end
    return grid
end

function SlotRtpSimulator.evaluateLine(grid, line, config)
    local row = grid[line.row]
    local targetSymbol = nil
    local runLength = 0
    local matchedCells = {}

    for _, col in ipairs(line.columns) do
        local currentSymbol = row[col]
        if SlotRtpSimulator.isWildSymbol(config, currentSymbol) then
            runLength = runLength + 1
            matchedCells[runLength] = currentSymbol
        elseif targetSymbol == nil then
            targetSymbol = currentSymbol
            runLength = runLength + 1
            matchedCells[runLength] = currentSymbol
        elseif currentSymbol == targetSymbol then
            runLength = runLength + 1
            matchedCells[runLength] = currentSymbol
        else
            break
        end
    end

    local payoutTenths = 0
    if targetSymbol ~= nil and runLength >= 3 and config.paytableTenths[targetSymbol] ~= nil then
        payoutTenths = config.paytableTenths[targetSymbol][runLength] or 0
    end

    return {
        symbol = targetSymbol,
        runLength = runLength,
        cells = matchedCells,
        payoutTenths = payoutTenths,
    }
end

function SlotRtpSimulator.evaluateSpin(grid, config)
    local totalTenths = 0
    local wins = {}

    for _, lineId in ipairs(config.paylineOrder) do
        local result = SlotRtpSimulator.evaluateLine(grid, config.paylines[lineId], config)
        if result.payoutTenths > 0 then
            totalTenths = totalTenths + result.payoutTenths
            wins[#wins + 1] = {
                lineId = lineId,
                symbol = result.symbol,
                runLength = result.runLength,
                payoutTenths = result.payoutTenths,
            }
        end
    end

    return {
        payoutTenths = totalTenths,
        wins = wins,
    }
end

function SlotRtpSimulator.defaultConfig(overrides)
    overrides = overrides or {}
    local paylineOrder = overrides.paylineOrder or SlotRtpSimulator.paylineOrder
    return {
        symbols = overrides.symbols or SlotRtpSimulator.symbols,
        weights = overrides.weights or {
            SLIME = 20,
            MUSHROOM = 20,
            PIG = 20,
            GOLEM = 20,
            PINK_BEAN = 20,
            WILD = 20,
        },
        paylines = overrides.paylines or SlotRtpSimulator.paylines,
        paylineOrder = paylineOrder,
        activePaylineCount = overrides.activePaylineCount or #paylineOrder,
        paytableTenths = overrides.paytableTenths or SlotRtpSimulator.paytableTenths,
        wildSymbolId = overrides.wildSymbolId or SlotRtpSimulator.wildSymbolId,
        coinUnitPerCoin = overrides.coinUnitPerCoin or SlotRtpSimulator.coinUnitPerCoin,
        baseBetCost = overrides.baseBetCost or 10,
        multiplier = overrides.multiplier or 1,
        spinCount = overrides.spinCount or 100000,
        seed = overrides.seed or 123456789,
    }
end

function SlotRtpSimulator.simulate(overrides)
    local config = SlotRtpSimulator.defaultConfig(overrides)
    local rng = makeRng(config.seed)
    local totalCostScaled = 0
    local totalPayoutScaled = 0
    local hitCount = 0
    local multiLineHitCount = 0
    local maxPayoutTenths = 0
    local bySymbol = {}
    local byLine = {}
    local distribution = {}

    for _, symbol in ipairs(config.symbols) do
        bySymbol[symbol] = 0
    end
    for _, lineId in ipairs(config.paylineOrder) do
        byLine[lineId] = 0
    end

    for _ = 1, config.spinCount do
        local grid = SlotRtpSimulator.spinGrid(config, rng)
        local result = SlotRtpSimulator.evaluateSpin(grid, config)
        local payoutScaled = result.payoutTenths * config.baseBetCost * config.multiplier
        local costScaled = config.baseBetCost * config.multiplier * config.coinUnitPerCoin

        totalCostScaled = totalCostScaled + costScaled
        totalPayoutScaled = totalPayoutScaled + payoutScaled
        maxPayoutTenths = math.max(maxPayoutTenths, result.payoutTenths)
        distribution[result.payoutTenths] = (distribution[result.payoutTenths] or 0) + 1

        if result.payoutTenths > 0 then
            hitCount = hitCount + 1
        end
        if #result.wins > 1 then
            multiLineHitCount = multiLineHitCount + 1
        end
        for _, win in ipairs(result.wins) do
            bySymbol[win.symbol] = (bySymbol[win.symbol] or 0) + win.payoutTenths
            byLine[win.lineId] = byLine[win.lineId] + win.payoutTenths
        end
    end

    return {
        totalSpins = config.spinCount,
        activePaylineCount = config.activePaylineCount,
        totalCostScaled = totalCostScaled,
        totalPayoutScaled = totalPayoutScaled,
        rtp = totalPayoutScaled / totalCostScaled,
        hitRate = hitCount / config.spinCount,
        multiLineWinRate = multiLineHitCount / config.spinCount,
        maxPayoutMultiple = maxPayoutTenths / config.coinUnitPerCoin,
        bySymbolTenths = bySymbol,
        byLineTenths = byLine,
        distributionTenths = distribution,
    }
end

return SlotRtpSimulator
