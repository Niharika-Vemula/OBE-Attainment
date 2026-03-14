const colors = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-emerald-100 text-emerald-700',
  purple: 'bg-violet-100 text-violet-700',
  orange: 'bg-orange-100 text-orange-700',
  red:    'bg-rose-100 text-rose-600',
  slate:  'bg-slate-100 text-slate-600',
}

export default function Badge({ label, color = 'slate' }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.slate}`}>
      {label}
    </span>
  )
}
