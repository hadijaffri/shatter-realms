--!strict
-- ShatterRealms Luau Utilities
-- 6 useful modules for game development

------------------------------------------------------
-- 1. Cooldown Manager
--    Tracks ability/action cooldowns per player
------------------------------------------------------
local CooldownManager = {}
CooldownManager.__index = CooldownManager

type CooldownEntry = {
	endTime: number,
}

function CooldownManager.new()
	local self = setmetatable({}, CooldownManager)
	self._cooldowns = {} :: { [string]: { [string]: CooldownEntry } }
	return self
end

function CooldownManager:start(playerId: string, abilityName: string, duration: number)
	if not self._cooldowns[playerId] then
		self._cooldowns[playerId] = {}
	end
	self._cooldowns[playerId][abilityName] = {
		endTime = os.clock() + duration,
	}
end

function CooldownManager:isReady(playerId: string, abilityName: string): boolean
	local playerCooldowns = self._cooldowns[playerId]
	if not playerCooldowns then
		return true
	end
	local entry = playerCooldowns[abilityName]
	if not entry then
		return true
	end
	return os.clock() >= entry.endTime
end

function CooldownManager:remaining(playerId: string, abilityName: string): number
	local playerCooldowns = self._cooldowns[playerId]
	if not playerCooldowns then
		return 0
	end
	local entry = playerCooldowns[abilityName]
	if not entry then
		return 0
	end
	return math.max(0, entry.endTime - os.clock())
end

function CooldownManager:clearPlayer(playerId: string)
	self._cooldowns[playerId] = nil
end

------------------------------------------------------
-- 2. Weighted Loot Table
--    Roll random items with configurable weights/rarity
------------------------------------------------------
local LootTable = {}
LootTable.__index = LootTable

export type LootEntry = {
	name: string,
	weight: number,
	rarity: string,
	minLevel: number?,
}

function LootTable.new(entries: { LootEntry })
	local self = setmetatable({}, LootTable)
	self._entries = entries
	return self
end

