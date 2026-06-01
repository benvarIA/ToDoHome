interface RoomPieDatum {
  id: string
  name: string
  value: number
  color: string
}

interface RoomPieChartProps {
  data: RoomPieDatum[]
}

const polar = (cx: number, cy: number, radius: number, angle: number) => {
  const rad = (angle - 90) * (Math.PI / 180)
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

const arcPath = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polar(cx, cy, radius, endAngle)
  const end = polar(cx, cy, radius, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
}

export const RoomPieChart = ({ data }: RoomPieChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let angle = 0

  return (
    <section className="house-pie">
      <h3>Répartition des tâches par pièce</h3>
      <div className="house-pie__content">
        <svg viewBox="0 0 220 220" className="house-pie__svg" role="img" aria-label="Camembert des pièces">
          {total > 0 ? (
            data
              .filter((item) => item.value > 0)
              .map((item) => {
                const portion = (item.value / total) * 360
                const start = angle
                const end = angle + portion
                angle = end
                return <path key={item.id} d={arcPath(110, 110, 92, start, end)} fill={item.color} />
              })
          ) : (
            <circle cx="110" cy="110" r="92" fill="#e5e7eb" />
          )}
          <circle cx="110" cy="110" r="48" fill="#fff" />
          <text x="110" y="105" textAnchor="middle" className="house-pie__total-label">
            Total
          </text>
          <text x="110" y="125" textAnchor="middle" className="house-pie__total-value">
            {total}
          </text>
        </svg>
        <div className="house-pie__legend">
          {data.map((item) => {
            const percent = total > 0 ? Math.round((item.value / total) * 100) : 0
            return (
              <div key={item.id} className="house-pie__legend-item">
                <span className="house-pie__dot" style={{ background: item.color }} />
                <span>{item.name}</span>
                <strong>{percent}%</strong>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
