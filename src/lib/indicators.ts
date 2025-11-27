/**
 * 技术指标计算库
 */

/**
 * 计算简单移动平均线 (SMA)
 * @param data 数据数组
 * @param period 周期
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
  const sma: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null)
      continue
    }
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j]
    }
    sma.push(sum / period)
  }
  return sma
}

/**
 * 计算指数移动平均线 (EMA)
 * @param data 数据数组
 * @param period 周期
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
  const ema: (number | null)[] = []
  const k = 2 / (period + 1)
  
  let firstSMA = 0
  for (let i = 0; i < period; i++) {
    firstSMA += data[i]
  }
  firstSMA /= period
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(null)
    } else if (i === period - 1) {
      ema.push(firstSMA)
    } else {
      const prevEMA = ema[i - 1] as number
      ema.push((data[i] - prevEMA) * k + prevEMA)
    }
  }
  return ema
}

/**
 * 计算 RSI (相对强弱指标)
 * @param data 数据数组
 * @param period 周期 (默认 14)
 */
export function calculateRSI(data: number[], period: number = 14): (number | null)[] {
  const rsi: (number | null)[] = []
  const changes: number[] = []
  
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1])
  }
  
  if (data.length <= period) {
    return new Array(data.length).fill(null)
  }

  // 初始平均增益和损失
  let avgGain = 0
  let avgLoss = 0
  
  for (let i = 0; i < period; i++) {
    const change = changes[i]
    if (change > 0) avgGain += change
    else avgLoss += Math.abs(change)
  }
  
  avgGain /= period
  avgLoss /= period
  
  // 前 period 个点为 null (实际上是 period + 1 个点，因为第一个点没有 change)
  for (let i = 0; i < period; i++) {
    rsi.push(null)
  }
  
  // 计算第一个 RSI
  let rs = avgGain / avgLoss
  rsi.push(100 - (100 / (1 + rs)))
  
  // 后续计算
  for (let i = period; i < changes.length; i++) {
    const change = changes[i]
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? Math.abs(change) : 0
    
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    
    if (avgLoss === 0) {
      rsi.push(100)
    } else {
      rs = avgGain / avgLoss
      rsi.push(100 - (100 / (1 + rs)))
    }
  }
  
  // 补齐第一个点（因为 changes 少一个）
  rsi.unshift(null)
  
  return rsi
}

/**
 * 计算 MACD (平滑异同移动平均线)
 * @param data 数据数组
 * @param fastPeriod 快线周期 (默认 12)
 * @param slowPeriod 慢线周期 (默认 26)
 * @param signalPeriod 信号线周期 (默认 9)
 */
export function calculateMACD(
  data: number[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9
): { histogram: (number | null)[], macd: (number | null)[], signal: (number | null)[] } {
  const fastEMA = calculateEMA(data, fastPeriod)
  const slowEMA = calculateEMA(data, slowPeriod)
  
  const macdLine: (number | null)[] = []
  const validMACDPoints: number[] = []
  const validMACDIndices: number[] = []

  for (let i = 0; i < data.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      const val = (fastEMA[i] as number) - (slowEMA[i] as number)
      macdLine.push(val)
      validMACDPoints.push(val)
      validMACDIndices.push(i)
    } else {
      macdLine.push(null)
    }
  }
  
  const signalLineFull: (number | null)[] = new Array(data.length).fill(null)
  const signalPoints = calculateEMA(validMACDPoints, signalPeriod)
  
  validMACDIndices.forEach((originalIndex, i) => {
    signalLineFull[originalIndex] = signalPoints[i]
  })
  
  const histogram: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] !== null && signalLineFull[i] !== null) {
      histogram.push((macdLine[i] as number) - (signalLineFull[i] as number))
    } else {
      histogram.push(null)
    }
  }
  
  return {
    macd: macdLine,
    signal: signalLineFull,
    histogram
  }
}

