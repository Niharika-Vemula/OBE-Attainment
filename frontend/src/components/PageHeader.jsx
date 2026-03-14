export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-7">
      <div>
        <h1 className="text-2xl font-bold text-indigo-900">{title}</h1>
        {subtitle && <p className="text-violet-400 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
