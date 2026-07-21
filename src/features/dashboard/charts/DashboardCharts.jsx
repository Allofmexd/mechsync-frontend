import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  formatMoney,
  formatMonth,
  formatNumber,
  formatQuantity,
} from '../adminDashboardUtils';

const STATUS_COLORS = ['#ac001e', '#d97706', '#2563eb', '#15803d', '#6b7280', '#7c3aed'];

function ChartPanel({ id, title, description, empty, children, table }) {
  return (
    <article className="admin-dashboard-chart" aria-labelledby={`${id}-title`}>
      <header>
        <h2 id={`${id}-title`}>{title}</h2>
        <p id={`${id}-description`}>{description}</p>
      </header>
      {empty ? (
        <div className="admin-dashboard-chart__empty" role="status">
          No hay datos para el periodo seleccionado.
        </div>
      ) : (
        <>
          <div
            className="admin-dashboard-chart__visual"
            role="img"
            aria-labelledby={`${id}-title ${id}-description`}
          >
            {children}
          </div>
          <div className="admin-dashboard-chart__table">{table}</div>
        </>
      )}
    </article>
  );
}

function StatusTable({ caption, rows }) {
  return (
    <table>
      <caption>{caption}</caption>
      <thead><tr><th scope="col">Estado</th><th scope="col">Cantidad</th></tr></thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.statusCode}>
            <th scope="row">{row.statusName}</th>
            <td>{formatNumber(row.count)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function WorkOrdersStatusChart({ data }) {
  const hasData = data.some((item) => Number(item.count) > 0);
  return (
    <ChartPanel
      id="work-orders-status"
      title="Work Orders por estado"
      description="Órdenes registradas durante el periodo, agrupadas por su estado actual."
      empty={!hasData}
      table={<StatusTable caption="Desglose de Work Orders por estado" rows={data} />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart accessibilityLayer>
          <Pie
            data={data.filter((item) => Number(item.count) > 0)}
            dataKey="count"
            nameKey="statusName"
            innerRadius="48%"
            outerRadius="74%"
            paddingAngle={2}
            isAnimationActive={false}
          >
            {data.filter((item) => Number(item.count) > 0).map((item, index) => (
              <Cell key={item.statusCode} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [formatNumber(value), 'Órdenes']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function JobsStatusChart({ data }) {
  const hasData = data.some((item) => Number(item.count) > 0);
  return (
    <ChartPanel
      id="jobs-status"
      title="Jobs por estado"
      description="Trabajos creados durante el periodo y su estado operativo actual."
      empty={!hasData}
      table={<StatusTable caption="Desglose de Jobs por estado" rows={data} />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} accessibilityLayer margin={{ top: 8, right: 10, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="statusName" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} width={36} />
          <Tooltip formatter={(value) => [formatNumber(value), 'Jobs']} />
          <Bar dataKey="count" name="Jobs" fill="#2563eb" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function RevenueChart({ data }) {
  return (
    <ChartPanel
      id="revenue-month"
      title="Ingresos por mes"
      description="Totales finales de reportes entregados, agrupados por mes de entrega."
      empty={data.length === 0}
      table={(
        <table>
          <caption>Ingresos mensuales en MXN</caption>
          <thead><tr><th scope="col">Mes</th><th scope="col">Ingreso</th></tr></thead>
          <tbody>{data.map((item) => (
            <tr key={item.period}><th scope="row">{formatMonth(item.period)}</th><td>{formatMoney(item.total)}</td></tr>
          ))}</tbody>
        </table>
      )}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} accessibilityLayer margin={{ top: 10, right: 18, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="period" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(value) => `$${formatNumber(value)}`} width={76} />
          <Tooltip labelFormatter={formatMonth} formatter={(value) => [formatMoney(value), 'Ingresos']} />
          <Line
            type="monotone"
            dataKey="total"
            name="Ingresos"
            stroke="#15803d"
            strokeWidth={3}
            dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function TopServicesChart({ data }) {
  return (
    <ChartPanel
      id="top-services"
      title="Servicios más realizados"
      description="Top 5 por suma de cantidad en Jobs completados durante el periodo."
      empty={data.length === 0}
      table={(
        <table>
          <caption>Servicios más realizados</caption>
          <thead><tr><th scope="col">Servicio</th><th scope="col">Cantidad</th></tr></thead>
          <tbody>{data.map((item) => (
            <tr key={item.serviceId}><th scope="row">{item.serviceName}</th><td>{formatQuantity(item.quantity)}</td></tr>
          ))}</tbody>
        </table>
      )}
    >
      <div className="admin-dashboard-chart__wide-content">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" accessibilityLayer margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="serviceName" width={145} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(value) => [formatQuantity(value), 'Cantidad']} />
            <Bar dataKey="quantity" name="Cantidad" fill="#d97706" radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartPanel>
  );
}

export function TechnicianWorkloadChart({ data }) {
  const hasData = data.some((item) => Number(item.totalJobs) > 0);
  const minWidth = Math.max(620, data.length * 105);
  return (
    <ChartPanel
      id="technician-workload"
      title="Carga de trabajo por técnico"
      description="Jobs creados en el periodo: total asignado, en proceso y completado."
      empty={!hasData}
      table={(
        <table>
          <caption>Carga de trabajo por técnico</caption>
          <thead><tr><th scope="col">Técnico</th><th scope="col">Total</th><th scope="col">En proceso</th><th scope="col">Completados</th></tr></thead>
          <tbody>{data.map((item) => (
            <tr key={item.technicianId}>
              <th scope="row">{item.technicianName}</th>
              <td>{formatNumber(item.totalJobs)}</td>
              <td>{formatNumber(item.inProgressJobs)}</td>
              <td>{formatNumber(item.completedJobs)}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    >
      <div className="admin-dashboard-chart__wide-content" style={{ minWidth }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} accessibilityLayer margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="technicianName" tick={{ fontSize: 10 }} interval={0} />
            <YAxis allowDecimals={false} width={36} />
            <Tooltip formatter={(value) => formatNumber(value)} />
            <Legend />
            <Bar dataKey="totalJobs" name="Total" fill="#64748b" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="inProgressJobs" name="En proceso" fill="#d97706" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="completedJobs" name="Completados" fill="#15803d" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartPanel>
  );
}

export default function DashboardCharts({ dashboard }) {
  return (
    <section className="admin-dashboard-charts" aria-label="Gráficas administrativas">
      <WorkOrdersStatusChart data={dashboard?.workOrdersByStatus ?? []} />
      <JobsStatusChart data={dashboard?.jobsByStatus ?? []} />
      <RevenueChart data={dashboard?.revenueByMonth ?? []} />
      <TopServicesChart data={dashboard?.topServices ?? []} />
      <div className="admin-dashboard-charts__wide">
        <TechnicianWorkloadChart data={dashboard?.technicianWorkload ?? []} />
      </div>
    </section>
  );
}