function LootTable:roll(playerLevel: number?): LootEntry?
	local level = playerLevel or 1
	local eligible: { LootEntry } = {}
	local totalWeight = 0

	for _, entry in self._entries do
		if not entry.minLevel or level >= entry.minLevel then
			table.insert(eligible, entry)
			totalWeight += entry.weight
		end
	end

	if totalWeight == 0 then
		return nil
	end

	local roll = math.random() * totalWeight
	local cumulative = 0
	for _, entry in eligible do
		cumulative += entry.weight
		if roll <= cumulative then
			return entry
		end
	end

	return eligible[#eligible]
end

function LootTable:rollMultiple(count: number, playerLevel: number?): { LootEntry }
	local results: { LootEntry } = {}
	for _ = 1, count do
		local item = self:roll(playerLevel)
		if item then
			table.insert(results, item)
		end
	end
	return results
end

------------------------------------------------------
-- 3. Wave Spawner
--    Manages enemy wave progression for dungeon crawling
------------------------------------------------------
local WaveSpawner = {}
WaveSpawner.__index = WaveSpawner

export type WaveConfig = {
	baseEnemyCount: number,
	enemiesPerWave: number,
	healthScaling: number,
	damageScaling: number,
	restTimeBetweenWaves: number,
}

function WaveSpawner.new(config: WaveConfig?)
	local self = setmetatable({}, WaveSpawner)
	local c = config or {}
	self.baseEnemyCount = c.baseEnemyCount or 3
	self.enemiesPerWave = c.enemiesPerWave or 2
	self.healthScaling = c.healthScaling or 1.15
	self.damageScaling = c.damageScaling or 1.10
	self.restTime = c.restTimeBetweenWaves or 5
	self.currentWave = 0
	self.activeEnemies = 0
	self.totalKills = 0
	return self
end

function WaveSpawner:getEnemyCount(): number
	return self.baseEnemyCount + (self.currentWave * self.enemiesPerWave)
end

function WaveSpawner:getHealthMultiplier(): number
	return self.healthScaling ^ self.currentWave
end

function WaveSpawner:getDamageMultiplier(): number
	return self.damageScaling ^ self.currentWave
end

function WaveSpawner:startNextWave(): { enemyCount: number, healthMult: number, damageMult: number, wave: number }
	self.currentWave += 1
	local count = self:getEnemyCount()
	self.activeEnemies = count
	return {
		wave = self.currentWave,
		enemyCount = count,
		healthMult = self:getHealthMultiplier(),
		damageMult = self:getDamageMultiplier(),
	}
end

function WaveSpawner:onEnemyKilled()
	self.activeEnemies = math.max(0, self.activeEnemies - 1)
	self.totalKills += 1
end

function WaveSpawner:isWaveComplete(): boolean
	return self.activeEnemies <= 0 and self.currentWave > 0
end

function WaveSpawner:reset()
	self.currentWave = 0
	self.activeEnemies = 0
	self.totalKills = 0
end

------------------------------------------------------
-- 4. Spatial Grid
--    Fast 2D spatial lookup for nearby entity queries
------------------------------------------------------
local SpatialGrid = {}
SpatialGrid.__index = SpatialGrid

function SpatialGrid.new(cellSize: number)
	local self = setmetatable({}, SpatialGrid)
	self._cellSize = cellSize
	self._cells = {} :: { [string]: { any } }
	return self
end

function SpatialGrid:_key(cx: number, cz: number): string
	return cx .. "," .. cz
end

function SpatialGrid:_cellCoords(x: number, z: number): (number, number)
	return math.floor(x / self._cellSize), math.floor(z / self._cellSize)
end

function SpatialGrid:insert(entity: any, x: number, z: number)
	local cx, cz = self:_cellCoords(x, z)
	local key = self:_key(cx, cz)
	if not self._cells[key] then
		self._cells[key] = {}
	end
	table.insert(self._cells[key], entity)
end

function SpatialGrid:queryRadius(x: number, z: number, radius: number): { any }
	local results = {}
	local minCx, minCz = self:_cellCoords(x - radius, z - radius)
	local maxCx, maxCz = self:_cellCoords(x + radius, z + radius)

	for cx = minCx, maxCx do
		for cz = minCz, maxCz do
			local key = self:_key(cx, cz)
			local cell = self._cells[key]
			if cell then
				for _, entity in cell do
					table.insert(results, entity)
				end
			end
		end
	end
	return results
end

function SpatialGrid:clear()
	table.clear(self._cells)
end

------------------------------------------------------
-- 5. Status Effect Tracker
--    Apply/remove/tick timed buffs and debuffs
------------------------------------------------------
local StatusEffects = {}
StatusEffects.__index = StatusEffects

export type StatusEffect = {
	name: string,
	duration: number,
	startTime: number,
	stacks: number,
	tickInterval: number?,
	lastTick: number?,
	onApply: ((target: any) -> ())?,
	onTick: ((target: any, stacks: number) -> ())?,
	onExpire: ((target: any) -> ())?,
}

function StatusEffects.new()
	local self = setmetatable({}, StatusEffects)
	self._effects = {} :: { [any]: { StatusEffect } }
	return self
end

function StatusEffects:apply(target: any, effect: StatusEffect)
	if not self._effects[target] then
		self._effects[target] = {}
	end

	-- Stack or refresh existing
	for _, existing in self._effects[target] do
		if existing.name == effect.name then
			existing.stacks += 1
			existing.startTime = os.clock()
			existing.duration = effect.duration
			return
		end
	end

	effect.startTime = os.clock()
	effect.stacks = effect.stacks or 1
	effect.lastTick = os.clock()
	table.insert(self._effects[target], effect)

	if effect.onApply then
		effect.onApply(target)
	end
end

function StatusEffects:update(dt: number)
	local now = os.clock()
	for target, effects in self._effects do
		local i = 1
		while i <= #effects do
			local fx = effects[i]
			local elapsed = now - fx.startTime

			-- Tick
			if fx.tickInterval and fx.onTick and fx.lastTick then
				if now - fx.lastTick >= fx.tickInterval then
					fx.onTick(target, fx.stacks)
					fx.lastTick = now
				end
			end

			-- Expire
			if elapsed >= fx.duration then
				if fx.onExpire then
					fx.onExpire(target)
				end
				table.remove(effects, i)
			else
				i += 1
			end
		end

		if #effects == 0 then
			self._effects[target] = nil
		end
	end
end

function StatusEffects:has(target: any, effectName: string): boolean
	local effects = self._effects[target]
	if not effects then
		return false
	end
	for _, fx in effects do
		if fx.name == effectName then
			return true
		end
	end
	return false
end

function StatusEffects:remove(target: any, effectName: string)
	local effects = self._effects[target]
	if not effects then
		return
	end
	for i, fx in effects do
		if fx.name == effectName then
			if fx.onExpire then
				fx.onExpire(target)
			end
			table.remove(effects, i)
			return
		end
	end
end

function StatusEffects:clearTarget(target: any)
	self._effects[target] = nil
end

------------------------------------------------------
-- 6. Damage Calculator
--    Handles damage formulas, crits, armor, and types
------------------------------------------------------
local DamageCalc = {}

export type DamageInput = {
	baseDamage: number,
	attackPower: number?,
	defense: number?,
	armor: number?,
	critChance: number?,
	critMultiplier: number?,
	damageType: string?,
	resistances: { [string]: number }?,
	level: number?,
	targetLevel: number?,
}

export type DamageResult = {
	finalDamage: number,
	isCrit: boolean,
	mitigated: number,
	damageType: string,
}

function DamageCalc.calculate(input: DamageInput): DamageResult
	local base = input.baseDamage + (input.attackPower or 0) * 0.5
	local damageType = input.damageType or "physical"

	-- Level scaling
	local levelDiff = (input.level or 1) - (input.targetLevel or 1)
	local levelMod = 1 + (levelDiff * 0.02)
	levelMod = math.clamp(levelMod, 0.5, 1.5)
	base *= levelMod

	-- Crit roll
	local isCrit = false
	local critChance = input.critChance or 0.05
	if math.random() < critChance then
		isCrit = true
		base *= (input.critMultiplier or 2.0)
	end

	-- Armor mitigation (physical only)
	local mitigated = 0
	if damageType == "physical" then
		local armor = input.armor or 0
		local reduction = armor / (armor + 100)
		mitigated = base * reduction
		base -= mitigated
	end

	-- Defense flat reduction
	local defense = input.defense or 0
	local defReduction = math.min(defense * 0.8, base * 0.5)
	mitigated += defReduction
	base -= defReduction

	-- Elemental resistance
	if input.resistances then
		local resist = input.resistances[damageType] or 0
		local resistReduction = base * math.clamp(resist, -0.5, 0.75)
		mitigated += resistReduction
		base -= resistReduction
	end

	-- Minimum 1 damage
	base = math.max(1, math.floor(base))

	return {
		finalDamage = base,
		isCrit = isCrit,
		mitigated = math.floor(mitigated),
		damageType = damageType,
	}
end

------------------------------------------------------
-- Module exports
------------------------------------------------------
return {
	CooldownManager = CooldownManager,
	LootTable = LootTable,
	WaveSpawner = WaveSpawner,
	SpatialGrid = SpatialGrid,
	StatusEffects = StatusEffects,
	DamageCalc = DamageCalc,
}
